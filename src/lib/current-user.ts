import { headers } from "next/headers";
import { connectDB } from "./db";
import { getAuthTokenFromRequest, verifyAuthToken } from "./auth";
import UserModel, { UserDocument } from "@/models/User";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export async function getSessionUser(
  requireAuth = true
): Promise<SessionUser | null> {
  const headerStore = headers();
  const authHeader = headerStore.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : null;

  const cookieToken = getAuthTokenFromRequest();

  const token = bearerToken ?? cookieToken;

  if (!token) {
    if (requireAuth) {
      throw new Error("Unauthorized");
    }
    return null;
  }

  let payload;
  try {
    payload = verifyAuthToken(token);
  } catch (error) {
    if (requireAuth) {
      throw new Error("Unauthorized");
    }
    return null;
  }
  await connectDB();
  const userDoc = await UserModel.findById(payload.userId).lean<UserDocument>();
  if (!userDoc) {
    if (requireAuth) {
      throw new Error("Unauthorized");
    }
    return null;
  }

  // Enforce single-device login when deviceId is set for the user.
  // If userDoc.deviceId exists, the JWT payload must contain the same deviceId.
  if (userDoc.deviceId) {
    const payloadDeviceId = (payload as { deviceId?: string }).deviceId;
    if (!payloadDeviceId || payloadDeviceId !== userDoc.deviceId) {
      if (requireAuth) {
        throw new Error("Unauthorized");
      }
      return null;
    }
  }

  // Update lastSeenAt for the bound device (best-effort, non-blocking).
  // This powers TTL-based unlock when app is deleted without logout.
  try {
    const payloadDeviceId = (payload as { deviceId?: string }).deviceId;
    if (payloadDeviceId && userDoc.deviceId && payloadDeviceId === userDoc.deviceId) {
      await UserModel.updateOne(
        { _id: userDoc._id },
        { $set: { lastSeenAt: new Date() } }
      );
    }
  } catch {
    // ignore
  }

  return {
    id: userDoc._id.toString(),
    email: userDoc.email,
    name: userDoc.name,
    role: userDoc.role
  };
}

