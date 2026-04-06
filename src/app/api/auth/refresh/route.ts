import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookieName, refreshCookie } from "@/lib/cookies";
import { verifyRefreshToken, signAccessToken, signRefreshToken, hashToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get(cookieName())?.value;
    if (!token) {
      return NextResponse.json({ error: "No refresh token" }, { status: 401 });
    }

    try {
      verifyRefreshToken(token);
    } catch {
      return NextResponse.json({ error: "Invalid refresh token" }, { status: 401 });
    }

    const stored = await prisma.refreshToken.findUnique({
      where: { tokenHash: hashToken(token) },
      include: { user: true },
    });

    if (!stored || stored.revoked || stored.expiresAt < new Date()) {
      return NextResponse.json({ error: "Refresh token revoked/expired" }, { status: 401 });
    }

    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revoked: true },
    });

    const newRefresh = signRefreshToken({ userId: stored.userId });
    await prisma.refreshToken.create({
      data: {
        userId: stored.userId,
        tokenHash: hashToken(newRefresh),
        expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      },
    });

    const newAccess = signAccessToken({ userId: stored.userId, role: stored.user.role });

    console.log("[auth/refresh] issued new access token", {
      userId: stored.userId,
      role: stored.user.role,
    });

    const res = NextResponse.json({ accessToken: newAccess });
    res.headers.set("Set-Cookie", refreshCookie(newRefresh, 7 * 24 * 3600));
    return res;
  } catch (error) {
    console.error("[auth/refresh] failed", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
