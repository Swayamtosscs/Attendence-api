import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/current-user";
import { handleApiError } from "@/lib/api-response";
import { errorResponse, jsonResponse } from "@/lib/http";
import { userFullReportQuerySchema } from "@/lib/validators";
import { getUserFullReport } from "@/lib/user-full-report";

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) return errorResponse("Unauthorized", { status: 401 });

    const { userId } = params;

    const parsed = userFullReportQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams)
    );
    const report = await getUserFullReport({
      sessionUser,
      userId,
      query: {
        startDate: parsed.startDate,
        endDate: parsed.endDate,
        includeEvents: parsed.includeEvents,
        includeOpenSession: parsed.includeOpenSession
      }
    });

    return jsonResponse({ success: true, data: report });
  } catch (error) {
    if ((error as any)?.message === "Invalid user id") {
      return errorResponse("Invalid user id", { status: 400 });
    }
    if ((error as any)?.statusCode === 403) {
      return errorResponse("Forbidden", { status: 403 });
    }
    if ((error as any)?.statusCode === 404) {
      return errorResponse("User not found", { status: 404 });
    }
    return handleApiError("user/full-report/get", error);
  }
}

