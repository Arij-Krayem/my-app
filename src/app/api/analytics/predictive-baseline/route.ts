import { NextRequest, NextResponse } from "next/server";
import { AuthError, requireAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { spawn } from "child_process";
import path from "path";

interface HistoricalPoint {
  date: string;
  actual: number;
  ma7: number;
  ma14: number;
  ma28: number;
  upper: number;
  lower: number;
}

interface ForecastPoint {
  date: string;
  predicted: number;
  upper: number;
  lower: number;
  isPredicted: true;
}

interface PredictResult {
  historical: HistoricalPoint[];
  forecast: ForecastPoint[];
  summary: {
    lastActual: number;
    nextWeekAvg: number;
    trend: "up" | "down";
    trendPct: number;
    windowUsed: number;
    forecastDays: number;
    metric: string;
    platform: string;
    dataPoints: number;
  };
  error?: string;
}

function runPrediction(
  series: { date: string; metric: string; value: number; platform: string }[],
  window: number,
  forecastDays: number
): Promise<PredictResult> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(process.cwd(), "scripts", "anomaly_detection.py");
    const child = spawn("python3", [scriptPath, "--mode", "predict"]);

    let stdout = "";
    let stderr = "";

    child.stdin.write(JSON.stringify({ series, window, forecastDays }));
    child.stdin.end();

    child.stdout.on("data", (d) => {
      stdout += d.toString();
    });
    child.stderr.on("data", (d) => {
      stderr += d.toString();
    });

    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr || "Python script failed"));
        return;
      }

      try {
        resolve(JSON.parse(stdout));
      } catch {
        reject(new Error("Invalid JSON from Python script"));
      }
    });
  });
}

export async function GET(req: NextRequest) {
  try {
    const { userId, role } = requireAuth(req);
    const params = req.nextUrl.searchParams;
    const brandId = params.get("brandId") ?? null;
    const platform = params.get("platform") ?? null;
    const metric = (params.get("metric") ?? "spend").toLowerCase();
    const window = Math.min(Math.max(parseInt(params.get("window") ?? "7", 10), 7), 28);
    const dateFrom = params.get("dateFrom") ?? null;
    const dateTo = params.get("dateTo") ?? null;
    const forecastDays = 7;

    if (role === "MARKETER" && !brandId) {
      return NextResponse.json({ error: "brandId required for marketers" }, { status: 400 });
    }

    if (role === "MARKETER" && brandId) {
      const membership = await prisma.brandMember.findFirst({
        where: { userId, brandId },
      });

      if (!membership) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const where: Record<string, unknown> = {};
    if (brandId) where.brandId = brandId;
    if (platform) where.platform = platform;
    if (dateFrom || dateTo) {
      where.date = {
        ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
        ...(dateTo ? { lte: new Date(dateTo) } : {}),
      };
    }

    const facts = await prisma.performanceFact.findMany({
      where,
      orderBy: { date: "asc" },
      select: { date: true, platform: true, metrics: true, brandId: true },
    });

    if (facts.length < window) {
      return NextResponse.json(
        { error: `Not enough data - need at least ${window} days, found ${facts.length}` },
        { status: 422 }
      );
    }

    const byDate: Record<string, {
      spend: number;
      impressions: number;
      clicks: number;
      conversionValue: number;
      roasValues: number[];
    }> = {};

    for (const fact of facts) {
      const date = fact.date.toISOString().split("T")[0];
      const metrics = fact.metrics as Record<string, string | number>;

      if (!byDate[date]) {
        byDate[date] = { spend: 0, impressions: 0, clicks: 0, conversionValue: 0, roasValues: [] };
      }

      const spend = Number(metrics.spend ?? 0) || 0;
      const impressions = Number(metrics.impressions ?? 0) || 0;
      const clicks = Number(metrics.clicks ?? 0) || 0;
      const conversionValue = Number(metrics.conversionValue ?? metrics.conversion_value ?? 0) || 0;
      const roas = Number(metrics.roas);

      byDate[date].spend += spend;
      byDate[date].impressions += impressions;
      byDate[date].clicks += clicks;
      byDate[date].conversionValue += conversionValue;
      if (Number.isFinite(roas) && roas > 0) byDate[date].roasValues.push(roas);
    }

    const series = Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .flatMap(([date, agg]) => {
        let value: number | null = 0;

        if (metric === "spend") value = agg.spend;
        else if (metric === "roas") {
          if (agg.roasValues.length > 0) {
            value = agg.roasValues.reduce((sum, roas) => sum + roas, 0) / agg.roasValues.length;
          } else if (agg.spend > 0 && agg.conversionValue > 0) {
            value = agg.conversionValue / agg.spend;
          } else {
            value = null;
          }
        } else if (metric === "ctr") value = agg.impressions > 0 ? (agg.clicks / agg.impressions) * 100 : 0;
        else if (metric === "cpc") value = agg.clicks > 0 ? agg.spend / agg.clicks : 0;
        else value = agg.spend;

        if (value === null) return [];

        return [{
          date,
          metric,
          value: parseFloat(value.toFixed(6)),
          platform: platform ?? "ALL",
        }];
      });

    if (series.length < window) {
      const label = metric === "roas" ? "historical ROAS data" : "data";
      return NextResponse.json(
        { error: `Not enough ${label} to generate a prediction - need at least ${window} days, found ${series.length}` },
        { status: 422 }
      );
    }

    const result = await runPrediction(series, window, forecastDays);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 422 });
    }

    return NextResponse.json({
      ...result,
      meta: {
        metric,
        platform: platform ?? "ALL",
        brandId: brandId ?? "all",
        window,
        forecastDays,
        role,
      },
    });
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }

    const message = err instanceof Error ? err.message : "Prediction failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
