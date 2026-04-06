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

function getDbDebugInfo() {
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) {
    return { loaded: false };
  }

  try {
    const parsed = new URL(rawUrl);
    return {
      loaded: true,
      host: parsed.hostname,
      port: parsed.port || "5432",
      database: parsed.pathname.replace(/^\//, ""),
      user: parsed.username,
    };
  } catch {
    return { loaded: true, invalid: true };
  }
}

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    const brandId = req.nextUrl.searchParams.get("brandId");

    console.log("[alerts/rules][GET] hit", {
      brandId,
      userId: payload.userId,
      role: payload.role,
      db: getDbDebugInfo(),
    });

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

    console.log("[alerts/rules][GET] querying", {
      brandIdsCount: brandIds.length,
      filterBrandIdsCount: filterBrandIds.length,
      filterBrandIds,
    });

    const rules = await prisma.alertRule.findMany({
      where: { brandId: { in: filterBrandIds } },
      orderBy: { createdAt: "desc" },
      include: { brand: { select: { name: true } } },
    });

    console.log("[alerts/rules][GET] result", {
      count: rules.length,
      items: rules.map((rule) => ({
        id: rule.id,
        brandId: rule.brandId,
        metricKey: rule.metricKey,
        operator: rule.operator,
        threshold: rule.threshold,
        severity: rule.severity,
        isActive: rule.isActive,
        brandName: rule.brand?.name ?? null,
      })),
    });

    return NextResponse.json({ items: rules });
  } catch (err) {
    console.error("[alerts/rules][GET] failed", err);
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    const data = Body.parse(await req.json());

    console.log("[alerts/rules][POST] hit", {
      userId: payload.userId,
      role: payload.role,
      data,
      db: getDbDebugInfo(),
    });

    // Verify brand access
    if (payload.role !== "AGENCY_ADMIN") {
      const member = await prisma.brandMember.findFirst({
        where: { userId: payload.userId, brandId: data.brandId },
      });
      if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const rule = await prisma.alertRule.create({ data });
    console.log("[alerts/rules][POST] created", {
      id: rule.id,
      brandId: rule.brandId,
      metricKey: rule.metricKey,
    });
    return NextResponse.json({ rule }, { status: 201 });
  } catch (err) {
    console.error("[alerts/rules][POST] failed", err);
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
