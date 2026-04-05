import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, AuthError } from "@/lib/auth-guard";
import { z } from "zod";
import bcrypt from "bcryptjs";

const CreateUserBody = z.object({
  email:    z.string().min(1, "Email is required").email("Invalid email"),
  name:     z.string().min(1, "Name is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role:     z.enum(["MARKETER", "AGENCY_ADMIN"]).default("MARKETER"),
  brandIds: z.array(z.string()).optional(),
});

const UpdateUserBody = z.object({
  name:     z.string().min(1).optional(),
  role:     z.enum(["MARKETER", "AGENCY_ADMIN"]).optional(),
  brandIds: z.array(z.string()).optional(),
});

// ─── GET /api/users ──────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (payload.role !== "AGENCY_ADMIN")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const q        = searchParams.get("q")        ?? "";
    const role     = searchParams.get("role")     ?? "";
    const page     = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") ?? "50")));

    const where: any = {};
    if (q) {
      where.OR = [
        { name:  { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ];
    }
    if (role && ["MARKETER", "AGENCY_ADMIN"].includes(role)) where.role = role;

    const [items, totalItems] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true, email: true, name: true, role: true, createdAt: true,
          brandMembers: { include: { brand: { select: { id: true, name: true } } } },
        },
        orderBy: { createdAt: "desc" },
        skip:    (page - 1) * pageSize,
        take:    pageSize,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      items,
      users: items,
      totalItems,
      totalPages: Math.ceil(totalItems / pageSize),
    });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── POST /api/users — create user ───────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (payload.role !== "AGENCY_ADMIN")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const data = CreateUserBody.parse(await req.json());

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing)
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        name:  data.name,
        role:  data.role,
        passwordHash,
        ...(data.brandIds?.length ? {
          brandMembers: {
            create: data.brandIds.map(brandId => ({ brandId })),
          },
        } : {}),
      },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── PATCH /api/users?id=xxx — update user ───────────────────────────────────
export async function PATCH(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (payload.role !== "AGENCY_ADMIN")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const id   = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "User id required" }, { status: 400 });

    const data = UpdateUserBody.parse(await req.json());

    // Update user fields
    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(data.name ? { name: data.name } : {}),
        ...(data.role ? { role: data.role } : {}),
      },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });

    // Update brand memberships if provided
    if (data.brandIds !== undefined) {
      await prisma.brandMember.deleteMany({ where: { userId: id } });
      if (data.brandIds.length > 0) {
        await prisma.brandMember.createMany({
          data: data.brandIds.map(brandId => ({ userId: id, brandId })),
          skipDuplicates: true,
        });
      }
    }

    return NextResponse.json({ user });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── DELETE /api/users?id=xxx ────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (payload.role !== "AGENCY_ADMIN")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "User id required" }, { status: 400 });

    // Prevent self-deletion
    if (id === payload.userId)
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ message: "User deleted" });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
