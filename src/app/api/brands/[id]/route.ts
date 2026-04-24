// src/app/api/brands/[id]/route.ts
// ─── Single brand PATCH (update name + logoUrl) ───────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthError }    from "@/lib/auth-guard";
import { prisma }                    from "@/lib/prisma";

async function canAccessBrand(userId: string, role: string, brandId: string) {
  if (role === "AGENCY_ADMIN") return true;
  const m = await prisma.brandMember.findUnique({
    where: { userId_brandId: { userId, brandId } },
  });
  return !!m;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload    = requireAuth(req);
    const { id }     = await params;

    const allowed = await canAccessBrand(payload.userId, payload.role, id);
    if (!allowed)
      return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const body = await req.json();
    const updateData: Record<string, unknown> = {};
    if (body.name    !== undefined) updateData.name    = String(body.name).trim();
    if (body.logoUrl !== undefined) updateData.logoUrl = body.logoUrl ?? null;

    const brand = await prisma.brand.update({
      where: { id },
      data:  updateData,
    });

    return NextResponse.json(brand);
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("[PATCH /api/brands/[id]]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = requireAuth(req);
    const { id }  = await params;

    const allowed = await canAccessBrand(payload.userId, payload.role, id);
    if (!allowed)
      return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const brand = await prisma.brand.findUnique({ where: { id } });
    if (!brand)
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });

    return NextResponse.json(brand);
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = requireAuth(req);
    const { id } = await params;

    if (payload.role !== "AGENCY_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const brand = await prisma.brand.findUnique({
      where: { id },
      select: { id: true, name: true },
    });

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    await prisma.brand.delete({ where: { id } });

    return NextResponse.json({ ok: true, id: brand.id, name: brand.name });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("[DELETE /api/brands/[id]]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
