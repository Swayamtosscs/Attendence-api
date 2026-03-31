import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import UserModel from "@/models/User";
import AttendanceModel from "@/models/Attendance";
import AttendanceEventModel from "@/models/AttendanceEvent";
import LeaveRequestModel from "@/models/LeaveRequest";
import HolidayModel from "@/models/Holiday";

export type FullReportQuery = {
  startDate?: string;
  endDate?: string;
  includeOpenSession?: boolean;
  includeEvents?: boolean;
};

export type SessionUserLike = {
  id: string;
  role?: string;
};

function startOfDayLocal(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function startOfDayUtc(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function endOfDayUtc(d: Date) {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999)
  );
}

function computeWorkedMinutesFromEvents(
  events: Array<{ type: "check-in" | "check-out"; timestamp: Date }>,
  includeOpenSession: boolean,
  now: Date
) {
  let openCheckIn: Date | null = null;
  let totalMs = 0;

  const sessions: Array<{
    checkInAt: Date;
    checkOutAt?: Date;
    minutes: number;
  }> = [];

  for (const e of events) {
    if (e.type === "check-in") {
      openCheckIn = e.timestamp;
      continue;
    }
    if (e.type === "check-out" && openCheckIn) {
      const diff = e.timestamp.getTime() - openCheckIn.getTime();
      const minutes = diff > 0 ? Math.round(diff / (1000 * 60)) : 0;
      if (diff > 0) totalMs += diff;
      sessions.push({ checkInAt: openCheckIn, checkOutAt: e.timestamp, minutes });
      openCheckIn = null;
    }
  }

  if (openCheckIn) {
    if (includeOpenSession) {
      const diff = now.getTime() - openCheckIn.getTime();
      const minutes = diff > 0 ? Math.round(diff / (1000 * 60)) : 0;
      if (diff > 0) totalMs += diff;
      sessions.push({ checkInAt: openCheckIn, minutes });
    } else {
      sessions.push({ checkInAt: openCheckIn, minutes: 0 });
    }
  }

  const minutes = Math.round(totalMs / (1000 * 60));
  return { minutes, sessions };
}

function expandLeaveDaysInRange(
  leaveStart: Date,
  leaveEnd: Date,
  rangeStartLocal: Date,
  rangeEndLocal: Date
) {
  const days: string[] = [];
  const s = startOfDayLocal(leaveStart);
  const e = startOfDayLocal(leaveEnd);
  let cur = s;
  while (cur <= e) {
    if (cur >= rangeStartLocal && cur <= rangeEndLocal) {
      days.push(cur.toISOString().slice(0, 10));
    }
    cur = addDays(cur, 1);
  }
  return days;
}

export async function getUserFullReport(params: {
  sessionUser: SessionUserLike;
  userId: string;
  query: FullReportQuery;
}) {
  const { sessionUser, userId, query } = params;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid user id");
  }

  await connectDB();

  // Permission: admin OR self OR manager (for managed users)
  if (sessionUser.role !== "admin" && sessionUser.id !== userId) {
    if (sessionUser.role !== "manager") {
      const e = new Error("Forbidden");
      (e as any).statusCode = 403;
      throw e;
    }
    const target = (await UserModel.findById(userId)
      .select("manager")
      .lean()) as { manager?: mongoose.Types.ObjectId } | null;
    if (!target) {
      const e = new Error("User not found");
      (e as any).statusCode = 404;
      throw e;
    }
    if (target.manager?.toString() !== sessionUser.id) {
      const e = new Error("Forbidden");
      (e as any).statusCode = 403;
      throw e;
    }
  }

  const now = new Date();
  const endDate = query.endDate ? new Date(query.endDate) : now;
  const startDate = query.startDate
    ? new Date(query.startDate)
    : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

  const rangeStartLocal = startOfDayLocal(startDate);
  const rangeEndLocal = startOfDayLocal(endDate);
  const rangeEndLocalExclusive = addDays(rangeEndLocal, 1);

  const [user, attendanceRecords, events, leaveRequests, holidays] =
    await Promise.all([
      UserModel.findById(userId)
        .select("name email role department designation manager")
        .populate("manager", "name email")
        .lean(),
      AttendanceModel.find({
        user: userId,
        date: { $gte: rangeStartLocal, $lt: rangeEndLocalExclusive }
      })
        .sort({ date: 1 })
        .lean(),
      AttendanceEventModel.find({
        user: userId,
        date: { $gte: rangeStartLocal, $lt: rangeEndLocalExclusive }
      })
        .sort({ timestamp: 1 })
        .select("type timestamp date location deviceInfo notes")
        .lean(),
      LeaveRequestModel.find({
        user: userId,
        $or: [
          { startDate: { $lte: endDate }, endDate: { $gte: startDate } },
          {
            startDate: { $lte: rangeEndLocalExclusive },
            endDate: { $gte: rangeStartLocal }
          }
        ]
      })
        .sort({ createdAt: -1 })
        .lean(),
      HolidayModel.find({
        date: {
          $gte: startOfDayUtc(rangeStartLocal),
          $lte: endOfDayUtc(rangeEndLocal)
        }
      })
        .sort({ date: 1 })
        .lean()
    ]);

  if (!user) {
    const e = new Error("User not found");
    (e as any).statusCode = 404;
    throw e;
  }

  const attendanceByDay = new Map<string, any>();
  for (const a of attendanceRecords as any[]) {
    attendanceByDay.set(new Date(a.date).toISOString().slice(0, 10), a);
  }

  const eventsByDay = new Map<
    string,
    Array<{ type: "check-in" | "check-out"; timestamp: Date }>
  >();
  for (const e of events as any[]) {
    const dayKey = new Date(e.date).toISOString().slice(0, 10);
    const arr = eventsByDay.get(dayKey) ?? [];
    arr.push({ type: e.type, timestamp: e.timestamp });
    eventsByDay.set(dayKey, arr);
  }

  const includeOpenSession = query.includeOpenSession ?? false;
  const includeEvents = query.includeEvents ?? true;

  const todayKey = startOfDayLocal(now).toISOString().slice(0, 10);

  const days: Array<{
    date: string;
    status?: string;
    workDurationMinutes: number;
    workDurationHours: number;
    firstCheckInAt: Date | null;
    lastCheckOutAt: Date | null;
    sessions: Array<{ checkInAt: Date; checkOutAt?: Date; minutes: number }>;
  }> = [];

  let totalMinutes = 0;
  let presentDays = 0;
  let halfDays = 0;
  let absentDays = 0;
  let onLeaveDays = 0;

  for (
    let cur = new Date(rangeStartLocal);
    cur <= rangeEndLocal;
    cur = addDays(cur, 1)
  ) {
    const dayKey = cur.toISOString().slice(0, 10);
    const attendance = attendanceByDay.get(dayKey);
    const dayEvents = eventsByDay.get(dayKey) ?? [];

    const computed = computeWorkedMinutesFromEvents(
      dayEvents,
      includeOpenSession && dayKey === todayKey,
      now
    );

    const minutes = attendance?.workDurationMinutes ?? computed.minutes ?? 0;
    totalMinutes += minutes;

    const status = attendance?.status;
    if (status === "present") presentDays += 1;
    else if (status === "half-day") halfDays += 1;
    else if (status === "absent") absentDays += 1;
    else if (status === "on-leave") onLeaveDays += 1;

    const firstCheckInAt =
      dayEvents.find((x) => x.type === "check-in")?.timestamp ?? null;
    const lastCheckOutAt =
      [...dayEvents].reverse().find((x) => x.type === "check-out")?.timestamp ??
      null;

    days.push({
      date: dayKey,
      status,
      workDurationMinutes: minutes,
      workDurationHours: Number((minutes / 60).toFixed(2)),
      firstCheckInAt,
      lastCheckOutAt,
      sessions: includeEvents ? computed.sessions : []
    });
  }

  const leaveApproved = (leaveRequests as any[]).filter((l) => l.status === "approved");
  const leavePending = (leaveRequests as any[]).filter((l) => l.status === "pending");
  const leaveRejected = (leaveRequests as any[]).filter((l) => l.status === "rejected");

  const leaveDaysSet = new Set<string>();
  for (const l of leaveApproved) {
    for (const day of expandLeaveDaysInRange(
      new Date(l.startDate),
      new Date(l.endDate),
      rangeStartLocal,
      rangeEndLocal
    )) {
      leaveDaysSet.add(day);
    }
  }

  return {
    user,
    range: {
      startDate: rangeStartLocal.toISOString().slice(0, 10),
      endDate: rangeEndLocal.toISOString().slice(0, 10)
    },
    totals: {
      totalMinutes,
      totalHours: Number((totalMinutes / 60).toFixed(2)),
      presentDays,
      halfDays,
      absentDays,
      onLeaveDays
    },
    holidays: {
      count: (holidays as any[]).length,
      list: holidays
    },
    leaves: {
      totalRequests: (leaveRequests as any[]).length,
      approvedRequests: leaveApproved.length,
      pendingRequests: leavePending.length,
      rejectedRequests: leaveRejected.length,
      approvedLeaveDaysCount: leaveDaysSet.size,
      list: leaveRequests
    },
    attendance: {
      days
    }
  };
}

