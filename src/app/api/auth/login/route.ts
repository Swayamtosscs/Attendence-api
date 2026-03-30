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

    // Enforce single-device login per user.
    // If this user is already bound to another deviceId, block login.
    if (user.deviceId && user.deviceId !== parsed.deviceId) {
      return errorResponse("Already logged in on another device", {
        status: 409
      });
    }

    user.deviceId = parsed.deviceId;
    user.lastLoginAt = new Date();
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

