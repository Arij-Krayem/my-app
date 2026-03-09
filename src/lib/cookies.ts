import { serialize } from "cookie";

const COOKIE_NAME = process.env.REFRESH_COOKIE_NAME ?? "refresh_token";
const COOKIE_SECURE = process.env.COOKIE_SECURE === "true";

export function refreshCookie(token: string, maxAgeSeconds: number) {
  return serialize(COOKIE_NAME, token, {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSeconds,
  });
}

export function clearRefreshCookie() {
  return serialize(COOKIE_NAME, "", {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export function cookieName() {
  return COOKIE_NAME;
}
