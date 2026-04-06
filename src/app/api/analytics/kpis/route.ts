import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, AuthError } from "@/lib/auth-guard";

async function canAccessBrand(userId: string, role: string, brandId: string): Promise<boolean> {
  if (role === "AGENCY_ADMIN") return true;

  const member = await prisma.brandMember.findUnique({
    where: { userId_brandId: { userId, brandId } },
  });

  return Boolean(member);
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

    const platform = searchParams.get("platform") ?? "";
    const dateFrom = searchParams.get("dateFrom") ?? "";
    const dateTo = searchParams.get("dateTo") ?? "";
    const brandId = await resolveBrandId(payload.userId, payload.role, searchParams.get("brandId"));

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

    const allowed = await canAccessBrand(payload.userId, payload.role, brandId);
    if (!allowed) {
      return NextResponse.json({ error: "Access denied to this brand" }, { status: 403 });
    }

    const conditions: string[] = [`"brandId" = '${brandId}'`];
    if (platform && ["GOOGLE", "META"].includes(platform)) {
      conditions.push(`platform = '${platform}'::"Platform"`);
    }
    if (dateFrom) conditions.push(`date >= '${dateFrom}'::date`);
    if (dateTo) conditions.push(`date <= '${dateTo}'::date`);

    const where = conditions.join(" AND ");

    console.log("[analytics/kpis] query", {
      userId: payload.userId,
      role: payload.role,
      brandId,
      platform: platform || "ALL",
      dateFrom: dateFrom || null,
      dateTo: dateTo || null,
    });

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
      totalRows: 0,
      totalSpend: 0,
      totalClicks: 0,
      totalImpressions: 0,
      totalConversions: 0,
      totalConversionValue: 0,
      avgCtr: 0,
      avgCpc: 0,
      avgRoas: 0,
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

    console.log("[analytics/kpis] result", {
      brandId,
      totalRows: Number(kpis.totalRows ?? 0),
      platformBreakdownCount: platformBreakdown.length,
      spendOverTimeCount: spendOverTime.length,
      topCampaignCount: topCampaigns.length,
    });

    return NextResponse.json({
      kpis: {
        totalSpend: Number(kpis.totalSpend ?? 0),
        totalClicks: Number(kpis.totalClicks ?? 0),
        totalImpressions: Number(kpis.totalImpressions ?? 0),
        totalConversions: Number(kpis.totalConversions ?? 0),
        totalConversionValue: Number(kpis.totalConversionValue ?? 0),
        avgCtr: Number(Number(kpis.avgCtr ?? 0).toFixed(2)),
        avgCpc: Number(Number(kpis.avgCpc ?? 0).toFixed(2)),
        avgRoas: Number(Number(kpis.avgRoas ?? 0).toFixed(2)),
        totalRows: Number(kpis.totalRows ?? 0),
      },
      platformBreakdown: platformBreakdown.map((item) => ({
        platform: item.platform,
        rows: Number(item.rows ?? 0),
        spend: Number(item.spend ?? 0),
        clicks: Number(item.clicks ?? 0),
        avgRoas: Number(Number(item.avgRoas ?? 0).toFixed(2)),
      })),
      spendOverTime: spendOverTime.map((item) => ({
        date: item.date,
        platform: item.platform,
        spend: Number(item.spend ?? 0),
        clicks: Number(item.clicks ?? 0),
        roas: Number(Number(item.roas ?? 0).toFixed(2)),
      })),
      topCampaigns: topCampaigns.map((item) => ({
        campaign: item.campaign,
        platform: item.platform,
        spend: Number(item.spend ?? 0),
        clicks: Number(item.clicks ?? 0),
        conversions: Number(item.conversions ?? 0),
        roas: Number(Number(item.roas ?? 0).toFixed(2)),
      })),
      filters: { brandId, platform: platform || "ALL", dateFrom, dateTo },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("[analytics/kpis] failed", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
