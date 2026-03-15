import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, AuthError } from "@/lib/auth-guard";

// Z-Score anomaly detection
function zScore(values: number[]): number[] {
  if (values.length < 2) return values.map(() => 0);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const std  = Math.sqrt(values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length);
  if (std === 0) return values.map(() => 0);
  return values.map(v => Math.abs((v - mean) / std));
}

function severityFromScore(score: number): "HIGH" | "MEDIUM" | "LOW" {
  if (score >= 2.5) return "HIGH";
  if (score >= 1.5) return "MEDIUM";
  return "LOW";
}

function getRecommendation(metric: string, direction: "up" | "down"): string {
  const map: Record<string, { up: string; down: string }> = {
    roas:        { down: "Review campaign budget and bid strategy", up: "Performance spike — verify tracking accuracy" },
    ctr:         { down: "Refresh ad creatives and targeting", up: "Unusual CTR spike — check for click fraud" },
    cpc:         { up:   "Review bidding strategy and competition", down: "CPC drop — monitor conversion quality" },
    spend:       { up:   "Budget cap may have been lifted unexpectedly", down: "Underspend — check budget and targeting" },
    conversions: { down: "Check landing page and conversion tracking", up: "Conversion spike — verify attribution" },
    impressions: { down: "Check campaign status and targeting", up: "Impression spike — review reach settings" },
  };
  return map[metric]?.[direction] ?? "Investigate metric deviation and compare with historical data";
}

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    const { searchParams } = req.nextUrl;
    const brandId = searchParams.get("brandId");

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

    const filterBrandIds = brandId && brandIds.includes(brandId) ? [brandId] : brandIds;

    // Fetch performance facts (last 30 days)
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const facts = await prisma.performanceFact.findMany({
      where: { brandId: { in: filterBrandIds }, date: { gte: since } },
      orderBy: { date: "asc" },
      select: {
        id: true, date: true, platform: true, brandId: true,
        metrics: true, dimensions: true,
      },
    });

    if (facts.length < 3) {
      return NextResponse.json({ items: [], message: "Not enough data for anomaly detection (need 3+ data points)" });
    }

    // Group facts by campaign + metric for time-series analysis
    type SeriesKey = string;
    const series: Record<SeriesKey, {
      campaign: string; platform: string; brandId: string;
      metric: string; values: number[]; dates: string[];
    }> = {};

    const METRICS_TO_CHECK = ["roas", "ctr", "cpc", "spend", "conversions", "impressions", "clicks"];

    for (const fact of facts) {
      const metrics    = fact.metrics as Record<string, number>;
      const dimensions = fact.dimensions as Record<string, string>;
      const campaign   = dimensions?.campaign_name ?? dimensions?.adset_name ?? "Unknown Campaign";
      const platform   = fact.platform;
      const dateStr    = new Date(fact.date).toISOString().split("T")[0];

      for (const metricKey of METRICS_TO_CHECK) {
        const val = metrics[metricKey];
        if (val === undefined || val === null || typeof val !== "number") continue;

        const key = `${fact.brandId}__${campaign}__${platform}__${metricKey}`;
        if (!series[key]) {
          series[key] = { campaign, platform, brandId: fact.brandId, metric: metricKey, values: [], dates: [] };
        }
        series[key].values.push(val);
        series[key].dates.push(dateStr);
      }
    }

    // Run Z-Score detection on each series
    const anomalies: any[] = [];

    for (const [, s] of Object.entries(series)) {
      if (s.values.length < 3) continue;

      const scores = zScore(s.values);
      const mean   = s.values.reduce((a, b) => a + b, 0) / s.values.length;

      // Find max anomaly in this series
      let maxScore = 0;
      let maxIdx   = 0;
      scores.forEach((sc, i) => { if (sc > maxScore) { maxScore = sc; maxIdx = i; } });

      if (maxScore < 1.5) continue; // Not anomalous enough

      const severity  = severityFromScore(maxScore);
      const anomalVal = s.values[maxIdx];
      const direction = anomalVal > mean ? "up" : "down";
      const pctChange = mean > 0 ? Math.abs((anomalVal - mean) / mean) * 100 : 0;

      const dateStart = s.dates[0];
      const dateEnd   = s.dates[s.dates.length - 1];

      const dirLabel  = direction === "down" ? "dropped" : "spiked";
      const description = `${s.metric.toUpperCase()} ${dirLabel} by ${pctChange.toFixed(0)}% compared to baseline performance`;

      anomalies.push({
        id:          `${s.brandId}_${s.campaign}_${s.metric}_${maxIdx}`,
        campaign:    s.campaign,
        metric:      s.metric.toUpperCase(),
        score:       Math.min(maxScore / 4, 1), // normalize 0-1
        severity,
        dateRange:   `${dateStart} to ${dateEnd}`,
        description,
        platform:    s.platform === "GOOGLE" ? "Google" : "Meta",
        brandId:     s.brandId,
        direction,
        recommendation: getRecommendation(s.metric, direction),
        rawScore:    maxScore,
      });
    }

    // Sort by score desc, deduplicate by campaign+metric
    const seen = new Set<string>();
    const deduped = anomalies
      .sort((a, b) => b.rawScore - a.rawScore)
      .filter(a => {
        const key = `${a.campaign}__${a.metric}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 20); // max 20 anomalies

    return NextResponse.json({ items: deduped, totalItems: deduped.length });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("[anomalies]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}