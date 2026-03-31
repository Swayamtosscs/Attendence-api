import { NextRequest } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { getSessionUser } from "@/lib/current-user";
import { assertAuthenticated } from "@/lib/permissions";
import { handleApiError } from "@/lib/api-response";
import { errorResponse, jsonResponse } from "@/lib/http";
import AttendanceEventModel from "@/models/AttendanceEvent";
import AttendanceModel from "@/models/Attendance";
import AttendancePolicyModel from "@/models/AttendancePolicy";
import UserModel from "@/models/User";
import {
  attendanceWorkHoursQuerySchema,
  attendanceWorkHoursUpdateSchema
} from "@/lib/validators";

function getDayRange(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

function parseLooseDate(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

async function getAllowedUserIds(sessionUser: {
  id: string;
  role: string;
}) {
  if (sessionUser.role === "admin") return null; // any user allowed
  if (sessionUser.role === "employee") return [sessionUser.id];

  const managedUsers = (await UserModel.find({ manager: sessionUser.id })
    .select("_id")
    .lean()) as Array<{ _id: mongoose.Types.ObjectId }>;

  return [sessionUser.id, ...managedUsers.map((u) => u._id.toString())];
}

function computeWorkedMinutesFromEvents(
  events: Array<{ type: "check-in" | "check-out"; timestamp: Date }>,
  includeOpenSession: boolean,
  now: Date
) {
  let openCheckIn: Date | null = null;
  let totalMs = 0;

  for (const e of events) {
    if (e.type === "check-in") {
      openCheckIn = e.timestamp;
      continue;
    }
    if (e.type === "check-out" && openCheckIn) {
      const diff = e.timestamp.getTime() - openCheckIn.getTime();
      if (diff > 0) totalMs += diff;
      openCheckIn = null;
    }
  }

  if (includeOpenSession && openCheckIn) {
    const diff = now.getTime() - openCheckIn.getTime();
    if (diff > 0) totalMs += diff;
  }

  const minutes = Math.round(totalMs / (1000 * 60));
  return { minutes, openCheckInAt: openCheckIn };
}

async function getPolicy() {
  const policy = (await AttendancePolicyModel.findOne({}).lean()) as
    | { halfDayMinutes: number; fullDayMinutes: number }
    | null;
  return (
    policy ?? {
      halfDayMinutes: 240,
      fullDayMinutes: 480
    }
  );
}

function minutesToStatus(
  minutes: number,
  policy: { halfDayMinutes: number; fullDayMinutes: number }
): "present" | "half-day" | "absent" {
  if (minutes >= policy.fullDayMinutes) return "present";
  if (minutes >= policy.halfDayMinutes) return "half-day";
  return "absent";
}

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) return errorResponse("Unauthorized", { status: 401 });

    await connectDB();

    const parsed = attendanceWorkHoursQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams)
    );

    const allowedUserIds = await getAllowedUserIds(sessionUser);

    const targetUserId = parsed.userId ?? sessionUser.id;
    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      return errorResponse("Invalid user id", { status: 400 });
    }
    if (allowedUserIds && !allowedUserIds.includes(targetUserId)) {
      return errorResponse("Forbidden", { status: 403 });
    }

    const targetDate = parseLooseDate(parsed.date) ?? new Date();
    const { start, end } = getDayRange(targetDate);
    const now = new Date();

    const events = (await AttendanceEventModel.find({
      user: targetUserId,
      timestamp: { $gte: start, $lt: end }
    })
      .sort({ timestamp: 1 })
      .select("type timestamp")
      .lean()) as Array<{ type: "check-in" | "check-out"; timestamp: Date }>;

    const computed = computeWorkedMinutesFromEvents(
      events,
      parsed.includeOpenSession ?? false,
      now
    );

    const policy = await getPolicy();
    const status = parsed.applyPolicy ? minutesToStatus(computed.minutes, policy) : undefined;

    return jsonResponse({
      success: true,
      data: {
        userId: targetUserId,
        date: start.toISOString(),
        workDurationMinutes: computed.minutes,
        workDurationHours: Number((computed.minutes / 60).toFixed(2)),
        status,
        policy: parsed.applyPolicy ? policy : undefined,
        totalEvents: events.length,
        openSession: computed.openCheckInAt
          ? { checkInAt: computed.openCheckInAt }
          : null
      }
    });
  } catch (error) {
    return handleApiError("attendance/work-hours/get", error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    assertAuthenticated(sessionUser);

    const body = await request.json();
    const parsed = attendanceWorkHoursUpdateSchema.parse(body);

    await connectDB();

    const allowedUserIds = await getAllowedUserIds(sessionUser);
    const targetUserId = parsed.userId ?? sessionUser.id;

    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      return errorResponse("Invalid user id", { status: 400 });
    }
    if (allowedUserIds && !allowedUserIds.includes(targetUserId)) {
      return errorResponse("Forbidden", { status: 403 });
    }

    const targetDate = parseLooseDate(parsed.date) ?? new Date();
    const { start, end } = getDayRange(targetDate);
    const now = new Date();

    const events = (await AttendanceEventModel.find({
      user: targetUserId,
      timestamp: { $gte: start, $lt: end }
    })
      .sort({ timestamp: 1 })
      .select("type timestamp")
      .lean()) as Array<{ type: "check-in" | "check-out"; timestamp: Date }>;

    const computed = computeWorkedMinutesFromEvents(
      events,
      parsed.includeOpenSession,
      now
    );

    const policy = await getPolicy();
    const computedStatus = parsed.applyPolicy
      ? minutesToStatus(computed.minutes, policy)
      : undefined;

    const existingAttendance = await AttendanceModel.findOne({
      user: targetUserId,
      date: { $gte: start, $lt: end }
    });

    if (!existingAttendance) {
      return errorResponse("Attendance record not found for that day", {
        status: 404
      });
    }

    existingAttendance.workDurationMinutes = computed.minutes;

    if (parsed.applyPolicy && computedStatus) {
      if (existingAttendance.status !== "on-leave" || parsed.forceOverrideStatus) {
        existingAttendance.status = computedStatus;
      }
    }

    await existingAttendance.save();

    return jsonResponse({
      success: true,
      data: {
        attendanceId: existingAttendance._id,
        userId: targetUserId,
        date: start.toISOString(),
        workDurationMinutes: existingAttendance.workDurationMinutes,
        workDurationHours: Number((existingAttendance.workDurationMinutes / 60).toFixed(2)),
        status: existingAttendance.status,
        appliedPolicy: parsed.applyPolicy ? policy : null,
        totalEvents: events.length,
        openSession: computed.openCheckInAt
          ? { checkInAt: computed.openCheckInAt }
          : null
      }
    });
  } catch (error) {
    return handleApiError("attendance/work-hours/post", error);
  }
}

