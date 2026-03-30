import { NextRequest } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import HolidayModel from "@/models/Holiday";
import { getSessionUser } from "@/lib/current-user";
import { assertRole } from "@/lib/permissions";
import { handleApiError } from "@/lib/api-response";
import { errorResponse, jsonResponse } from "@/lib/http";
import { holidayUpdateSchema } from "@/lib/validators";

function ensureObjectId(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("Invalid holiday id");
  }
  return new mongoose.Types.ObjectId(id);
}

function startOfDayUtc(input: string): Date {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) {
    throw new Error("Invalid holiday date");
  }
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionUser = await getSessionUser();
    assertRole(sessionUser, ["admin"]);

    const holidayId = ensureObjectId(params.id);
    const body = await request.json();
    const parsed = holidayUpdateSchema.parse(body);

    await connectDB();
    const holiday = await HolidayModel.findById(holidayId);
    if (!holiday) {
      return errorResponse("Holiday not found", { status: 404 });
    }

    if (parsed.date !== undefined) {
      (holiday as any).date = startOfDayUtc(parsed.date);
    }
    if (parsed.name !== undefined) {
      holiday.name = parsed.name;
    }
    if (parsed.type !== undefined) {
      (holiday as any).type = parsed.type;
    }
    if (parsed.description !== undefined) {
      (holiday as any).description = parsed.description;
    }

    try {
      await holiday.save();
    } catch (e: any) {
      if (e?.code === 11000) {
        return errorResponse("Holiday already exists for this date", {
          status: 409
        });
      }
      throw e;
    }

    return jsonResponse({ success: true, data: holiday.toJSON() });
  } catch (error) {
    if (error instanceof Error && error.message === "Invalid holiday id") {
      return errorResponse("Invalid holiday id", { status: 400 });
    }
    return handleApiError("holidays/update", error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionUser = await getSessionUser();
    assertRole(sessionUser, ["admin"]);

    const holidayId = ensureObjectId(params.id);

    await connectDB();
    const deleted = await HolidayModel.findByIdAndDelete(holidayId);
    if (!deleted) {
      return errorResponse("Holiday not found", { status: 404 });
    }
    return jsonResponse({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Invalid holiday id") {
      return errorResponse("Invalid holiday id", { status: 400 });
    }
    return handleApiError("holidays/delete", error);
  }
}

