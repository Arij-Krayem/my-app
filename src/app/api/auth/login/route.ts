// src/app/api/auth/login/route.ts
// ─── Only 2 new checks added — everything else is identical to your original ──
import { NextRequest, NextResponse } from "next/server";
import { z }                         from "zod";
import bcrypt                        from "bcryptjs";
import { prisma }                    from "@/lib/db/prisma";
import { signAccessToken, signRefreshToken, hashToken, refreshTokenMaxAgeSeconds } from "@/lib/auth/auth";
import { refreshCookie }             from "@/lib/auth/cookies";

const Body = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

const LOGIN_USER_SELECT = {
  id:           true,
  email:        true,
  name:         true,
  avatarUrl:    true,
  passwordHash: true,
  role:         true,
  isApproved:   true,
  isActive:     true,
} as const;

export async function POST(req: NextRequest) {
  try {
    const { email, password } = Body.parse(await req.json());

    const user = await prisma.user.findUnique({
      where: { email },
      select: LOGIN_USER_SELECT,
    });
    if (!user)
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok)
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

    // ── NEW CHECK 1: block if not yet approved by admin ────────────────────
    if (!user.isApproved) {
      return NextResponse.json({
        error:           "pending_approval",
        message:         "Your account is pending admin approval. You will receive an email once your account is activated.",
        pendingApproval: true,
      }, { status: 403 });
    }

    // ── NEW CHECK 2: block if admin deactivated the account ────────────────
    if (!user.isActive) {
      return NextResponse.json({
        error:   "account_inactive",
        message: "Your account has been deactivated. Please contact your administrator.",
      }, { status: 403 });
    }

    // ── Everything below is identical to your original ─────────────────────
    const accessToken  = signAccessToken({ userId: user.id, role: user.role });
    const refreshToken = signRefreshToken({ userId: user.id });
    const refreshMaxAgeSeconds = refreshTokenMaxAgeSeconds();

    await prisma.refreshToken.create({
      data: {
        userId:    user.id,
        tokenHash: hashToken(refreshToken),
        expiresAt: new Date(Date.now() + refreshMaxAgeSeconds * 1000),
      },
    });

    const res = NextResponse.json({
      accessToken,
      user: { id: user.id, email: user.email, role: user.role, name: user.name, avatarUrl: user.avatarUrl },
    });

    res.headers.set("Set-Cookie", refreshCookie(refreshToken, refreshMaxAgeSeconds));
    return res;

  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    console.error("[login]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
