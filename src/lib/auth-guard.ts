import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

export type AccessPayload = {
  userId: string;
  role: "MARKETER" | "AGENCY_ADMIN";
};

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function getBearerToken(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!auth) return null;

  const [type, token] = auth.split(" ");
  if (type !== "Bearer" || !token) return null;

  return token;
}

export function requireAuth(req: NextRequest): AccessPayload {
  const token = getBearerToken(req);
  if (!token) throw new AuthError("Missing Authorization header", 401);

  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) throw new AuthError("Server misconfigured: JWT_ACCESS_SECRET missing", 500);

  try {
    const payload = jwt.verify(token, secret) as AccessPayload;

    // basic shape check
    if (!payload?.userId || !payload?.role) {
      throw new AuthError("Invalid token payload", 401);
    }

    return payload;
  } catch {
    throw new AuthError("Invalid/expired access token", 401);
  }
}

export function requireAdmin(req: NextRequest): AccessPayload {
  const payload = requireAuth(req);
  if (payload.role !== "AGENCY_ADMIN") {
    throw new AuthError("Forbidden (admin only)", 403);
  }
  return payload;
}