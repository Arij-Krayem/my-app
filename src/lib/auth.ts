import jwt, { type SignOptions } from "jsonwebtoken";
import crypto from "crypto";
import type { NextRequest } from "next/server";

function mustGetEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

const ACCESS_SECRET = mustGetEnv("JWT_ACCESS_SECRET");
const REFRESH_SECRET = mustGetEnv("JWT_REFRESH_SECRET");

type ExpiresIn = SignOptions["expiresIn"];

const ACCESS_EXPIRES_IN: ExpiresIn =
  (process.env.ACCESS_TOKEN_EXPIRES_IN ?? "15m") as ExpiresIn;

const REFRESH_EXPIRES_IN: ExpiresIn =
  (process.env.REFRESH_TOKEN_EXPIRES_IN ?? "7d") as ExpiresIn;

export type AccessPayload = { userId: string; role: "MARKETER" | "AGENCY_ADMIN" };
export type RefreshPayload = { userId: string };

export function signAccessToken(payload: AccessPayload) {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES_IN });
}

export function signRefreshToken(payload: RefreshPayload) {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN });
}

export function verifyAccessToken(token: string): AccessPayload {
  return jwt.verify(token, ACCESS_SECRET) as AccessPayload;
}

export function verifyRefreshToken(token: string): RefreshPayload {
  return jwt.verify(token, REFRESH_SECRET) as RefreshPayload;
}

// Store only hash of refresh tokens in DB
export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function getBearer(req: NextRequest) {
  const h = req.headers.get("authorization");
  if (!h?.startsWith("Bearer ")) return null;
  return h.slice("Bearer ".length);
}