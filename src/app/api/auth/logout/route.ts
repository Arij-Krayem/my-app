import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { cookieName, clearRefreshCookie } from "@/lib/auth/cookies";
import { hashToken } from "@/lib/auth/auth";

export async function POST(req: NextRequest) {
  const token = req.cookies.get(cookieName())?.value;

  if (token) {
    await prisma.refreshToken.updateMany({
      where: { tokenHash: hashToken(token) },
      data: { revoked: true },
    });
  }

  const res = NextResponse.json({ ok: true });
  res.headers.set("Set-Cookie", clearRefreshCookie());
  return res;
}
