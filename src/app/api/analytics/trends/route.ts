import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, AuthError } from "@/lib/auth-guard";

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
    const brandId  = searchParams.get("brandId") ?? "brand_visioad_001";
    const platform = searchParams.get("platform") ?? "";
    const dateFrom = searchParams.get("dateFrom") ?? "";
    const dateTo   = searchParams.get("dateTo")   ?? "";

    const allowed = await canAccessBrand(payload.userId, payload.role, brandId);
    if (!allowed)
      return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const conditions: string[] = [`"brandId" = '${brandId}'`];
    if (platform && ["GOOGLE", "META"].includes(platform))
      conditions.push(`platform = '${platform}'::"Platform"`);
    if (dateFrom) conditions.push(`date >= '${dateFrom}'::date`);
    if (dateTo)   conditions.push(`date <= '${dateTo}'::date`);
    const where = conditions.join(" AND ");

    // ── Metrics per day ─────────────────────────────────────────────────────
    const metricsOverTime = await prisma.$queryRawUnsafe(`
      SELECT
        date::date                                            AS date,
        COALESCE(AVG((metrics->>'roas')::numeric), 0)        AS roas,
        COALESCE(AVG((metrics->>'ctr')::numeric),  0)        AS ctr,
        COALESCE(AVG((metrics->>'cpc')::numeric),  0)        AS cpc,
        COALESCE(SUM((metrics->>'spend')::numeric), 0)       AS spend,
        COALESCE(SUM((metrics->>'clicks')::numeric), 0)      AS clicks,
        COALESCE(SUM((metrics->>'conversions')::numeric), 0) AS conversions
      FROM public."PerformanceFact"
      WHERE ${where}
      GROUP BY date::date
      ORDER BY date::date ASC
    `) as any[];

    // ── Previous period conditions ───────────────────────────────────────────
    const prevConditions: string[] = [`"brandId" = '${brandId}'`];
    if (platform && ["GOOGLE", "META"].includes(platform))
      prevConditions.push(`platform = '${platform}'::"Platform"`);

    if (dateFrom && dateTo) {
      const from  = new Date(dateFrom);
      const to    = new Date(dateTo);
      const days  = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const pFrom = new Date(from); pFrom.setDate(pFrom.getDate() - days);
      const pTo   = new Date(from); pTo.setDate(pTo.getDate() - 1);
      prevConditions.push(`date >= '${pFrom.toISOString().split("T")[0]}'::date`);
      prevConditions.push(`date <= '${pTo.toISOString().split("T")[0]}'::date`);
    } else {
      prevConditions.push(`date >= (CURRENT_DATE - INTERVAL '60 days')`);
      prevConditions.push(`date <  (CURRENT_DATE - INTERVAL '30 days')`);
      conditions.push(`date >= (CURRENT_DATE - INTERVAL '30 days')`);
    }
    const prevWhere = prevConditions.join(" AND ");

    // ── Current period aggregate ─────────────────────────────────────────────
    const currentRows = await prisma.$queryRawUnsafe(`
      SELECT
        COALESCE(AVG((metrics->>'roas')::numeric), 0)        AS "avgRoas",
        COALESCE(AVG((metrics->>'ctr')::numeric),  0)        AS "avgCtr",
        COALESCE(AVG((metrics->>'cpc')::numeric),  0)        AS "avgCpc",
        COALESCE(SUM((metrics->>'spend')::numeric), 0)       AS "totalSpend",
        COALESCE(SUM((metrics->>'conversions')::numeric), 0) AS "totalConversions"
      FROM public."PerformanceFact"
      WHERE ${where}
    `) as any[];

    // ── Previous period aggregate ────────────────────────────────────────────
    const previousRows = await prisma.$queryRawUnsafe(`
      SELECT
        COALESCE(AVG((metrics->>'roas')::numeric), 0)        AS "avgRoas",
        COALESCE(AVG((metrics->>'ctr')::numeric),  0)        AS "avgCtr",
        COALESCE(AVG((metrics->>'cpc')::numeric),  0)        AS "avgCpc",
        COALESCE(SUM((metrics->>'spend')::numeric), 0)       AS "totalSpend",
        COALESCE(SUM((metrics->>'conversions')::numeric), 0) AS "totalConversions"
      FROM public."PerformanceFact"
      WHERE ${prevWhere}
    `) as any[];

    const cur  = currentRows[0]  ?? {};
    const prev = previousRows[0] ?? {};

    function pctChange(curr: number, previous: number): number | null {
      if (!previous || previous === 0) return null;
      return Number((((curr - previous) / previous) * 100).toFixed(1));
    }

    const comparison = {
      roas:        { current: Number(Number(cur.avgRoas).toFixed(2)),        previous: Number(Number(prev.avgRoas).toFixed(2)),        change: pctChange(Number(cur.avgRoas), Number(prev.avgRoas)) },
      ctr:         { current: Number(Number(cur.avgCtr).toFixed(2)),         previous: Number(Number(prev.avgCtr).toFixed(2)),         change: pctChange(Number(cur.avgCtr), Number(prev.avgCtr)) },
      cpc:         { current: Number(Number(cur.avgCpc).toFixed(2)),         previous: Number(Number(prev.avgCpc).toFixed(2)),         change: pctChange(Number(cur.avgCpc), Number(prev.avgCpc)) },
      spend:       { current: Number(Number(cur.totalSpend).toFixed(2)),     previous: Number(Number(prev.totalSpend).toFixed(2)),     change: pctChange(Number(cur.totalSpend), Number(prev.totalSpend)) },
      conversions: { current: Number(cur.totalConversions),                  previous: Number(prev.totalConversions),                  change: pctChange(Number(cur.totalConversions), Number(prev.totalConversions)) },
    };

    return NextResponse.json({
      metricsOverTime: metricsOverTime.map((d: any) => ({
        date:        d.date instanceof Date ? d.date.toISOString().split('T')[0] : String(d.date).split('T')[0],
        roas:        Number(Number(d.roas).toFixed(2)),
        ctr:         Number(Number(d.ctr).toFixed(2)),
        cpc:         Number(Number(d.cpc).toFixed(2)),
        spend:       Number(d.spend),
        clicks:      Number(d.clicks),
        conversions: Number(d.conversions),
      })),
      comparison,
    });

  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("[GET /api/analytics/trends]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}