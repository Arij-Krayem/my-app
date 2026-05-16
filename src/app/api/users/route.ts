// src/app/api/users/route.ts
// ─── User CRUD — admin only ────────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthError }    from "@/lib/auth/auth-guard";
import { prisma }                    from "@/lib/db/prisma";
import bcrypt                        from "bcryptjs";

const USER_SELECT = {
  id:           true,
  name:         true,
  email:        true,
  avatarUrl:    true,
  role:         true,
  isApproved:   true,
  isActive:     true,
  createdAt:    true,
  brandMembers: { select: { brand: { select: { id: true, name: true } } } },
} as const;

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (payload.role !== "AGENCY_ADMIN")
      return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const pageSize = parseInt(searchParams.get("pageSize") ?? "100");

    const users = await prisma.user.findMany({
      select:  USER_SELECT,
      orderBy: { createdAt: "desc" },
      take:    pageSize,
    });

    return NextResponse.json({ items: users });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (payload.role !== "AGENCY_ADMIN")
      return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const { name, email, password, role, brandIds, avatarUrl } = await req.json();
    if (!email || !password)
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists)
      return NextResponse.json({ error: "Email already used" }, { status: 409 });

    const passwordHash = await bcrypt.hash(password, 10);

    // Users created by admin are immediately approved + active
    const user = await prisma.user.create({
      data: {
        name,
        email,
        avatarUrl: avatarUrl ?? null,
        role:         role ?? "MARKETER",
        passwordHash,
        isApproved:   true,
        isActive:     true,
        ...(brandIds?.length > 0 && {
          brandMembers: {
            create: brandIds.map((id: string) => ({ brandId: id })),
          },
        }),
      },
      select: USER_SELECT,
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (payload.role !== "AGENCY_ADMIN")
      return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id)
      return NextResponse.json({ error: "User id required" }, { status: 400 });

    const { name, role, brandIds, isActive, avatarUrl } = await req.json();

    // ── Update brand assignments ───────────────────────────────────────────
    if (brandIds !== undefined) {
      await prisma.brandMember.deleteMany({ where: { userId: id } });
      if (brandIds.length > 0) {
        await prisma.brandMember.createMany({
          data:           brandIds.map((bid: string) => ({ userId: id, brandId: bid })),
          skipDuplicates: true,
        });
      }
    }

    // ── Update user fields ─────────────────────────────────────────────────
    const updateData: Record<string, unknown> = {};
    if (name     !== undefined) updateData.name     = name;
    if (role     !== undefined) updateData.role     = role;
    if (isActive !== undefined) updateData.isActive = isActive;  // ← active/inactive toggle
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;

    const user = await prisma.user.update({
      where:  { id },
      data:   updateData,
      select: USER_SELECT,
    });

    return NextResponse.json({ user });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (payload.role !== "AGENCY_ADMIN")
      return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id)
      return NextResponse.json({ error: "User id required" }, { status: 400 });

    // Prevent admin from deleting themselves
    if (id === payload.userId)
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });

    await prisma.brandMember.deleteMany({ where: { userId: id } });
    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
