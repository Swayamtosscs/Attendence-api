import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import UserModel from "@/models/User";
import { handleApiError } from "@/lib/api-response";
import { errorResponse, jsonResponse } from "@/lib/http";
import { signAuthToken, setAuthCookie, verifyPassword } from "@/lib/auth";
import { loginSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.parse(body);

    await connectDB();
    const user = await UserModel.findOne({ email: parsed.email });

    if (!user) {
      return errorResponse("Invalid credentials", { status: 401 });
    }

    const isPasswordValid = await verifyPassword(
      parsed.password,
      user.passwordHash
    );

    if (!isPasswordValid) {
      return errorResponse("Invalid credentials", { status: 401 });
    }

    // Enforce single-device login per user with TTL (no force takeover).
    // If already bound to another deviceId, allow new login only if previous device
    // has been inactive for DEVICE_LOCK_TTL_HOURS (default 24h).
    if (user.deviceId && user.deviceId !== parsed.deviceId) {
      const ttlHoursRaw = process.env.DEVICE_LOCK_TTL_HOURS;
      const ttlHours = Math.max(1, Number.parseInt(ttlHoursRaw ?? "24", 10) || 24);
      const ttlMs = ttlHours * 60 * 60 * 1000;

      const lastSeen = (user as any).lastSeenAt as Date | undefined;
      const lastLogin = user.lastLoginAt as Date | undefined;
      const lastActivity = lastSeen ?? lastLogin;

      if (lastActivity && Date.now() - lastActivity.getTime() > ttlMs) {
        // Expired: allow rebind to new device (e.g., app deleted without logout).
      } else {
        return errorResponse("Already logged in on another device", {
          status: 409
        });
      }
    }

    user.deviceId = parsed.deviceId;
    user.lastLoginAt = new Date();
    (user as any).lastSeenAt = new Date();
    (user as any).deviceIdBoundAt = new Date();
    await user.save();

    const token = signAuthToken({
      userId: user._id.toString(),
      role: user.role,
      email: user.email,
      deviceId: parsed.deviceId
    });

    setAuthCookie(token);

    return jsonResponse({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        designation: user.designation
      },
      token
    });
  } catch (error) {
    return handleApiError("auth/login", error);
  }
}

