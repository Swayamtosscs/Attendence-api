import { NextRequest } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import AttendanceEventModel from "@/models/AttendanceEvent";
import UserModel from "@/models/User";
import { getSessionUser } from "@/lib/current-user";
import { handleApiError } from "@/lib/api-response";
import { errorResponse, jsonResponse } from "@/lib/http";

function getDayStart(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
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
    const daysParam = searchParams.get("days");

    let days = 7;
    if (daysParam) {
      const parsed = parseInt(daysParam, 10);
      if (!Number.isNaN(parsed) && parsed > 0) {
        days = Math.min(parsed, 365);
      }
    }

    const todayStart = getDayStart(new Date());
    const fromDate = new Date(todayStart);
    fromDate.setDate(fromDate.getDate() - (days - 1));

    // Build user filter (same logic pattern as attendance counts)
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
    // Admin can see all users if userId not specified

    const match: Record<string, unknown> = {
      date: { $gte: fromDate, $lte: todayStart }
    };

    if (allowedUserIds.length > 0) {
      match.user = { $in: allowedUserIds };
    }

    const results = await AttendanceEventModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            user: "$user",
            date: "$date",
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
            },
            type: "$type"
          },
          count: { $sum: 1 },
          location: { $first: "$location" }
        }
      },
      {
        $group: {
          _id: {
            user: "$_id.user",
            date: "$_id.date",
            locationKey: "$_id.locationKey"
          },
          location: { $first: "$location" },
          checkIns: {
            $sum: {
              $cond: [{ $eq: ["$_id.type", "check-in"] }, "$count", 0]
            }
          },
          checkOuts: {
            $sum: {
              $cond: [{ $eq: ["$_id.type", "check-out"] }, "$count", 0]
            }
          }
        }
      },
      {
        $group: {
          _id: {
            user: "$_id.user",
            date: "$_id.date"
          },
          locations: {
            $push: {
              location: "$location",
              checkIns: "$checkIns",
              checkOuts: "$checkOuts"
            }
          },
          totalCheckIns: { $sum: "$checkIns" },
          totalCheckOuts: { $sum: "$checkOuts" }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id.user",
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
          _id: 0,
          user: {
            id: "$user._id",
            name: "$user.name",
            email: "$user.email"
          },
          date: "$_id.date",
          totalCheckIns: 1,
          totalCheckOuts: 1,
          locations: 1
        }
      },
      { $sort: { date: -1, "user.name": 1 } }
    ]);

    return jsonResponse({
      success: true,
      data: results
    });
  } catch (error) {
    return handleApiError("attendance/history", error);
  }
}


