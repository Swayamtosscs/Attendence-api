import { NextRequest } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import SalarySlipModel from "@/models/SalarySlip";
import AttendanceModel from "@/models/Attendance";
import UserModel from "@/models/User";
import { getSessionUser } from "@/lib/current-user";
import { assertRole } from "@/lib/permissions";
import {
  salarySlipCreateSchema,
  salarySlipQuerySchema
} from "@/lib/validators";
import { handleApiError } from "@/lib/api-response";
import { errorResponse, jsonResponse } from "@/lib/http";

function getMonthDateRange(year: number, month: number): {
  start: Date;
  end: Date;
} {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return { start, end };
}

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return errorResponse("Unauthorized", { status: 401 });
    }

    await connectDB();

    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = salarySlipQuerySchema.parse(searchParams);

    const filter: Record<string, unknown> = {};

    if (parsed.month) {
      filter.month = parsed.month;
    }
    if (parsed.year) {
      filter.year = parsed.year;
    }

    if (sessionUser.role === "employee") {
      filter.user = sessionUser.id;
    } else if (parsed.userId) {
      if (!mongoose.Types.ObjectId.isValid(parsed.userId)) {
        return errorResponse("Invalid user id", { status: 400 });
      }
      filter.user = parsed.userId;
    }

    const slips = await SalarySlipModel.find(filter)
      .populate("user", "name email role department designation")
      .sort({ year: -1, month: -1 })
      .lean();

    return jsonResponse({
      success: true,
      data: slips.map((slip) => ({
        id: slip._id,
        user: slip.user,
        month: slip.month,
        year: slip.year,
        basicSalary: slip.basicSalary,
        earnings: slip.earnings,
        deductions: slip.deductions,
        grossEarnings: slip.grossEarnings,
        totalDeductions: slip.totalDeductions,
        netSalary: slip.netSalary,
        attendanceSummary: slip.attendanceSummary,
        status: slip.status,
        notes: slip.notes,
        createdAt: slip.createdAt,
        updatedAt: slip.updatedAt
      }))
    });
  } catch (error) {
    return handleApiError("salary/list", error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    assertRole(sessionUser, ["admin", "manager"]);

    const body = await request.json();
    const parsed = salarySlipCreateSchema.parse(body);

    if (!mongoose.Types.ObjectId.isValid(parsed.userId)) {
      return errorResponse("Invalid user id", { status: 400 });
    }

    await connectDB();

    const targetUser = await UserModel.findById(parsed.userId);
    if (!targetUser) {
      return errorResponse("Target user not found", { status: 404 });
    }

    if (
      sessionUser.role === "manager" &&
      targetUser.manager?.toString() !== sessionUser.id
    ) {
      return errorResponse("Forbidden", { status: 403 });
    }

    const { month, year } = parsed;
    const { start, end } = getMonthDateRange(year, month);

    const attendanceRecords = await AttendanceModel.find({
      user: parsed.userId,
      date: { $gte: start, $lte: end }
    }).lean();

    const presentDays = attendanceRecords.filter(
      (a) => a.status === "present"
    ).length;
    const halfDays = attendanceRecords.filter(
      (a) => a.status === "half-day"
    ).length;
    const absentDays = attendanceRecords.filter(
      (a) => a.status === "absent"
    ).length;
    const onLeaveDays = attendanceRecords.filter(
      (a) => a.status === "on-leave"
    ).length;

    const totalMinutes = attendanceRecords.reduce(
      (sum, record) => sum + (record.workDurationMinutes || 0),
      0
    );

    const earnings = parsed.earnings ?? [];
    const deductions = parsed.deductions ?? [];

    const grossEarnings =
      parsed.basicSalary +
      earnings.reduce((sum, item) => sum + item.amount, 0);
    const totalDeductions = deductions.reduce(
      (sum, item) => sum + item.amount,
      0
    );
    const netSalary = grossEarnings - totalDeductions;

    const existingSlip = await SalarySlipModel.findOne({
      user: parsed.userId,
      month,
      year
    });

    if (existingSlip) {
      existingSlip.basicSalary = parsed.basicSalary;
      existingSlip.earnings = earnings;
      existingSlip.deductions = deductions;
      existingSlip.grossEarnings = grossEarnings;
      existingSlip.totalDeductions = totalDeductions;
      existingSlip.netSalary = netSalary;
      existingSlip.attendanceSummary = {
        startDate: start,
        endDate: end,
        presentDays,
        halfDays,
        absentDays,
        onLeaveDays,
        totalMinutes
      };
      existingSlip.notes = parsed.notes;
      await existingSlip.save();

      return jsonResponse({
        success: true,
        data: {
          id: existingSlip._id,
          user: existingSlip.user,
          month: existingSlip.month,
          year: existingSlip.year,
          basicSalary: existingSlip.basicSalary,
          earnings: existingSlip.earnings,
          deductions: existingSlip.deductions,
          grossEarnings: existingSlip.grossEarnings,
          totalDeductions: existingSlip.totalDeductions,
          netSalary: existingSlip.netSalary,
          attendanceSummary: existingSlip.attendanceSummary,
          status: existingSlip.status,
          notes: existingSlip.notes
        }
      });
    }

    const slip = await SalarySlipModel.create({
      user: parsed.userId,
      month,
      year,
      basicSalary: parsed.basicSalary,
      earnings,
      deductions,
      grossEarnings,
      totalDeductions,
      netSalary,
      attendanceSummary: {
        startDate: start,
        endDate: end,
        presentDays,
        halfDays,
        absentDays,
        onLeaveDays,
        totalMinutes
      },
      status: "draft",
      notes: parsed.notes
    });

    return jsonResponse(
      {
        success: true,
        data: {
          id: slip._id,
          user: slip.user,
          month: slip.month,
          year: slip.year,
          basicSalary: slip.basicSalary,
          earnings: slip.earnings,
          deductions: slip.deductions,
          grossEarnings: slip.grossEarnings,
          totalDeductions: slip.totalDeductions,
          netSalary: slip.netSalary,
          attendanceSummary: slip.attendanceSummary,
          status: slip.status,
          notes: slip.notes
        }
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError("salary/create", error);
  }
}



