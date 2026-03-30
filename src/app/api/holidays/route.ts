import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import HolidayModel from "@/models/Holiday";
import { getSessionUser } from "@/lib/current-user";
import { assertRole } from "@/lib/permissions";
import { handleApiError } from "@/lib/api-response";
import { errorResponse, jsonResponse } from "@/lib/http";
import { holidayCreateSchema, holidayQuerySchema } from "@/lib/validators";

function startOfDayUtc(input: string): Date {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) {
    throw new Error("Invalid holiday date");
  }
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    assertRole(sessionUser, ["admin"]);

    const body = await request.json();
    const parsed = holidayCreateSchema.parse(body);

    await connectDB();

    const date = startOfDayUtc(parsed.date);

    try {
      const holiday = await HolidayModel.create({
        date,
        name: parsed.name,
        type: parsed.type,
        description: parsed.description,
        createdBy: sessionUser.id
      });

      return jsonResponse(
        {
          success: true,
          data: holiday.toJSON()
        },
        { status: 201 }
      );
    } catch (e: any) {
      // Duplicate key (same date)
      if (e?.code === 11000) {
        return errorResponse("Holiday already exists for this date", {
          status: 409
        });
      }
      throw e;
    }
  } catch (error) {
    return handleApiError("holidays/create", error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser(false);
    if (!sessionUser) {
      return errorResponse("Unauthorized", { status: 401 });
    }

    const parsedQuery = holidayQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams)
    );

    const filter: Record<string, unknown> = {};
    if (parsedQuery.year && parsedQuery.month) {
      const start = new Date(Date.UTC(parsedQuery.year, parsedQuery.month - 1, 1));
      const end = new Date(Date.UTC(parsedQuery.year, parsedQuery.month, 0, 23, 59, 59, 999));
      filter.date = { $gte: start, $lte: end };
    } else if (parsedQuery.year) {
      const start = new Date(Date.UTC(parsedQuery.year, 0, 1));
      const end = new Date(Date.UTC(parsedQuery.year, 11, 31, 23, 59, 59, 999));
      filter.date = { $gte: start, $lte: end };
    }

    await connectDB();

    const holidays = await HolidayModel.find(filter)
      .populate("createdBy", "name email")
      .sort({ date: 1 })
      .lean();

    return jsonResponse({
      success: true,
      data: holidays.map((h: any) => ({
        id: h._id?.toString() ?? h.id?.toString(),
        date: h.date,
        name: h.name,
        type: h.type,
        description: h.description,
        createdBy: h.createdBy
          ? {
              id: h.createdBy._id?.toString(),
              name: h.createdBy.name,
              email: h.createdBy.email
            }
          : undefined,
        createdAt: h.createdAt,
        updatedAt: h.updatedAt
      }))
    });
  } catch (error) {
    return handleApiError("holidays/list", error);
  }
}

