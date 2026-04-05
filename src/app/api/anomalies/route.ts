import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, AuthError } from "@/lib/auth-guard";
import { sendAnomalyEmail } from "@/lib/notification-mailer";
import { spawn } from "child_process";
import path from "path";

// ── Python bridge ────────────────────────────────────────────────────────────
async function runPythonDetection(series: object[]): Promise<{
  anomalies: any[];
  total: number;
  high: number;
  medium: number;
  low: number;
  method: string;
  error?: string;
}> {
  return new Promise((resolve) => {
    const scriptPath = path.join(process.cwd(), "scripts", "anomaly_detection.py");

    // Try python3 first, fall back to python
    const pythonCmd = process.platform === "win32" ? "python" : "python3";
    const py        = spawn(pythonCmd, [scriptPath], { timeout: 15000 });

    let output = "";
    let errors = "";

    py.stdin.write(JSON.stringify({ series }));
    py.stdin.end();

    py.stdout.on("data", (d) => { output += d.toString(); });
    py.stderr.on("data", (d) => { errors += d.toString(); });

    py.on("close", (code) => {
      if (code !== 0) {
        console.error("[python-anomalies] Python error:", errors);
        resolve({ anomalies: [], total: 0, high: 0, medium: 0, low: 0, method: "fallback", error: errors });
      } else {
        try {
          const result = JSON.parse(output);
          resolve(result);
        } catch {
          console.error("[python-anomalies] JSON parse error:", output);
          resolve({ anomalies: [], total: 0, high: 0, medium: 0, low: 0, method: "fallback", error: "Parse error" });
        }
      }
    });

    py.on("error", (err) => {
      console.error("[python-anomalies] Spawn error:", err.message);
      resolve({ anomalies: [], total: 0, high: 0, medium: 0, low: 0, method: "fallback", error: err.message });
    });
  });
}

// ── JS fallback Z-Score (if Python unavailable) ──────────────────────────────
function jsZScore(values: number[]): number[] {
  if (values.length < 2) return values.map(() => 0);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const std  = Math.sqrt(values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length);
  if (std === 0) return values.map(() => 0);
  return values.map(v => Math.abs((v - mean) / std));
}

function getRecommendation(metric: string, direction: "up" | "down"): string {
  const map: Record<string, { up: string; down: string }> = {
    roas:        { down: "Review campaign budget and bid strategy",      up: "Performance spike — verify tracking accuracy"  },
    ctr:         { down: "Refresh ad creatives and targeting",           up: "Unusual CTR spike — check for click fraud"     },
    cpc:         { up:   "Review bidding strategy and competition",      down: "CPC drop — monitor conversion quality"       },
    spend:       { up:   "Budget cap may have been lifted unexpectedly", down: "Underspend — check budget and targeting"     },
    conversions: { down: "Check landing page and conversion tracking",   up: "Conversion spike — verify attribution"         },
    impressions: { down: "Check campaign status and targeting",          up: "Impression spike — review reach settings"     },
  };
  return map[metric]?.[direction] ?? "Investigate metric deviation and compare with historical data";
}

function jsFallbackDetection(facts: any[]): any[] {
  const METRICS = ["roas", "ctr", "cpc", "spend", "conversions", "impressions", "clicks"];
  const series: Record<string, { campaign: string; platform: string; values: number[]; dates: string[] }> = {};

  for (const fact of facts) {
    const metrics    = fact.metrics as Record<string, number>;
    const dimensions = fact.dimensions as Record<string, string>;
    const campaign   = dimensions?.campaign_name ?? dimensions?.adset_name ?? "Unknown";
    const dateStr    = fact.date instanceof Date ? fact.date.toISOString().split("T")[0] : String(fact.date).split("T")[0];

    for (const key of METRICS) {
      const val = metrics[key];
      if (typeof val !== "number") continue;
      const k = `${fact.brandId}__${campaign}__${fact.platform}__${key}`;
      if (!series[k]) series[k] = { campaign, platform: fact.platform, values: [], dates: [] };
      series[k].values.push(val);
      series[k].dates.push(dateStr);
    }
  }

  const anomalies: any[] = [];
  for (const [, s] of Object.entries(series)) {
    if (s.values.length < 3) continue;
    const scores = jsZScore(s.values);
    const mean   = s.values.reduce((a, b) => a + b, 0) / s.values.length;
    let maxScore = 0; let maxIdx = 0;
    scores.forEach((sc, i) => { if (sc > maxScore) { maxScore = sc; maxIdx = i; } });
    if (maxScore < 1.5) continue;
    const severity   = maxScore >= 2.5 ? "HIGH" : "MEDIUM";
    const anomalVal  = s.values[maxIdx];
    const direction  = anomalVal > mean ? "up" : "down";
    const pctChange  = mean > 0 ? Math.abs((anomalVal - mean) / mean) * 100 : 0;
    anomalies.push({
      date: s.dates[s.dates.length - 1], metric: "unknown", metricKey: "unknown",
      campaign: s.campaign, platform: s.platform,
      value: anomalVal, mean: Number(mean.toFixed(4)), z_score: maxScore,
      severity, direction, pct_change: pctChange,
      score: Math.min(maxScore / 4, 1),
      recommendation: getRecommendation("roas", direction),
      description: `Metric ${direction === "down" ? "dropped" : "spiked"} by ${pctChange.toFixed(0)}% vs baseline`,
      method: "JS-Fallback",
    });
  }
  return anomalies.sort((a, b) => b.z_score - a.z_score).slice(0, 20);
}

// ── GET /api/anomalies ───────────────────────────────────────────────────────
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
        where: { userId: payload.userId }, select: { brandId: true },
      });
      brandIds = memberships.map(m => m.brandId);
    }
    const filterBrandIds = brandId && brandIds.includes(brandId) ? [brandId] : brandIds;

    // Fetch performance facts (last 30 days)
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const facts = await prisma.performanceFact.findMany({
      where:   { brandId: { in: filterBrandIds }, date: { gte: since } },
      orderBy: { date: "asc" },
      select:  { id: true, date: true, platform: true, brandId: true, metrics: true, dimensions: true },
    });

    if (facts.length < 3)
      return NextResponse.json({ items: [], message: "Not enough data for anomaly detection (need 3+ data points)", engine: "none" });

    // Build series for Python
    const METRICS = ["roas", "ctr", "cpc", "spend", "conversions", "impressions", "clicks"];
    const pythonSeries: any[] = [];

    for (const fact of facts) {
      const metrics    = fact.metrics as Record<string, number>;
      const dimensions = fact.dimensions as Record<string, string>;
      const campaign   = dimensions?.campaign_name ?? dimensions?.adset_name ?? "Unknown Campaign";
      const dateStr    = fact.date instanceof Date ? fact.date.toISOString().split("T")[0] : String(fact.date).split("T")[0];
      const platform   = fact.platform === "GOOGLE" ? "Google" : "Meta";

      for (const key of METRICS) {
        const val = metrics[key];
        if (typeof val !== "number" || val <= 0) continue;
        pythonSeries.push({ date: dateStr, metric: key, value: val, campaign, platform, brandId: fact.brandId });
      }
    }

    // Try Python first, fall back to JS
    let result = await runPythonDetection(pythonSeries);
    let anomalies = result.anomalies ?? [];
    let engine    = result.method ?? "Python Z-Score + IQR";

    if (anomalies.length === 0 && result.error) {
      console.warn("[anomalies] Python failed, using JS fallback:", result.error);
      anomalies = jsFallbackDetection(facts as any[]);
      engine    = "JS Z-Score (fallback)";
    }

    // Send emails for HIGH anomalies (once per day per metric per brand)
    const highAnomalies = anomalies.filter((a: any) => a.severity === "HIGH");
    if (highAnomalies.length > 0) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      for (const anomaly of highAnomalies) {
        const anomalyBrandId = anomaly.brandId ?? filterBrandIds[0];
        if (!anomalyBrandId) continue;

        try {
          const sentToday = await prisma.notification.findFirst({
            where: {
              brandId:   anomalyBrandId,
              type:      "ANOMALY",
              createdAt: { gte: todayStart },
              message:   { contains: anomaly.metric },
            },
          });
          if (sentToday) continue;

          const [brandMembers, admins, brandData] = await Promise.all([
            prisma.brandMember.findMany({
              where:   { brandId: anomalyBrandId },
              include: { user: { select: { email: true } } },
            }),
            prisma.user.findMany({ where: { role: "AGENCY_ADMIN" }, select: { email: true } }),
            prisma.brand.findUnique({ where: { id: anomalyBrandId }, select: { name: true } }),
          ]);

          const allEmails = Array.from(new Set([
            ...brandMembers.map(m => m.user.email),
            ...admins.map(a => a.email),
          ]));

          if (!allEmails.length) continue;

          await sendAnomalyEmail({
            brandName:      brandData?.name ?? anomalyBrandId,
            campaign:       anomaly.campaign,
            metric:         anomaly.metric,
            score:          anomaly.score,
            description:    anomaly.description,
            dateRange:      `Last 30 days (detected: ${anomaly.date})`,
            platform:       anomaly.platform,
            recommendation: anomaly.recommendation,
            recipients:     allEmails,
          });

          // Record notification
          const notification = await prisma.notification.create({
            data: {
              brandId: anomalyBrandId,
              type:    "ANOMALY",
              message: `HIGH anomaly (${engine}): ${anomaly.metric} in ${anomaly.campaign} — Z-Score: ${anomaly.z_score?.toFixed(2)}, Change: ${anomaly.pct_change?.toFixed(0)}%`,
              status:  "OPEN",
            },
          });

          const recipientUsers = await prisma.user.findMany({
            where:  { email: { in: allEmails } },
            select: { id: true },
          });

          await prisma.notificationRecipient.createMany({
            data: recipientUsers.map(u => ({ notificationId: notification.id, userId: u.id })),
            skipDuplicates: true,
          });

          console.log(`[anomalies] Email sent for HIGH anomaly: ${anomaly.metric} in ${anomaly.campaign}`);
        } catch (emailErr) {
          console.error("[anomalies] Email failed:", emailErr);
        }
      }
    }

    return NextResponse.json({
      items:      anomalies,
      totalItems: anomalies.length,
      summary: {
        high:   anomalies.filter((a: any) => a.severity === "HIGH").length,
        medium: anomalies.filter((a: any) => a.severity === "MEDIUM").length,
        low:    anomalies.filter((a: any) => a.severity === "LOW").length,
      },
      engine,
    });

  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("[anomalies]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}