import { NextRequest } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import WorkLocationSuggestionModel from "@/models/WorkLocationSuggestion";
import WorkLocationModel from "@/models/WorkLocation";
import { handleApiError } from "@/lib/api-response";
import { errorResponse, jsonResponse } from "@/lib/http";
import { getSessionUser } from "@/lib/current-user";
import { assertRole } from "@/lib/permissions";
import { workLocationSuggestionDecisionSchema } from "@/lib/validators";

function ensureObjectId(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("Invalid suggestion id");
  }
  return new mongoose.Types.ObjectId(id);
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionUser = await getSessionUser(false);
    if (!sessionUser) {
      return errorResponse("Unauthorized", { status: 401 });
    }

    assertRole(sessionUser, ["admin"]);

    const suggestionId = ensureObjectId(params.id);

    await connectDB();
    const suggestion = await WorkLocationSuggestionModel.findById(suggestionId)
      .populate("createdBy", "name email")
      .populate("decidedBy", "name email")
      .lean();

    if (!suggestion) {
      return errorResponse("Suggestion not found", { status: 404 });
    }

    const s = suggestion as any;

    return jsonResponse({
      success: true,
      data: {
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
      }
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Invalid suggestion id") {
      return errorResponse("Invalid suggestion id", { status: 400 });
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return errorResponse("Forbidden", { status: 403 });
    }
    return handleApiError("work-location-suggestions/get", error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionUser = await getSessionUser(false);
    if (!sessionUser) {
      return errorResponse("Unauthorized", { status: 401 });
    }

    assertRole(sessionUser, ["admin"]);

    const suggestionId = ensureObjectId(params.id);
    const body = await request.json();
    const parsed = workLocationSuggestionDecisionSchema.parse(body);

    await connectDB();
    const suggestion = await WorkLocationSuggestionModel.findById(suggestionId);

    if (!suggestion) {
      return errorResponse("Suggestion not found", { status: 404 });
    }

    if (suggestion.status !== "pending") {
      return errorResponse("Suggestion already processed", { status: 400 });
    }

    suggestion.status = parsed.status;
    suggestion.decidedBy = new mongoose.Types.ObjectId(sessionUser.id);
    suggestion.decidedAt = new Date();
    suggestion.decisionReason = parsed.reason;

    let createdLocation: {
      id: string;
      name: string;
      latitude: number;
      longitude: number;
      radius: number;
      createdAt: Date;
      updatedAt: Date;
    } | null = null;

    if (parsed.status === "approved") {
      const workLocation = await WorkLocationModel.create({
        name: suggestion.name,
        latitude: suggestion.latitude,
        longitude: suggestion.longitude,
        radius: suggestion.radius,
        createdBy: suggestion.createdBy,
        isActive: true
      });

      createdLocation = {
        id: workLocation._id.toString(),
        name: workLocation.name,
        latitude: workLocation.latitude,
        longitude: workLocation.longitude,
        radius: workLocation.radius,
        createdAt: workLocation.createdAt,
        updatedAt: workLocation.updatedAt
      };
    }

    await suggestion.save();

    return jsonResponse({
      success: true,
      message:
        parsed.status === "approved"
          ? "Suggestion approved and location created"
          : "Suggestion rejected",
      data: {
        suggestion: {
          id: suggestion._id.toString(),
          name: suggestion.name,
          latitude: suggestion.latitude,
          longitude: suggestion.longitude,
          radius: suggestion.radius,
          notes: suggestion.notes,
          status: suggestion.status,
          decidedAt: suggestion.decidedAt,
          decisionReason: suggestion.decisionReason
        },
        createdLocation
      }
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Invalid suggestion id") {
      return errorResponse("Invalid suggestion id", { status: 400 });
    }
    if (error instanceof Error && error.name === "ZodError") {
      const zodError = error as any;
      const firstError = zodError.errors?.[0];
      if (firstError) {
        let errorMessage = "Invalid decision data";
        if (firstError.path.includes("status")) {
          errorMessage = "Status must be approved or rejected";
        }
        return errorResponse(errorMessage, { status: 400 });
      }
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return errorResponse("Forbidden", { status: 403 });
    }
    return handleApiError("work-location-suggestions/decision", error);
  }
}


