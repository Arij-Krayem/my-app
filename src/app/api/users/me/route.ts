import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, AuthError } from "@/lib/auth-guard";
import { z } from "zod";

const Body = z.object({
  name:  z.string().min(1).optional(),
  email: z.string().email().optional(),
  avatarUrl: z.string().trim().min(1).nullable().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);

    const user = await prisma.user.findUnique({
      where:  { id: payload.userId },
      select: { id: true, name: true, email: true, avatarUrl: true, role: true, createdAt: true },
    });

    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({ user });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    const data    = Body.parse(await req.json());

    // Check email uniqueness if changing
    if (data.email) {
      const existing = await prisma.user.findFirst({
        where: { email: data.email, NOT: { id: payload.userId } },
      });
      if (existing)
        return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }

    const user = await prisma.user.update({
      where:  { id: payload.userId },
      data:   {
        ...(data.name && { name: data.name }),
        ...(data.email && { email: data.email }),
        ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
      },
      select: { id: true, name: true, email: true, avatarUrl: true, role: true, createdAt: true },
    });

    return NextResponse.json({ user });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
