// src/app/api/analytics/bi-summary/route.ts
// ─── ETL Pipeline: Extract → Transform → Load (to JSON response) ──────────────
//
// EXTRACT:  Raw rows from PerformanceFact (metrics JSONB + dimensions JSONB)
// TRANSFORM: Aggregate into funnel, platform donut, geo breakdown, campaign mix
// LOAD:     Return structured BI payload ready for dashboard visualisation
//
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthError }    from "@/lib/auth-guard";
import { prisma }                    from "@/lib/prisma";

export async function GET(req: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  try { await requireAuth(req); }
  catch (e) {
    if (e instanceof AuthError)
      return NextResponse.json({ error: e.message }, { status: e.status });
    throw e;
  }

  const { searchParams } = new URL(req.url);
  const brandId  = searchParams.get("brandId");
  const platform = searchParams.get("platform") ?? "";
  const dateFrom = searchParams.get("dateFrom") ?? "";
  const dateTo   = searchParams.get("dateTo")   ?? "";

  if (!brandId) return NextResponse.json({ error: "brandId required" }, { status: 400 });

  // ── Build dynamic WHERE clauses ───────────────────────────────────────────
  const platformClause = platform ? `AND platform = '${platform}'` : "";
  const dateFromClause = dateFrom ? `AND date::date >= '${dateFrom}'::date` : "";
  const dateToClause   = dateTo   ? `AND date::date <= '${dateTo}'::date`   : "";
  const where = `brand_id = '${brandId}' ${platformClause} ${dateFromClause} ${dateToClause}`;

  // ══════════════════════════════════════════════════════════════════════════
  // EXTRACT phase — pull raw aggregates from PerformanceFact
  // ══════════════════════════════════════════════════════════════════════════
  const [funnelRows, platformRows, geoRows, campaignRows, convTrendRows] =
    await Promise.all([

      // ── E1: Funnel totals (impressions → clicks → conversions) ────────────
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          SUM((metrics->>'impressions')::numeric) AS impressions,
          SUM((metrics->>'clicks')::numeric)      AS clicks,
          SUM((metrics->>'conversions')::numeric) AS conversions,
          SUM((metrics->>'spend')::numeric)       AS spend
        FROM "PerformanceFact"
        WHERE ${where}
      `),

      // ── E2: Platform donut (spend + clicks per platform) ──────────────────
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          platform,
          SUM((metrics->>'spend')::numeric)       AS spend,
          SUM((metrics->>'clicks')::numeric)      AS clicks,
          SUM((metrics->>'impressions')::numeric) AS impressions,
          SUM((metrics->>'conversions')::numeric) AS conversions,
          AVG((metrics->>'roas')::numeric)        AS roas
        FROM "PerformanceFact"
        WHERE ${where}
        GROUP BY platform
        ORDER BY spend DESC
      `),

      // ── E3: Geo breakdown (country from dimensions JSONB) ─────────────────
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          COALESCE(dimensions->>'country', 'Unknown') AS country,
          SUM((metrics->>'spend')::numeric)           AS spend,
          SUM((metrics->>'clicks')::numeric)          AS clicks,
          SUM((metrics->>'conversions')::numeric)     AS conversions,
          AVG((metrics->>'roas')::numeric)            AS roas
        FROM "PerformanceFact"
        WHERE ${where}
          AND dimensions->>'country' IS NOT NULL
          AND dimensions->>'country' != ''
        GROUP BY country
        ORDER BY spend DESC
        LIMIT 10
      `),

      // ── E4: Campaign donut (spend per campaign) ───────────────────────────
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          COALESCE(dimensions->>'campaign', 'Other') AS campaign,
          platform,
          SUM((metrics->>'spend')::numeric)          AS spend,
          SUM((metrics->>'clicks')::numeric)         AS clicks,
          AVG((metrics->>'roas')::numeric)           AS roas
        FROM "PerformanceFact"
        WHERE ${where}
        GROUP BY campaign, platform
        ORDER BY spend DESC
        LIMIT 8
      `),

      // ── E5: Conversion trend over time ────────────────────────────────────
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          date::date                                  AS day,
          SUM((metrics->>'impressions')::numeric)     AS impressions,
          SUM((metrics->>'clicks')::numeric)          AS clicks,
          SUM((metrics->>'conversions')::numeric)     AS conversions
        FROM "PerformanceFact"
        WHERE ${where}
        GROUP BY day
        ORDER BY day ASC
        LIMIT 30
      `),
    ]);

  // ══════════════════════════════════════════════════════════════════════════
  // TRANSFORM phase — shape raw DB rows into BI-ready structures
  // ══════════════════════════════════════════════════════════════════════════

  // ── T1: Funnel metrics + derived rates ────────────────────────────────────
  const f = funnelRows[0] ?? {};
  const impressions  = Number(f.impressions  ?? 0);
  const clicks       = Number(f.clicks       ?? 0);
  const conversions  = Number(f.conversions  ?? 0);
  const totalSpend   = Number(f.spend        ?? 0);

  const funnel = {
    stages: [
      {
        label: "Impressions",
        value: impressions,
        icon:  "eye",
        color: "#5865f2",
        rate:  null,                                                  // top of funnel
      },
      {
        label: "Clicks",
        value: clicks,
        icon:  "cursor",
        color: "#8b5cf6",
        rate:  impressions > 0
                 ? Number(((clicks / impressions) * 100).toFixed(2))
                 : null,                                              // CTR
        rateLabel: "CTR",
      },
      {
        label: "Conversions",
        value: conversions,
        icon:  "check",
        color: "#3fb950",
        rate:  clicks > 0
                 ? Number(((conversions / clicks) * 100).toFixed(2))
                 : null,                                              // CVR
        rateLabel: "CVR",
      },
    ],
    costPerConversion: conversions > 0
      ? Number((totalSpend / conversions).toFixed(2))
      : null,
  };

  // ── T2: Platform donut — add share % ──────────────────────────────────────
  const totalPlatformSpend = platformRows.reduce(
    (s: number, r: any) => s + Number(r.spend ?? 0), 0
  );
  const platformDonut = platformRows.map((r: any) => ({
    platform:   r.platform,
    label:      r.platform === "GOOGLE" ? "Google Ads" : "Meta Ads",
    color:      r.platform === "GOOGLE" ? "#4285F4"    : "#1877F2",
    spend:      Number(r.spend       ?? 0),
    clicks:     Number(r.clicks      ?? 0),
    impressions:Number(r.impressions ?? 0),
    conversions:Number(r.conversions ?? 0),
    roas:       Number(r.roas        ?? 0),
    share:      totalPlatformSpend > 0
                  ? Number(((Number(r.spend) / totalPlatformSpend) * 100).toFixed(1))
                  : 0,
  }));

  // ── T3: Geo rows — add share % + health signal ────────────────────────────
  const totalGeoSpend = geoRows.reduce(
    (s: number, r: any) => s + Number(r.spend ?? 0), 0
  );
  const geo = geoRows.map((r: any) => {
    const spend       = Number(r.spend       ?? 0);
    const clicks      = Number(r.clicks      ?? 0);
    const conv        = Number(r.conversions ?? 0);
    const roas        = Number(r.roas        ?? 0);
    return {
      country:     r.country,
      spend,
      clicks,
      conversions: conv,
      roas:        Number(roas.toFixed(2)),
      share:       totalGeoSpend > 0
                     ? Number(((spend / totalGeoSpend) * 100).toFixed(1))
                     : 0,
      health:      roas >= 3 ? "good" : roas >= 1.5 ? "warning" : "poor",
    };
  });

  // ── T4: Campaign donut — normalise + colour palette ───────────────────────
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
                ? Number(((Number(r.spend) / totalCampaignSpend) * 100).toFixed(1))
                : 0,
    color:    PALETTE[i % PALETTE.length],
  }));

  // ── T5: Conversion trend — keep date as ISO string ────────────────────────
  const conversionTrend = convTrendRows.map((r: any) => ({
    date:        r.day instanceof Date
                   ? r.day.toISOString().split("T")[0]
                   : String(r.day).split("T")[0],
    impressions: Number(r.impressions ?? 0),
    clicks:      Number(r.clicks      ?? 0),
    conversions: Number(r.conversions ?? 0),
  }));

  // ══════════════════════════════════════════════════════════════════════════
  // LOAD phase — assemble BI payload
  // ══════════════════════════════════════════════════════════════════════════
  return NextResponse.json({
    // BI metadata
    meta: {
      brandId,
      platform:  platform || "ALL",
      dateFrom:  dateFrom || null,
      dateTo:    dateTo   || null,
      generatedAt: new Date().toISOString(),
    },
    // Transformed BI structures
    funnel,
    platformDonut,
    campaignDonut,
    geo,
    conversionTrend,
  });
}