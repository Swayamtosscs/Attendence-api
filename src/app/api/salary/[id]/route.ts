import { NextRequest } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import SalarySlipModel from "@/models/SalarySlip";
import { getSessionUser } from "@/lib/current-user";
import { assertRole } from "@/lib/permissions";
import { handleApiError } from "@/lib/api-response";
import { errorResponse, jsonResponse } from "@/lib/http";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return errorResponse("Unauthorized", { status: 401 });
    }

    const { id } = params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse("Invalid salary slip id", { status: 400 });
    }

    await connectDB();

    const slip = await SalarySlipModel.findById(id)
      .populate("user", "name email role department designation")
      .lean() as any;

    if (!slip) {
      return errorResponse("Salary slip not found", { status: 404 });
    }

    // Check permissions: employees can only view their own salary slips
    if (sessionUser.role === "employee") {
      const userId = slip.user?._id?.toString() || slip.user?.toString() || slip.user;
      if (userId !== sessionUser.id) {
        return errorResponse("Forbidden", { status: 403 });
      }
    }

    return jsonResponse({
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
        notes: slip.notes,
        createdAt: slip.createdAt,
        updatedAt: slip.updatedAt
      }
    });
  } catch (error) {
    return handleApiError("salary/get", error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionUser = await getSessionUser();
    assertRole(sessionUser, ["admin", "manager"]);

    const { id } = params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse("Invalid salary slip id", { status: 400 });
    }

    const body = await request.json();
    const { status, notes } = body as {
      status?: "draft" | "finalized" | "paid";
      notes?: string;
    };

    await connectDB();

    const slip = await SalarySlipModel.findById(id);
    if (!slip) {
      return errorResponse("Salary slip not found", { status: 404 });
    }

    if (status) {
      slip.status = status;
    }
    if (typeof notes === "string") {
      slip.notes = notes;
    }

    await slip.save();

    return jsonResponse({
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
        notes: slip.notes,
        createdAt: slip.createdAt,
        updatedAt: slip.updatedAt
      }
    });
  } catch (error) {
    return handleApiError("salary/update", error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionUser = await getSessionUser();
    assertRole(sessionUser, ["admin"]);

    const { id } = params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse("Invalid salary slip id", { status: 400 });
    }

    await connectDB();

    const slip = await SalarySlipModel.findByIdAndDelete(id);
    if (!slip) {
      return errorResponse("Salary slip not found", { status: 404 });
    }

    return jsonResponse({
      success: true
    });
  } catch (error) {
    return handleApiError("salary/delete", error);
  }
}



