// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z }                         from "zod";
import bcrypt                        from "bcryptjs";
import { prisma }                    from "@/lib/prisma";

const Body = z.object({
  email:    z.string().email(),
  password: z.string().min(6),
  name:     z.string().optional(),
  role:     z.literal("MARKETER").optional(),
});

export async function POST(req: NextRequest) {
  try {
    const data = Body.parse(await req.json());

    const exists = await prisma.user.findUnique({ where: { email: data.email } });
    if (exists) {
      return NextResponse.json({ error: "Email already used" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        email:        data.email,
        name:         data.name,
        role:         "MARKETER",
        passwordHash,
        // ── NEW: all self-registered users start pending approval ──────────
        isApproved:   false,
        isActive:     false,
      },
      select: { id: true, email: true, role: true, name: true, createdAt: true },
    });

    return NextResponse.json({
      user,
      // ── Tell the frontend to show the "awaiting approval" screen ──────────
      pendingApproval: true,
      message: "Account created. Please wait for admin approval before logging in.",
    }, { status: 201 });

  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", fields: err.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}