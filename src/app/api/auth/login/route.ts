import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signAccessToken, signRefreshToken, hashToken } from "@/lib/auth";
import { refreshCookie } from "@/lib/cookies";

const Body = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  const { email, password } = Body.parse(await req.json());

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

  const accessToken = signAccessToken({ userId: user.id, role: user.role });
  const refreshToken = signRefreshToken({ userId: user.id });

  // store hashed refresh token
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000), // 7d (match env)
    },
  });

  const res = NextResponse.json({
    user: { id: user.id, email: user.email, role: user.role, name: user.name },
    accessToken,
  });

  // 7 days cookie
  res.headers.set("Set-Cookie", refreshCookie(refreshToken, 7 * 24 * 3600));
  return res;
}
