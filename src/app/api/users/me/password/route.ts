import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth, AuthError } from "@/lib/auth/auth-guard";
import bcrypt from "bcryptjs";
import { z } from "zod";

const Body = z.object({
  currentPassword: z.string().min(1),
  newPassword:     z.string().min(6),
});

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    const data    = Body.parse(await req.json());

    const user = await prisma.user.findUnique({
      where:  { id: payload.userId },
      select: { id: true, passwordHash: true },
    });

    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Verify current password
    const valid = await bcrypt.compare(data.currentPassword, user.passwordHash);
    if (!valid)
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });

    // Hash and save new password
    const passwordHash = await bcrypt.hash(data.newPassword, 10);
    await prisma.user.update({
      where: { id: payload.userId },
      data:  { passwordHash },
    });

    return NextResponse.json({ message: "Password changed successfully" });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}