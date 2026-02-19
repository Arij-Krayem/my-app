import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookieName, clearRefreshCookie } from "@/lib/cookies";
import { hashToken } from "@/lib/auth";

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
