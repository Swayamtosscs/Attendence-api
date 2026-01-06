import { NextRequest } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import WorkLocationModel from "@/models/WorkLocation";
import { handleApiError } from "@/lib/api-response";
import { errorResponse, jsonResponse } from "@/lib/http";
import { getSessionUser } from "@/lib/current-user";
import { assertRole } from "@/lib/permissions";

function ensureObjectId(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("Invalid location id");
  }
  return new mongoose.Types.ObjectId(id);
}

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionUser = await getSessionUser(false);
    if (!sessionUser) {
      return errorResponse("Unauthorized", { status: 401 });
    }

    // Only admin/manager can approve locations
    assertRole(sessionUser, ["admin", "manager"]);

    const locationId = ensureObjectId(params.id);

    await connectDB();

    const workLocation = await WorkLocationModel.findById(locationId);

    if (!workLocation) {
      return errorResponse("Location not found", { status: 404 });
    }

    if (workLocation.status === "approved" && workLocation.isActive) {
      return jsonResponse({
        success: true,
        message: "Location already approved",
        data: {
          id: workLocation._id.toString(),
          name: workLocation.name,
          latitude: workLocation.latitude,
          longitude: workLocation.longitude,
          radius: workLocation.radius,
          status: workLocation.status,
          isActive: workLocation.isActive,
          createdAt: workLocation.createdAt,
          updatedAt: workLocation.updatedAt
        }
      });
    }

    workLocation.status = "approved";
    workLocation.isActive = true;
    workLocation.approvedBy = new mongoose.Types.ObjectId(sessionUser.id);
    workLocation.approvedAt = new Date();

    await workLocation.save();

    return jsonResponse({
      success: true,
      message: "Location approved successfully",
      data: {
        id: workLocation._id.toString(),
        name: workLocation.name,
        latitude: workLocation.latitude,
        longitude: workLocation.longitude,
        radius: workLocation.radius,
        status: workLocation.status,
        isActive: workLocation.isActive,
        createdAt: workLocation.createdAt,
        updatedAt: workLocation.updatedAt
      }
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Invalid location id") {
      return errorResponse("Invalid location id", { status: 400 });
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return errorResponse("Forbidden", { status: 403 });
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse("Unauthorized", { status: 401 });
    }
    return handleApiError("work-locations/approve", error);
  }
}


