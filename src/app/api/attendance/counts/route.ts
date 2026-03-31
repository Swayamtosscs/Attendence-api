import { NextRequest } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import AttendanceEventModel from "@/models/AttendanceEvent";
import UserModel from "@/models/User";
import { getSessionUser } from "@/lib/current-user";
import { handleApiError } from "@/lib/api-response";
import { errorResponse, jsonResponse } from "@/lib/http";

function parseDate(value: string | null): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function getDayRange(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return errorResponse("Unauthorized", { status: 401 });
    }

    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const userIdParam = searchParams.get("userId");
    const dateParam = searchParams.get("date");
    const startDate = parseDate(searchParams.get("startDate"));
    const endDate = parseDate(searchParams.get("endDate"));
    const includeTimestampsParam = searchParams.get("includeTimestamps");
    const includeTimestamps =
      includeTimestampsParam === null ||
      (includeTimestampsParam !== "0" && includeTimestampsParam !== "false");

    // Determine date range
    let dateFilter: { $gte: Date; $lt: Date } | undefined;
    if (dateParam) {
      const date = parseDate(dateParam);
      if (date) {
        const range = getDayRange(date);
        dateFilter = { $gte: range.start, $lt: range.end };
      }
    } else if (startDate || endDate) {
      const start = startDate ? getDayRange(startDate).start : new Date(0);
      const end = endDate
        ? getDayRange(endDate).end
        : new Date(start.getTime() + 365 * 24 * 60 * 60 * 1000);
      dateFilter = { $gte: start, $lt: end };
    } else {
      // Default to today
      const today = new Date();
      const range = getDayRange(today);
      dateFilter = { $gte: range.start, $lt: range.end };
    }

    // Build user filter
    let allowedUserIds: mongoose.Types.ObjectId[] = [];

    if (userIdParam) {
      if (!mongoose.Types.ObjectId.isValid(userIdParam)) {
        return errorResponse("Invalid user id", { status: 400 });
      }
      allowedUserIds = [new mongoose.Types.ObjectId(userIdParam)];
    } else if (sessionUser.role === "employee") {
      allowedUserIds = [new mongoose.Types.ObjectId(sessionUser.id)];
    } else if (sessionUser.role === "manager") {
      const managedUsers = (await UserModel.find({ manager: sessionUser.id })
        .select("_id")
        .lean()) as Array<{ _id: mongoose.Types.ObjectId }>;
      allowedUserIds = [
        new mongoose.Types.ObjectId(sessionUser.id),
        ...managedUsers.map((u) => new mongoose.Types.ObjectId(u._id))
      ];
    }
    // Admin can see all users

    // Build match filter
    const match: Record<string, unknown> = {
      date: dateFilter
    };

    if (allowedUserIds.length > 0) {
      match.user = { $in: allowedUserIds };
    }

    // Aggregate to get counts grouped by date, user, and location (single-pass grouping).
    // Timestamps can be heavy; keep them optional for faster reports.
    const groupStage: Record<string, unknown> = {
      _id: {
        date: "$date",
        user: "$user",
        locationKey: {
          $cond: [
            {
              $and: [
                { $ne: ["$location.latitude", null] },
                { $ne: ["$location.longitude", null] }
              ]
            },
            {
              $concat: [
                { $toString: "$location.latitude" },
                ",",
                { $toString: "$location.longitude" }
              ]
            },
            "no-location"
          ]
        }
      },
      location: { $first: "$location" },
      checkIns: {
        $sum: { $cond: [{ $eq: ["$type", "check-in"] }, 1, 0] }
      },
      checkOuts: {
        $sum: { $cond: [{ $eq: ["$type", "check-out"] }, 1, 0] }
      }
    };

    if (includeTimestamps) {
      groupStage.checkInTimestamps = {
        $push: {
          $cond: [{ $eq: ["$type", "check-in"] }, "$timestamp", "$$REMOVE"]
        }
      };
      groupStage.checkOutTimestamps = {
        $push: {
          $cond: [{ $eq: ["$type", "check-out"] }, "$timestamp", "$$REMOVE"]
        }
      };
    }

    const results = await AttendanceEventModel.aggregate([
      { $match: match },
      { $group: groupStage as any },
      {
        $project: {
          _id: 0,
          date: "$_id.date",
          userId: "$_id.user",
          location: {
            $cond: [
              {
                $and: [
                  { $ne: ["$location.latitude", null] },
                  { $ne: ["$location.longitude", null] }
                ]
              },
              "$location",
              null
            ]
          },
          checkIns: 1,
          checkOuts: 1,
          sessionsCompleted: { $min: ["$checkIns", "$checkOuts"] },
          openSession: { $gt: [{ $subtract: ["$checkIns", "$checkOuts"] }, 0] },
          ...(includeTimestamps
            ? { checkInTimestamps: 1, checkOutTimestamps: 1 }
            : {})
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user"
        }
      },
      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          date: 1,
          location: 1,
          checkIns: 1,
          checkOuts: 1,
          sessionsCompleted: 1,
          openSession: 1,
          ...(includeTimestamps
            ? { checkInTimestamps: 1, checkOutTimestamps: 1 }
            : {}),
          user: {
            id: "$user._id",
            name: "$user.name",
            email: "$user.email"
          }
        }
      },
      { $sort: { date: -1, "user.name": 1 } }
    ]);

    return jsonResponse({
      success: true,
      data: results
    });
  } catch (error) {
    return handleApiError("attendance/counts", error);
  }
}

