import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth, AuthError } from "@/lib/auth/auth-guard";

function getRecommendation(metric: string): string {
  const recommendations: Record<string, string> = {
    roas: "Investigate ROAS deviation and compare with campaign performance history",
    ctr: "Review click-through behavior and check creative or targeting changes",
    cpc: "Review bidding strategy, competition, and recent campaign changes",
    spend: "Check budget, pacing, and recent spend changes",
    conversions: "Check landing page, attribution, and conversion tracking",
    impressions: "Review reach, campaign status, and targeting settings",
    clicks: "Check ad delivery, targeting settings, and traffic quality",
  };

  return recommendations[metric.toLowerCase()] ?? "Investigate metric deviation and compare with historical data";
}

function buildDescription(metric: string, pctChange: number | null): string {
  const label = metric.toUpperCase();
  if (pctChange === null) return `${label} deviated from the statistical baseline`;
  return `${label} deviated by ${pctChange.toFixed(0)}% compared to baseline`;
}

// GET /api/anomalies displays persisted anomaly results only.
// Detection, email notifications, and socket events run from the upload ingest flow.
export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    const { searchParams } = req.nextUrl;
    const brandId = searchParams.get("brandId");

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
    if (filterBrandIds.length === 0) {
      return NextResponse.json({
        items: [],
        totalItems: 0,
        summary: { high: 0, medium: 0, low: 0 },
        engine: "Persisted anomalies",
      });
    }

    const anomalies = await prisma.anomaly.findMany({
      where: { brandId: { in: filterBrandIds } },
      orderBy: [{ zScore: "desc" }, { createdAt: "desc" }],
      take: 20,
    });

    const items = anomalies.map(anomaly => {
      const metricKey = anomaly.metricKey.toLowerCase();
      const pctChange = anomaly.pctChange ?? null;

      return {
        id: anomaly.id,
        campaign: anomaly.campaign ?? "Unknown Campaign",
        metric: metricKey.toUpperCase(),
        metricKey,
        score: Math.min(Math.abs(anomaly.zScore) / 4, 1),
        severity: anomaly.severity,
        dateRange: anomaly.date.toISOString().split("T")[0],
        description: buildDescription(metricKey, pctChange),
        platform: anomaly.platform ?? "Unknown",
        recommendation: getRecommendation(metricKey),
        direction: "up",
        z_score: anomaly.zScore,
        pct_change: pctChange ?? undefined,
        method: anomaly.method,
      };
    });

    const methods = Array.from(new Set(items.map(item => item.method).filter(Boolean)));

    return NextResponse.json({
      items,
      totalItems: items.length,
      summary: {
        high: items.filter(a => a.severity === "HIGH").length,
        medium: items.filter(a => a.severity === "MEDIUM").length,
        low: items.filter(a => a.severity === "LOW").length,
      },
      engine: methods.length > 1 ? "Mixed methods" : methods[0] ?? "Persisted anomalies",
    });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("[anomalies]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
