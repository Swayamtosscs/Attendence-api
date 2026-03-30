import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const AUTH_SECRET = process.env.AUTH_SECRET;

if (!AUTH_SECRET) {
  throw new Error("Missing environment variable AUTH_SECRET");
}

// Type assertion after runtime check
const AUTH_SECRET_STRING: string = AUTH_SECRET;

export const AUTH_COOKIE_NAME = "attendance_token";

export interface AuthTokenPayload {
  userId: string;
  role: string;
  email: string;
  deviceId?: string;
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export function verifyPassword(
  password: string,
  passwordHash: string
): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

export function signAuthToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, AUTH_SECRET_STRING, {
    expiresIn: "7d"
  });
}

export function verifyAuthToken(token: string): AuthTokenPayload {
  return jwt.verify(token, AUTH_SECRET_STRING) as AuthTokenPayload;
}

export function setAuthCookie(token: string): void {
  cookies().set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7 // 7 days
  });
}

export function clearAuthCookie(): void {
  cookies().delete(AUTH_COOKIE_NAME);
}

export function getAuthTokenFromRequest(): string | null {
  const cookieStore = cookies();
  const cookieToken = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (cookieToken) {
    return cookieToken;
  }
  return null;
}


