import { NextRequest, NextResponse } from "next/server";
import { NotificationStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { requireAuth, AuthError } from "@/lib/auth/auth-guard";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    const { searchParams } = req.nextUrl;
    const brandId = searchParams.get("brandId");
    const status  = searchParams.get("status");
    const pageSizeParam = Number(searchParams.get("pageSize") ?? 50);
    const take = Number.isFinite(pageSizeParam)
      ? Math.min(Math.max(Math.floor(pageSizeParam), 1), 50)
      : 50;

    // Resolve accessible brands
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

    // Filter to requested brandId if provided and accessible
    const filterBrandIds = brandId && brandIds.includes(brandId)
      ? [brandId]
      : brandIds;

    const where: Prisma.AlertWhereInput = { brandId: { in: filterBrandIds } };
    if (status && Object.values(NotificationStatus).includes(status as NotificationStatus)) {
      where.status = status as NotificationStatus;
    }

    const [alerts, totalItems] = await Promise.all([
      prisma.alert.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take,
        include: {
          rule: {
            select: { metricKey: true, operator: true, threshold: true, severity: true },
          },
          brand: { select: { name: true } },
        },
      }),
      prisma.alert.count({ where }),
    ]);

    return NextResponse.json({
      items: alerts,
      latestAlerts: alerts,
      totalItems,
      ...(status === "OPEN" ? { totalOpenAlerts: totalItems } : {}),
    });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
