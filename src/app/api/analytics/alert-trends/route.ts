import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, AuthError } from "@/lib/auth-guard";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    const brandId = req.nextUrl.searchParams.get("brandId") ?? "brand_visioad_001";

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