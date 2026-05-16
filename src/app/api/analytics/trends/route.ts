import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth, AuthError } from "@/lib/auth/auth-guard";

interface MetricRow {
  date: Date | string;
  roas: number | bigint | string;
  ctr: number | bigint | string;
  cpc: number | bigint | string;
  spend: number | bigint | string;
  clicks: number | bigint | string;
  conversions: number | bigint | string;
}

interface PlatformMetricRow extends MetricRow {
  platform: string;
}

interface AggregateRow {
  avgRoas: number | bigint | string;
  avgCtr: number | bigint | string;
  avgCpc: number | bigint | string;
  totalSpend: number | bigint | string;
  totalConversions: number | bigint | string;
}

interface LatestDateRow {
  maxDate: Date | string | null;
}

const VALID_PLATFORMS = ["GOOGLE", "META"] as const;

function toIsoDate(value: Date): string {
  return value.toISOString().split("T")[0];
}

function startOfUtcDay(value: Date | string): Date {
  const date = value instanceof Date ? value : new Date(String(value));
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function shiftUtcDays(value: Date, days: number): Date {
  const next = new Date(value);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

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
    const hasPlatformFilter = VALID_PLATFORMS.includes(platform as (typeof VALID_PLATFORMS)[number]);

    const allowed = await canAccessBrand(payload.userId, payload.role, brandId);
    if (!allowed)
      return NextResponse.json({ error: "Access denied" }, { status: 403 });

    let effectiveDateFrom = dateFrom;
    let effectiveDateTo = dateTo;

    if (!dateFrom && !dateTo) {
      const latestDateConditions = [`"brandId" = '${brandId}'`];
      if (hasPlatformFilter)
        latestDateConditions.push(`platform = '${platform}'::"Platform"`);

      const latestRows = await prisma.$queryRawUnsafe<LatestDateRow[]>(`
        SELECT MAX(date)::date AS "maxDate"
        FROM public."PerformanceFact"
        WHERE ${latestDateConditions.join(" AND ")}
      `);

      const latestDate = latestRows[0]?.maxDate;
      if (latestDate) {
        const latestDay = startOfUtcDay(latestDate);
        effectiveDateTo = toIsoDate(latestDay);
        effectiveDateFrom = toIsoDate(shiftUtcDays(latestDay, -29));
      }
    }

    // ── Base WHERE (current period) ──────────────────────────────────────────
    const conditions: string[] = [`"brandId" = '${brandId}'`];
    if (hasPlatformFilter)
      conditions.push(`platform = '${platform}'::"Platform"`);
    if (effectiveDateFrom) conditions.push(`date >= '${effectiveDateFrom}'::date`);
    if (effectiveDateTo)   conditions.push(`date <= '${effectiveDateTo}'::date`);
    const where = conditions.join(" AND ");

    // ── Previous period bounds ───────────────────────────────────────────────
    const prevConditions: string[] = [`"brandId" = '${brandId}'`];
    if (hasPlatformFilter)
      prevConditions.push(`platform = '${platform}'::"Platform"`);

    if (effectiveDateFrom && effectiveDateTo) {
      const from  = new Date(effectiveDateFrom);
      const to    = new Date(effectiveDateTo);
      const days  = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const pFrom = new Date(from); pFrom.setDate(pFrom.getDate() - days);
      const pTo   = new Date(from); pTo.setDate(pTo.getDate() - 1);
      prevConditions.push(`date >= '${pFrom.toISOString().split("T")[0]}'::date`);
      prevConditions.push(`date <= '${pTo.toISOString().split("T")[0]}'::date`);
    } else {
      prevConditions.push(`date >= (CURRENT_DATE - INTERVAL '60 days')`);
      prevConditions.push(`date <  (CURRENT_DATE - INTERVAL '30 days')`);
    }
    const prevWhere = prevConditions.join(" AND ");

    // ── WHERE without platform filter (for platform-split query) ────────────
    const baseConditions: string[] = [`"brandId" = '${brandId}'`];
    if (effectiveDateFrom) baseConditions.push(`date >= '${effectiveDateFrom}'::date`);
    if (effectiveDateTo)   baseConditions.push(`date <= '${effectiveDateTo}'::date`);
    const baseWhere = baseConditions.join(" AND ");

    // ════════════════════════════════════════════════════════════════════════
    // Run all queries in parallel
    // ════════════════════════════════════════════════════════════════════════
    const [
      metricsOverTime,
      platformByDay,       // ← NEW: per-platform per-day rows
      prevByDay,           // ← NEW: previous period per-day (for overlay)
      currentRows,
      previousRows,
    ] = await Promise.all([

      // ── 1. Overall metrics per day (existing) ──────────────────────────
      prisma.$queryRawUnsafe<MetricRow[]>(`
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
      `),

      // ── 2. NEW: per-platform breakdown per day ──────────────────────────
      //    Returns rows: { date, platform, roas, ctr, cpc, spend, clicks, conversions }
      //    Always uses baseWhere (no platform filter) so both platforms appear
      prisma.$queryRawUnsafe<PlatformMetricRow[]>(`
        SELECT
          date::date                                            AS date,
          platform,
          COALESCE(AVG((metrics->>'roas')::numeric), 0)        AS roas,
          COALESCE(AVG((metrics->>'ctr')::numeric),  0)        AS ctr,
          COALESCE(AVG((metrics->>'cpc')::numeric),  0)        AS cpc,
          COALESCE(SUM((metrics->>'spend')::numeric), 0)       AS spend,
          COALESCE(SUM((metrics->>'clicks')::numeric), 0)      AS clicks,
          COALESCE(SUM((metrics->>'conversions')::numeric), 0) AS conversions
        FROM public."PerformanceFact"
        WHERE ${baseWhere}
        GROUP BY date::date, platform
        ORDER BY date::date ASC
      `),

      // ── 3. NEW: previous period per day (for overlay ghost line) ────────
      prisma.$queryRawUnsafe<MetricRow[]>(`
        SELECT
          date::date                                            AS date,
          COALESCE(AVG((metrics->>'roas')::numeric), 0)        AS roas,
          COALESCE(AVG((metrics->>'ctr')::numeric),  0)        AS ctr,
          COALESCE(AVG((metrics->>'cpc')::numeric),  0)        AS cpc,
          COALESCE(SUM((metrics->>'spend')::numeric), 0)       AS spend,
          COALESCE(SUM((metrics->>'clicks')::numeric), 0)      AS clicks,
          COALESCE(SUM((metrics->>'conversions')::numeric), 0) AS conversions
        FROM public."PerformanceFact"
        WHERE ${prevWhere}
        GROUP BY date::date
        ORDER BY date::date ASC
      `),

      // ── 4. Current period aggregate (existing) ──────────────────────────
      prisma.$queryRawUnsafe<AggregateRow[]>(`
        SELECT
          COALESCE(AVG((metrics->>'roas')::numeric), 0)        AS "avgRoas",
          COALESCE(AVG((metrics->>'ctr')::numeric),  0)        AS "avgCtr",
          COALESCE(AVG((metrics->>'cpc')::numeric),  0)        AS "avgCpc",
          COALESCE(SUM((metrics->>'spend')::numeric), 0)       AS "totalSpend",
          COALESCE(SUM((metrics->>'conversions')::numeric), 0) AS "totalConversions"
        FROM public."PerformanceFact"
        WHERE ${where}
      `),

      // ── 5. Previous period aggregate (existing) ─────────────────────────
      prisma.$queryRawUnsafe<AggregateRow[]>(`
        SELECT
          COALESCE(AVG((metrics->>'roas')::numeric), 0)        AS "avgRoas",
          COALESCE(AVG((metrics->>'ctr')::numeric),  0)        AS "avgCtr",
          COALESCE(AVG((metrics->>'cpc')::numeric),  0)        AS "avgCpc",
          COALESCE(SUM((metrics->>'spend')::numeric), 0)       AS "totalSpend",
          COALESCE(SUM((metrics->>'conversions')::numeric), 0) AS "totalConversions"
        FROM public."PerformanceFact"
        WHERE ${prevWhere}
      `),
    ]);

    // ════════════════════════════════════════════════════════════════════════
    // TRANSFORM: pivot platform rows into flat per-day objects
    // { date, roas_google, roas_meta, ctr_google, ctr_meta, ... }
    // ════════════════════════════════════════════════════════════════════════
    const METRICS = ["roas", "ctr", "cpc", "spend", "clicks", "conversions"] as const;

    // Build a map: date → { roas_google, roas_meta, ... }
    const platformPivot: Record<string, Record<string, number>> = {};
    for (const row of platformByDay) {
      const d   = row.date instanceof Date
        ? row.date.toISOString().split("T")[0]
        : String(row.date).split("T")[0];
      const plat = String(row.platform).toLowerCase(); // "google" | "meta"
      if (!platformPivot[d]) platformPivot[d] = {};
      for (const m of METRICS) {
        platformPivot[d][`${m}_${plat}`] = Number(Number(row[m]).toFixed(2));
      }
    }

    // Collect all unique dates from the overall query, merge pivot data
    const serialisedMetrics = metricsOverTime.map((d) => {
      const dateStr = d.date instanceof Date
        ? d.date.toISOString().split("T")[0]
        : String(d.date).split("T")[0];
      const pivoted = platformPivot[dateStr] ?? {};
      return {
        date:              dateStr,
        // overall (used for combined view / fallback)
        roas:              Number(Number(d.roas).toFixed(2)),
        ctr:               Number(Number(d.ctr).toFixed(2)),
        cpc:               Number(Number(d.cpc).toFixed(2)),
        spend:             Number(d.spend),
        clicks:            Number(d.clicks),
        conversions:       Number(d.conversions),
        // platform-split (multidimensional)
        roas_google:       pivoted.roas_google   ?? null,
        roas_meta:         pivoted.roas_meta     ?? null,
        ctr_google:        pivoted.ctr_google    ?? null,
        ctr_meta:          pivoted.ctr_meta      ?? null,
        cpc_google:        pivoted.cpc_google    ?? null,
        cpc_meta:          pivoted.cpc_meta      ?? null,
        spend_google:      pivoted.spend_google  ?? null,
        spend_meta:        pivoted.spend_meta    ?? null,
        clicks_google:     pivoted.clicks_google ?? null,
        clicks_meta:       pivoted.clicks_meta   ?? null,
        conversions_google:pivoted.conversions_google ?? null,
        conversions_meta:  pivoted.conversions_meta   ?? null,
      };
    });

    // ── Previous period series: re-index by position so it overlays ────────
    // We align prev period onto the same x-axis positions as current period,
    // using an index-based offset so dates don't need to match exactly.
    const serialisedPrev = prevByDay.map((d) => ({
      date:        d.date instanceof Date
                     ? d.date.toISOString().split("T")[0]
                     : String(d.date).split("T")[0],
      roas_prev:   Number(Number(d.roas).toFixed(2)),
      ctr_prev:    Number(Number(d.ctr).toFixed(2)),
      cpc_prev:    Number(Number(d.cpc).toFixed(2)),
      spend_prev:  Number(d.spend),
      clicks_prev: Number(d.clicks),
      conversions_prev: Number(d.conversions),
    }));

    // Merge prev onto current by position index
    const mergedMetrics = serialisedMetrics.map((row, i) => ({
      ...row,
      roas_prev:        serialisedPrev[i]?.roas_prev        ?? null,
      ctr_prev:         serialisedPrev[i]?.ctr_prev         ?? null,
      cpc_prev:         serialisedPrev[i]?.cpc_prev         ?? null,
      spend_prev:       serialisedPrev[i]?.spend_prev       ?? null,
      clicks_prev:      serialisedPrev[i]?.clicks_prev      ?? null,
      conversions_prev: serialisedPrev[i]?.conversions_prev ?? null,
    }));

    // ── Comparison aggregates (existing logic, unchanged) ────────────────
    const cur  = currentRows[0];
    const prev = previousRows[0];

    function pctChange(curr: number, previous: number): number | null {
      if (!previous || previous === 0) return null;
      return Number((((curr - previous) / previous) * 100).toFixed(1));
    }

    const comparison = {
      roas:        { current: Number(Number(cur?.avgRoas ?? 0).toFixed(2)),    previous: Number(Number(prev?.avgRoas ?? 0).toFixed(2)),    change: pctChange(Number(cur?.avgRoas ?? 0),    Number(prev?.avgRoas ?? 0))    },
      ctr:         { current: Number(Number(cur?.avgCtr ?? 0).toFixed(2)),     previous: Number(Number(prev?.avgCtr ?? 0).toFixed(2)),     change: pctChange(Number(cur?.avgCtr ?? 0),     Number(prev?.avgCtr ?? 0))     },
      cpc:         { current: Number(Number(cur?.avgCpc ?? 0).toFixed(2)),     previous: Number(Number(prev?.avgCpc ?? 0).toFixed(2)),     change: pctChange(Number(cur?.avgCpc ?? 0),     Number(prev?.avgCpc ?? 0))     },
      spend:       { current: Number(Number(cur?.totalSpend ?? 0).toFixed(2)), previous: Number(Number(prev?.totalSpend ?? 0).toFixed(2)), change: pctChange(Number(cur?.totalSpend ?? 0), Number(prev?.totalSpend ?? 0)) },
      conversions: { current: Number(cur?.totalConversions ?? 0),              previous: Number(prev?.totalConversions ?? 0),              change: pctChange(Number(cur?.totalConversions ?? 0), Number(prev?.totalConversions ?? 0)) },
    };

    return NextResponse.json({
      metricsOverTime: mergedMetrics,   // now contains _google, _meta, _prev fields
      comparison,
    });

  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("[GET /api/analytics/trends]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
