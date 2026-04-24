// src/app/api/analytics/bi-summary/route.ts
// ─── ETL Pipeline: Extract → Transform → Load ────────────────────────────────
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
    const brandId  = searchParams.get("brandId");
    const platform = searchParams.get("platform") ?? "";
    const dateFrom = searchParams.get("dateFrom") ?? "";
    const dateTo   = searchParams.get("dateTo")   ?? "";

    if (!brandId)
      return NextResponse.json({ error: "brandId required" }, { status: 400 });

    const allowed = await canAccessBrand(payload.userId, payload.role, brandId);
    if (!allowed)
      return NextResponse.json({ error: "Access denied" }, { status: 403 });

    // ── WHERE clause ─────────────────────────────────────────────────────────
    //  FIXED: "brandId" with quotes (camelCase Prisma column) not brand_id
    const conditions: string[] = [`"brandId" = '${brandId}'`];
    if (platform && ["GOOGLE", "META"].includes(platform))
      conditions.push(`platform = '${platform}'::"Platform"`);
    if (dateFrom) conditions.push(`date >= '${dateFrom}'::date`);
    if (dateTo)   conditions.push(`date <= '${dateTo}'::date`);
    const where = conditions.join(" AND ");

    // ══════════════════════════════════════════════════════════════════════════
    // EXTRACT — 5 parallel queries
    // ══════════════════════════════════════════════════════════════════════════
    const [funnelRows, platformRows, geoRows, campaignRows, convTrendRows] =
      await Promise.all([

        // E1: Funnel totals
        prisma.$queryRawUnsafe<any[]>(`
          SELECT
            COALESCE(SUM((metrics->>'impressions')::numeric), 0) AS impressions,
            COALESCE(SUM((metrics->>'clicks')::numeric),      0) AS clicks,
            COALESCE(SUM((metrics->>'conversions')::numeric), 0) AS conversions,
            COALESCE(SUM((metrics->>'spend')::numeric),       0) AS spend
          FROM public."PerformanceFact"
          WHERE ${where}
        `),

        // E2: Platform donut
        prisma.$queryRawUnsafe<any[]>(`
          SELECT
            platform,
            COALESCE(SUM((metrics->>'spend')::numeric),       0) AS spend,
            COALESCE(SUM((metrics->>'clicks')::numeric),      0) AS clicks,
            COALESCE(SUM((metrics->>'impressions')::numeric), 0) AS impressions,
            COALESCE(SUM((metrics->>'conversions')::numeric), 0) AS conversions,
            COALESCE(AVG((metrics->>'roas')::numeric),        0) AS roas
          FROM public."PerformanceFact"
          WHERE ${where}
          GROUP BY platform
          ORDER BY spend DESC
        `),

        // E3: Geo breakdown
        prisma.$queryRawUnsafe<any[]>(`
          SELECT
            COALESCE(dimensions->>'country', 'Unknown')          AS country,
            COALESCE(SUM((metrics->>'spend')::numeric),       0) AS spend,
            COALESCE(SUM((metrics->>'clicks')::numeric),      0) AS clicks,
            COALESCE(SUM((metrics->>'conversions')::numeric), 0) AS conversions,
            COALESCE(AVG((metrics->>'roas')::numeric),        0) AS roas
          FROM public."PerformanceFact"
          WHERE ${where}
            AND dimensions->>'country' IS NOT NULL
            AND dimensions->>'country' != ''
          GROUP BY country
          ORDER BY spend DESC
          LIMIT 10
        `),

        // E4: Campaign donut — checks both 'campaign' and 'campaign_name' keys
        prisma.$queryRawUnsafe<any[]>(`
          SELECT
            COALESCE(
              dimensions->>'campaign',
              dimensions->>'campaign_name',
              'Other'
            )                                                    AS campaign,
            platform,
            COALESCE(SUM((metrics->>'spend')::numeric),       0) AS spend,
            COALESCE(SUM((metrics->>'clicks')::numeric),      0) AS clicks,
            COALESCE(AVG((metrics->>'roas')::numeric),        0) AS roas
          FROM public."PerformanceFact"
          WHERE ${where}
          GROUP BY campaign, platform
          ORDER BY spend DESC
          LIMIT 8
        `),

        // E5: Conversion trend over time
        prisma.$queryRawUnsafe<any[]>(`
          SELECT
            date::date                                              AS day,
            COALESCE(SUM((metrics->>'impressions')::numeric), 0)   AS impressions,
            COALESCE(SUM((metrics->>'clicks')::numeric),      0)   AS clicks,
            COALESCE(SUM((metrics->>'conversions')::numeric), 0)   AS conversions
          FROM public."PerformanceFact"
          WHERE ${where}
          GROUP BY day
          ORDER BY day ASC
          LIMIT 30
        `),
      ]);

    // ══════════════════════════════════════════════════════════════════════════
    // TRANSFORM
    // ══════════════════════════════════════════════════════════════════════════

    // T1: Funnel
    const f = funnelRows[0] ?? {};
    const impressions = Number(f.impressions ?? 0);
    const clicks      = Number(f.clicks      ?? 0);
    const conversions = Number(f.conversions ?? 0);
    const totalSpend  = Number(f.spend       ?? 0);

    const funnel = {
      stages: [
        {
          label: "Impressions", value: impressions,
          icon: "eye", color: "#5865f2", rate: null,
        },
        {
          label: "Clicks", value: clicks,
          icon: "cursor", color: "#8b5cf6",
          rate: impressions > 0
            ? Number(((clicks / impressions) * 100).toFixed(2)) : null,
          rateLabel: "CTR",
        },
        {
          label: "Conversions", value: conversions,
          icon: "check", color: "#3fb950",
          rate: clicks > 0
            ? Number(((conversions / clicks) * 100).toFixed(2)) : null,
          rateLabel: "CVR",
        },
      ],
      costPerConversion: conversions > 0
        ? Number((totalSpend / conversions).toFixed(2)) : null,
    };

    // T2: Platform donut + share %
    const totalPlatformSpend = platformRows.reduce(
      (s: number, r: any) => s + Number(r.spend ?? 0), 0
    );
    const platformDonut = platformRows.map((r: any) => ({
      platform:    r.platform,
      label:       r.platform === "GOOGLE" ? "Google Ads" : "Meta Ads",
      color:       r.platform === "GOOGLE" ? "#4285F4"    : "#1877F2",
      spend:       Number(r.spend        ?? 0),
      clicks:      Number(r.clicks       ?? 0),
      impressions: Number(r.impressions  ?? 0),
      conversions: Number(r.conversions  ?? 0),
      roas:        Number(r.roas         ?? 0),
      share:       totalPlatformSpend > 0
        ? Number(((Number(r.spend) / totalPlatformSpend) * 100).toFixed(1)) : 0,
    }));

    // T3: Geo + share % + health signal
    const totalGeoSpend = geoRows.reduce(
      (s: number, r: any) => s + Number(r.spend ?? 0), 0
    );
    const geo = geoRows.map((r: any) => {
      const spend = Number(r.spend ?? 0);
      const roas  = Number(r.roas  ?? 0);
      return {
        country:     r.country,
        spend,
        clicks:      Number(r.clicks      ?? 0),
        conversions: Number(r.conversions ?? 0),
        roas:        Number(roas.toFixed(2)),
        share:       totalGeoSpend > 0
          ? Number(((spend / totalGeoSpend) * 100).toFixed(1)) : 0,
        health:      roas >= 3 ? "good" : roas >= 1.5 ? "warning" : "poor",
      };
    });

    // T4: Campaign donut + colour palette
    const PALETTE = [
      "#5865f2","#8b5cf6","#3fb950","#f59e0b",
      "#f85149","#06b6d4","#ec4899","#84cc16",
    ];
    const totalCampaignSpend = campaignRows.reduce(
      (s: number, r: any) => s + Number(r.spend ?? 0), 0
    );
    const campaignDonut = campaignRows.map((r: any, i: number) => ({
      campaign: r.campaign,
      platform: r.platform,
      spend:    Number(r.spend  ?? 0),
      clicks:   Number(r.clicks ?? 0),
      roas:     Number(r.roas   ?? 0),
      share:    totalCampaignSpend > 0
        ? Number(((Number(r.spend) / totalCampaignSpend) * 100).toFixed(1)) : 0,
      color:    PALETTE[i % PALETTE.length],
    }));

    // T5: Conversion trend
    const conversionTrend = convTrendRows.map((r: any) => ({
      date:        r.day instanceof Date
        ? r.day.toISOString().split("T")[0]
        : String(r.day).split("T")[0],
      impressions: Number(r.impressions ?? 0),
      clicks:      Number(r.clicks      ?? 0),
      conversions: Number(r.conversions ?? 0),
    }));

    // ══════════════════════════════════════════════════════════════════════════
    // LOAD
    // ══════════════════════════════════════════════════════════════════════════
    return NextResponse.json({
      meta: {
        brandId, platform: platform || "ALL",
        dateFrom: dateFrom || null, dateTo: dateTo || null,
        generatedAt: new Date().toISOString(),
      },
      funnel,
      platformDonut,
      campaignDonut,
      geo,
      conversionTrend,
    });

  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("[GET /api/analytics/bi-summary]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}