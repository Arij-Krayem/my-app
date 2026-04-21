import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, AuthError } from "@/lib/auth-guard";

async function resolveBrandId(userId: string, role: string, requestedBrandId: string | null) {
  if (requestedBrandId) return requestedBrandId;

  if (role === "AGENCY_ADMIN") {
    const brand = await prisma.brand.findFirst({
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
    return brand?.id ?? null;
  }

  const membership = await prisma.brandMember.findFirst({
    where: { userId },
    orderBy: { id: "asc" },
    select: { brandId: true },
  });

  return membership?.brandId ?? null;
}

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    const brandId = await resolveBrandId(
      payload.userId,
      payload.role,
      req.nextUrl.searchParams.get("brandId"),
    );

    if (!brandId) {
      return NextResponse.json({
        alertsPerDay: [],
        summary: {
          open: 0,
          ack: 0,
          resolved: 0,
          total: 0,
        },
      });
    }

    // Verify access
    if (payload.role !== "AGENCY_ADMIN") {
      const member = await prisma.brandMember.findFirst({
        where: { userId: payload.userId, brandId },
      });
      if (!member)
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Alert counts per day (last 30 days)
    const alertsPerDay = await prisma.$queryRawUnsafe(`
      SELECT
        "createdAt"::date                                    AS date,
        COUNT(*)::int                                        AS total,
        COUNT(*) FILTER (WHERE status = 'OPEN')::int        AS open,
        COUNT(*) FILTER (WHERE status = 'ACK')::int         AS acknowledged,
        COUNT(*) FILTER (WHERE status = 'RESOLVED')::int    AS resolved,
        COUNT(*) FILTER (
          WHERE EXISTS (
            SELECT 1 FROM public."AlertRule" r
            WHERE r.id = public."Alert"."ruleId"
            AND r.severity = 'CRITICAL'
          )
        )::int AS critical,
        COUNT(*) FILTER (
          WHERE EXISTS (
            SELECT 1 FROM public."AlertRule" r
            WHERE r.id = public."Alert"."ruleId"
            AND r.severity = 'WARNING'
          )
        )::int AS warning
      FROM public."Alert"
      WHERE "brandId" = '${brandId}'
        AND "createdAt" >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY "createdAt"::date
      ORDER BY "createdAt"::date ASC
    `) as any[];

    // Summary counts
    const summary = await prisma.alert.groupBy({
      by:     ["status"],
      where:  { brandId },
      _count: { id: true },
    });

    const summaryMap = summary.reduce((acc, s) => {
      acc[s.status] = s._count.id;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      alertsPerDay: alertsPerDay.map(d => ({
        date:         d.date instanceof Date ? d.date.toISOString().split('T')[0] : String(d.date).split('T')[0],
        total:        Number(d.total),
        open:         Number(d.open),
        acknowledged: Number(d.acknowledged),
        resolved:     Number(d.resolved),
        critical:     Number(d.critical),
        warning:      Number(d.warning),
      })),
      summary: {
        open:     summaryMap["OPEN"]     ?? 0,
        ack:      summaryMap["ACK"]      ?? 0,
        resolved: summaryMap["RESOLVED"] ?? 0,
        total:    Object.values(summaryMap).reduce((a, b) => a + b, 0),
      },
    });

  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("[GET /api/analytics/alert-trends]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
