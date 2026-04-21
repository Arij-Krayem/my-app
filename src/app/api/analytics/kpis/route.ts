import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, AuthError } from "@/lib/auth-guard";

// ─── Helper: verify user can access this brand ───────────────────────────────
async function canAccessBrand(userId: string, role: string, brandId: string): Promise<boolean> {
  if (role === "AGENCY_ADMIN") return true;
  const member = await prisma.brandMember.findUnique({
    where: { userId_brandId: { userId, brandId } },
  });
  return !!member;
}

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

    const { searchParams } = new URL(req.url);
    const brandId  = await resolveBrandId(payload.userId, payload.role, searchParams.get("brandId"));
    const platform = searchParams.get("platform") ?? "";
    const dateFrom = searchParams.get("dateFrom") ?? "";
    const dateTo   = searchParams.get("dateTo")   ?? "";

    if (!brandId) {
      return NextResponse.json({
        kpis: {
          totalSpend: 0,
          totalClicks: 0,
          totalImpressions: 0,
          totalConversions: 0,
          totalConversionValue: 0,
          avgCtr: 0,
          avgCpc: 0,
          avgRoas: 0,
          totalRows: 0,
        },
        platformBreakdown: [],
        spendOverTime: [],
        topCampaigns: [],
        filters: { brandId: null, platform: platform || "ALL", dateFrom, dateTo },
      });
    }

    // ── Brand access check ──────────────────────────────────────────────────
    const allowed = await canAccessBrand(payload.userId, payload.role, brandId);
    if (!allowed) {
      return NextResponse.json({ error: "Access denied to this brand" }, { status: 403 });
    }

    // Build WHERE clause
    const conditions: string[] = [`"brandId" = '${brandId}'`];
    if (platform && ["GOOGLE", "META"].includes(platform)) {
      conditions.push(`platform = '${platform}'::"Platform"`);
    }
    if (dateFrom) conditions.push(`date >= '${dateFrom}'::date`);
    if (dateTo)   conditions.push(`date <= '${dateTo}'::date`);

    const where = conditions.join(" AND ");

    const result = await prisma.$queryRawUnsafe(`
      SELECT
        COUNT(*)::int                                             AS "totalRows",
        COALESCE(SUM((metrics->>'spend')::numeric), 0)           AS "totalSpend",
        COALESCE(SUM((metrics->>'clicks')::numeric), 0)          AS "totalClicks",
        COALESCE(SUM((metrics->>'impressions')::numeric), 0)     AS "totalImpressions",
        COALESCE(SUM((metrics->>'conversions')::numeric), 0)     AS "totalConversions",
        COALESCE(SUM((metrics->>'conversionValue')::numeric), 0) AS "totalConversionValue",
        COALESCE(AVG((metrics->>'ctr')::numeric), 0)             AS "avgCtr",
        COALESCE(AVG((metrics->>'cpc')::numeric), 0)             AS "avgCpc",
        COALESCE(AVG((metrics->>'roas')::numeric), 0)            AS "avgRoas"
      FROM public."PerformanceFact"
      WHERE ${where}
    `) as Record<string, unknown>[];

    const kpis = result[0] ?? {
      totalSpend: 0,
      totalClicks: 0,
      totalImpressions: 0,
      totalConversions: 0,
      totalConversionValue: 0,
      avgCtr: 0,
      avgCpc: 0,
      avgRoas: 0,
      totalRows: 0,
    };

    const platformBreakdown = await prisma.$queryRawUnsafe(`
      SELECT
        platform,
        COUNT(*)::int                                        AS rows,
        COALESCE(SUM((metrics->>'spend')::numeric), 0)      AS spend,
        COALESCE(SUM((metrics->>'clicks')::numeric), 0)     AS clicks,
        COALESCE(AVG((metrics->>'roas')::numeric), 0)       AS "avgRoas"
      FROM public."PerformanceFact"
      WHERE "brandId" = '${brandId}'
      GROUP BY platform
      ORDER BY spend DESC
    `) as Record<string, unknown>[];

    const spendOverTime = await prisma.$queryRawUnsafe(`
      SELECT
        date::date                                           AS date,
        platform,
        COALESCE(SUM((metrics->>'spend')::numeric), 0)      AS spend,
        COALESCE(SUM((metrics->>'clicks')::numeric), 0)     AS clicks,
        COALESCE(AVG((metrics->>'roas')::numeric), 0)       AS roas
      FROM public."PerformanceFact"
      WHERE ${where}
      GROUP BY date::date, platform
      ORDER BY date::date ASC
    `) as Record<string, unknown>[];

    const topCampaigns = await prisma.$queryRawUnsafe(`
      SELECT
        dimensions->>'campaign_name'                             AS campaign,
        platform,
        COALESCE(SUM((metrics->>'spend')::numeric), 0)          AS spend,
        COALESCE(SUM((metrics->>'clicks')::numeric), 0)         AS clicks,
        COALESCE(SUM((metrics->>'conversions')::numeric), 0)    AS conversions,
        COALESCE(AVG((metrics->>'roas')::numeric), 0)           AS roas
      FROM public."PerformanceFact"
      WHERE ${where}
      GROUP BY dimensions->>'campaign_name', platform
      ORDER BY spend DESC
      LIMIT 10
    `) as Record<string, unknown>[];

    return NextResponse.json({
      kpis: {
        totalSpend:           Number(kpis.totalSpend),
        totalClicks:          Number(kpis.totalClicks),
        totalImpressions:     Number(kpis.totalImpressions),
        totalConversions:     Number(kpis.totalConversions),
        totalConversionValue: Number(kpis.totalConversionValue),
        avgCtr:               Number(Number(kpis.avgCtr).toFixed(2)),
        avgCpc:               Number(Number(kpis.avgCpc).toFixed(2)),
        avgRoas:              Number(Number(kpis.avgRoas).toFixed(2)),
        totalRows:            Number(kpis.totalRows),
      },
      platformBreakdown: platformBreakdown.map(p => ({
        platform: p.platform,
        rows:     Number(p.rows),
        spend:    Number(p.spend),
        clicks:   Number(p.clicks),
        avgRoas:  Number(Number(p.avgRoas).toFixed(2)),
      })),
      spendOverTime: spendOverTime.map(d => ({
        date:     d.date,
        platform: d.platform,
        spend:    Number(d.spend),
        clicks:   Number(d.clicks),
        roas:     Number(Number(d.roas).toFixed(2)),
      })),
      topCampaigns: topCampaigns.map(c => ({
        campaign:    c.campaign,
        platform:    c.platform,
        spend:       Number(c.spend),
        clicks:      Number(c.clicks),
        conversions: Number(c.conversions),
        roas:        Number(Number(c.roas).toFixed(2)),
      })),
      filters: { brandId, platform: platform || "ALL", dateFrom, dateTo },
    });

  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("[GET /api/analytics/kpis]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
