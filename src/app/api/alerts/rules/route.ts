import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, AuthError } from "@/lib/auth-guard";
import { z } from "zod";

const Body = z.object({
  brandId:   z.string().min(1),
  metricKey: z.string().min(1),
  operator:  z.enum([">", "<", ">=", "<=", "=="]),
  threshold: z.number(),
  severity:  z.enum(["WARNING", "CRITICAL"]),
});

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    const brandId = req.nextUrl.searchParams.get("brandId");

    let brandIds: string[] = [];
    if (payload.role === "AGENCY_ADMIN") {
      const brands = await prisma.brand.findMany({ select: { id: true } });
      brandIds = brands.map(b => b.id);
    } else {
      const memberships = await prisma.brandMember.findMany({
        where: { userId: payload.userId },
        select: { brandId: true },
      });
      brandIds = memberships.map(m => m.brandId);
    }

    const filterBrandIds = brandId && brandIds.includes(brandId) ? [brandId] : brandIds;

    const rules = await prisma.alertRule.findMany({
      where: { brandId: { in: filterBrandIds } },
      orderBy: { createdAt: "desc" },
      include: { brand: { select: { name: true } } },
    });

    return NextResponse.json({ items: rules });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    const data = Body.parse(await req.json());

    // Verify brand access
    if (payload.role !== "AGENCY_ADMIN") {
      const member = await prisma.brandMember.findFirst({
        where: { userId: payload.userId, brandId: data.brandId },
      });
      if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const rule = await prisma.alertRule.create({ data });
    return NextResponse.json({ rule }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}