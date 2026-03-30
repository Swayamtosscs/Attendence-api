import { clearAuthCookie, getAuthTokenFromRequest, verifyAuthToken } from "@/lib/auth";
import { headers } from "next/headers";
import { jsonResponse } from "@/lib/http";
import { connectDB } from "@/lib/db";
import UserModel from "@/models/User";

export async function POST() {
  // Unlock single-device login when logging out from the currently bound device.
  try {
    const headerStore = headers();
    const authHeader = headerStore.get("authorization");
    const bearerToken = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    const token = bearerToken ?? getAuthTokenFromRequest();
    if (token) {
      const payload = verifyAuthToken(token);
      if (payload.deviceId) {
        await connectDB();
        const user = await UserModel.findById(payload.userId);
        if (user && user.deviceId === payload.deviceId) {
          user.deviceId = undefined;
          await user.save();
        }
      }
    }
  } catch (_) {
    // Ignore unlock failures; still clear cookie and return success.
  }

  clearAuthCookie();
  return jsonResponse({ success: true });
}



