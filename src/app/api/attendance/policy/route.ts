import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { getSessionUser } from "@/lib/current-user";
import { assertRole } from "@/lib/permissions";
import { handleApiError } from "@/lib/api-response";
import { errorResponse, jsonResponse } from "@/lib/http";
import AttendancePolicyModel from "@/models/AttendancePolicy";
import { attendancePolicyUpsertSchema } from "@/lib/validators";

const DEFAULT_POLICY = {
  halfDayMinutes: 240,
  fullDayMinutes: 480
} as const;

export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) return errorResponse("Unauthorized", { status: 401 });

    await connectDB();

    const policyDoc = (await AttendancePolicyModel.findOne({}).lean()) as
      | { halfDayMinutes: number; fullDayMinutes: number }
      | null;
    const policy = policyDoc ?? DEFAULT_POLICY;

    return jsonResponse({
      success: true,
      data: {
        halfDayMinutes: policy.halfDayMinutes,
        fullDayMinutes: policy.fullDayMinutes
      }
    });
  } catch (error) {
    return handleApiError("attendance/policy/get", error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    assertRole(sessionUser, ["admin"]);

    const body = await request.json();
    const parsed = attendancePolicyUpsertSchema.parse(body);

    await connectDB();

    const policy = (await AttendancePolicyModel.findOneAndUpdate(
      {},
      { $set: parsed },
      { new: true, upsert: true }
    ).lean()) as { halfDayMinutes: number; fullDayMinutes: number };

    return jsonResponse({
      success: true,
      data: {
        halfDayMinutes: policy.halfDayMinutes,
        fullDayMinutes: policy.fullDayMinutes
      }
    });
  } catch (error) {
    return handleApiError("attendance/policy/put", error);
  }
}

