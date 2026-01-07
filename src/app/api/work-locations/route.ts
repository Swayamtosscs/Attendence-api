import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import WorkLocationModel from "@/models/WorkLocation";
import { handleApiError } from "@/lib/api-response";
import { errorResponse, jsonResponse } from "@/lib/http";
import { getSessionUser } from "@/lib/current-user";
import { workLocationCreateSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser(false);
    if (!sessionUser) {
      return errorResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const parsed = workLocationCreateSchema.parse(body);

    await connectDB();

    const workLocation = await WorkLocationModel.create({
      name: parsed.name,
      latitude: parsed.latitude,
      longitude: parsed.longitude,
      radius: parsed.radius,
      createdBy: sessionUser.id,
      isActive: true
    });

    return jsonResponse(
      {
        success: true,
        message: "Location saved successfully",
        data: {
          id: workLocation._id.toString(),
          name: workLocation.name,
          latitude: workLocation.latitude,
          longitude: workLocation.longitude,
          radius: workLocation.radius,
          createdAt: workLocation.createdAt,
          updatedAt: workLocation.updatedAt
        }
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      const zodError = error as any;
      const firstError = zodError.errors?.[0];
      if (firstError) {
        let errorMessage = "Invalid location data";
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
    return handleApiError("work-locations/create", error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser(false);
    if (!sessionUser) {
      return errorResponse("Unauthorized", { status: 401 });
    }

    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const includeInactive = searchParams.get("includeInactive") === "true";

    const filter: Record<string, unknown> = {};
    if (!includeInactive) {
      filter.isActive = true;
    }

    const workLocations = await WorkLocationModel.find(filter)
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .lean();

    return jsonResponse({
      success: true,
      data: workLocations.map((location) => {
        const loc = location as any;
        return {
          id: loc._id.toString(),
          name: loc.name,
          latitude: loc.latitude,
          longitude: loc.longitude,
          radius: loc.radius,
          createdBy: loc.createdBy
            ? {
                id: (loc.createdBy as any)._id?.toString(),
                name: (loc.createdBy as any).name,
                email: (loc.createdBy as any).email
              }
            : undefined,
          isActive: loc.isActive,
          createdAt: loc.createdAt,
          updatedAt: loc.updatedAt
        };
      })
    });
  } catch (error) {
    return handleApiError("work-locations/list", error);
  }
}

