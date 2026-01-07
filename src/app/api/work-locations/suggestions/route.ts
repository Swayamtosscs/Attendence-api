import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import WorkLocationSuggestionModel from "@/models/WorkLocationSuggestion";
import { handleApiError } from "@/lib/api-response";
import { errorResponse, jsonResponse } from "@/lib/http";
import { getSessionUser } from "@/lib/current-user";
import { assertRole } from "@/lib/permissions";
import { workLocationSuggestionCreateSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser(false);
    if (!sessionUser) {
      return errorResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const parsed = workLocationSuggestionCreateSchema.parse(body);

    await connectDB();

    const suggestion = await WorkLocationSuggestionModel.create({
      name: parsed.name,
      latitude: parsed.latitude,
      longitude: parsed.longitude,
      radius: parsed.radius,
      notes: parsed.notes,
      createdBy: sessionUser.id
    });

    return jsonResponse(
      {
        success: true,
        message: "Location suggestion submitted successfully",
        data: {
          id: suggestion._id.toString(),
          name: suggestion.name,
          latitude: suggestion.latitude,
          longitude: suggestion.longitude,
          radius: suggestion.radius,
          notes: suggestion.notes,
          status: suggestion.status,
          createdAt: suggestion.createdAt,
          updatedAt: suggestion.updatedAt
        }
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      const zodError = error as any;
      const firstError = zodError.errors?.[0];
      if (firstError) {
        let errorMessage = "Invalid location suggestion data";
        if (firstError.path.includes("latitude")) {
          errorMessage = "Latitude must be between -90 and 90";
        } else if (firstError.path.includes("longitude")) {
          errorMessage = "Longitude must be between -180 and 180";
        } else if (firstError.path.includes("radius")) {
          errorMessage = "Radius must be between 1 and 10000 meters";
        } else if (firstError.path.includes("name")) {
          errorMessage = "Name is required";
        }
        return errorResponse(errorMessage, { status: 400 });
      }
    }
    return handleApiError("work-location-suggestions/create", error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser(false);
    if (!sessionUser) {
      return errorResponse("Unauthorized", { status: 401 });
    }

    // Only admin can see all suggestions
    assertRole(sessionUser, ["admin"]);

    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");

    const filter: Record<string, unknown> = {};
    if (status === "pending" || status === "approved" || status === "rejected") {
      filter.status = status;
    }

    const suggestions = await WorkLocationSuggestionModel.find(filter)
      .populate("createdBy", "name email")
      .populate("decidedBy", "name email")
      .sort({ createdAt: -1 })
      .lean();

    return jsonResponse({
      success: true,
      data: suggestions.map((sugg) => {
        const s = sugg as any;
        return {
          id: s._id.toString(),
          name: s.name,
          latitude: s.latitude,
          longitude: s.longitude,
          radius: s.radius,
          notes: s.notes,
          status: s.status,
          createdBy: s.createdBy
            ? {
                id: (s.createdBy as any)._id?.toString(),
                name: (s.createdBy as any).name,
                email: (s.createdBy as any).email
              }
            : undefined,
          decidedBy: s.decidedBy
            ? {
                id: (s.decidedBy as any)._id?.toString(),
                name: (s.decidedBy as any).name,
                email: (s.decidedBy as any).email
              }
            : undefined,
          decidedAt: s.decidedAt,
          decisionReason: s.decisionReason,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt
        };
      })
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return errorResponse("Forbidden", { status: 403 });
    }
    return handleApiError("work-location-suggestions/list", error);
  }
}


