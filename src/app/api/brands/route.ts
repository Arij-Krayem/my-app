// src/app/api/brands/route.ts
// ─── Brands CRUD — updated to support logoUrl ─────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthError }    from "@/lib/auth-guard";
import { prisma }                    from "@/lib/prisma";

async function canAccessBrand(userId: string, role: string, brandId: string): Promise<boolean> {
  if (role === "AGENCY_ADMIN") return true;
  const member = await prisma.brandMember.findUnique({
    where: { userId_brandId: { userId, brandId } },
  });
  return !!member;
}

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    const { searchParams } = new URL(req.url);
    const brandId = searchParams.get("brandId");

    // Single brand lookup
    if (brandId) {
      const allowed = await canAccessBrand(payload.userId, payload.role, brandId);
      if (!allowed) return NextResponse.json({ error: "Access denied" }, { status: 403 });
      const brand = await prisma.brand.findUnique({ where: { id: brandId } });
      if (!brand) return NextResponse.json({ error: "Brand not found" }, { status: 404 });
      return NextResponse.json(brand);
    }

    // List all accessible brands
    let brands;
    if (payload.role === "AGENCY_ADMIN") {
      brands = await prisma.brand.findMany({ orderBy: { createdAt: "desc" } });
    } else {
      const memberships = await prisma.brandMember.findMany({
        where:   { userId: payload.userId },
        include: { brand: true },
      });
      brands = memberships.map(m => m.brand);
    }

    return NextResponse.json({ items: brands });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    const { name, logoUrl } = await req.json();

    if (!name?.trim())
      return NextResponse.json({ error: "Brand name is required" }, { status: 400 });

    const brand = await prisma.brand.create({
      data: {
        name:    name.trim(),
        members: payload.role !== "AGENCY_ADMIN"
          ? { create: { user: { connect: { id: payload.userId } } } }
          : undefined,
        logoUrl: logoUrl ?? null,   // ← NEW: save logo URL
      },
    });

    return NextResponse.json(brand, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    // Also support /api/brands/[id] style via body
    const body = await req.json();
    const brandId = id ?? body.id;

    if (!brandId)
      return NextResponse.json({ error: "Brand id required" }, { status: 400 });

    const allowed = await canAccessBrand(payload.userId, payload.role, brandId);
    if (!allowed)
      return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const updateData: Record<string, unknown> = {};
    if (body.name    !== undefined) updateData.name    = body.name.trim();
    if (body.logoUrl !== undefined) updateData.logoUrl = body.logoUrl; // null = remove logo

    const brand = await prisma.brand.update({
      where: { id: brandId },
      data:  updateData,
    });

    return NextResponse.json(brand);
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
