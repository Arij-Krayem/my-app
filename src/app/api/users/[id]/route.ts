import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/auth-guard";

const UpdateBody = z.object({
  name: z.string().optional(),
  role: z.enum(["MARKETER", "AGENCY_ADMIN"]).optional(),
  avatarUrl: z.string().trim().min(1).nullable().optional(),
});

// Next.js 16: ctx.params is a Promise
type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    const me = await requireAuth(req); // me: { userId, role }
    const { id } = await ctx.params;

    // MARKETER can only read self
    if (me.role !== "AGENCY_ADMIN" && me.userId !== id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, avatarUrl: true, role: true, createdAt: true },
    });

    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ user });
  } catch (err) {
    console.error("GET /api/users/[id] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const me = await requireAuth(req); // { userId, role }
    const { id } = await ctx.params;

    const data = UpdateBody.parse(await req.json());

    // MARKETER can only update self
    if (me.role !== "AGENCY_ADMIN" && me.userId !== id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Only admin can change roles
    if (data.role !== undefined && me.role !== "AGENCY_ADMIN") {
      return NextResponse.json({ error: "Forbidden (role edit)" }, { status: 403 });
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, email: true, name: true, avatarUrl: true, role: true },
    });

    return NextResponse.json({ user });
  } catch (err) {
    console.error("PATCH /api/users/[id] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  try {
    const me = await requireAuth(req);
    const { id } = await ctx.params;

    // Admin only
    if (me.role !== "AGENCY_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Optional: prevent deleting my self
    if (me.userId === id) {
      return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });
    }

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/users/[id] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}
