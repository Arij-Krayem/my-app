// src/lib/anomaly-engine.ts
// ─── Runs after CSV ingest: Python detection → DB → email → Socket.io emit ───

import { spawn }              from "child_process";
import { existsSync, statSync } from "fs";
import path                   from "path";
import { prisma }             from "@/lib/prisma";
import { sendAnomalyEmail }   from "@/lib/notification-mailer";
import { getSocketServer }    from "@/lib/socket-server";

interface RawFact {
  date:     Date;
  metrics:  Record<string, number>;
  dimensions: Record<string, string>;
  platform: string;
}

interface PythonAnomaly {
  date:       string;
  metric:     string;
  value:      number;
  campaign:   string;
  platform:   string;
  z_score:    number;
  pct_change: number | null;
  severity:   "HIGH" | "MEDIUM" | "LOW";
  method:     string;
}

interface PythonResult {
  anomalies: PythonAnomaly[];
  total:     number;
  high:      number;
  medium:    number;
  low:       number;
  method:    string;
}

type AnomalyInput = { date: string; metric: string; value: number; campaign: string; platform: string };
type PythonCommand = { command: string; args: string[]; label: string };

function cleanPythonCommand(command: string): string {
  return command.trim().replace(/^["']|["']$/g, "");
}

function isWindowsAppExecutionAlias(command: string): boolean {
  if (process.platform !== "win32") return false;

  try {
    if (!existsSync(command)) return false;
    const normalized = path.normalize(command).toLowerCase();
    return normalized.includes("\\windowsapps\\") && statSync(command).size === 0;
  } catch {
    return false;
  }
}

// ── Run Python Z-Score + IQR detection ───────────────────────────────────────
function runPythonProcess(python: PythonCommand, inputData: AnomalyInput[]): Promise<PythonResult> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(process.cwd(), "scripts", "anomaly_detection.py");
    const child      = spawn(python.command, [...python.args, scriptPath]);

    let stdout = "";
    let stderr = "";

    child.stdin.write(JSON.stringify({ series: inputData }));
    child.stdin.end();

    child.stdout.on("data", (d: Buffer) => { stdout += d.toString(); });
    child.stderr.on("data", (d: Buffer) => { stderr += d.toString(); });

    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`${python.label} exited ${code}: ${stderr || stdout}`));
        return;
      }
      try {
        resolve(JSON.parse(stdout) as PythonResult);
      } catch {
        reject(new Error(`${python.label} returned invalid JSON: ${stdout}`));
      }
    });

    child.on("error", err => reject(new Error(`${python.label} failed: ${err.message}`)));
  });
}

async function runPythonDetection(inputData: AnomalyInput[]): Promise<PythonResult> {
  const envPython = process.env.PYTHON_BIN?.trim();
  const commands: PythonCommand[] = [];
  let lastError: unknown;
  const errors: string[] = [];

  if (envPython) {
    const command = cleanPythonCommand(envPython);
    if (isWindowsAppExecutionAlias(command)) {
      errors.push(`PYTHON_BIN points to a Windows app execution alias, not a real Python interpreter: ${command}`);
    } else {
      commands.push({ command, args: [], label: `PYTHON_BIN (${command})` });
    }
  }

  commands.push(
    ...(process.platform === "win32"
      ? [
          { command: "py", args: ["-3"], label: "py -3" },
          { command: "python", args: [], label: "python" },
          { command: "python3", args: [], label: "python3" },
        ]
      : [
          { command: "python3", args: [], label: "python3" },
          { command: "python", args: [], label: "python" },
        ])
  );

  for (const command of commands) {
    try {
      return await runPythonProcess(command, inputData);
    } catch (err) {
      lastError = err;
      errors.push(err instanceof Error ? err.message : String(err));
    }
  }

  throw new Error(errors.length ? `Python detection failed. ${errors.join(" | ")}` : String(lastError));
}

function anomalyScore(zScore: number): number {
  return Math.min(Math.abs(zScore) / 4, 1);
}

// ── JS fallback Z-Score (if Python unavailable) ──────────────────────────────
function runJSDetection(inputData: AnomalyInput[]): PythonResult {
  const grouped: Record<string, number[]> = {};
  for (const row of inputData) {
    const key = `${row.metric}::${row.campaign}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(row.value);
  }

  const anomalies: PythonAnomaly[] = [];

  for (const row of inputData) {
    const key    = `${row.metric}::${row.campaign}`;
    const values = grouped[key];
    if (values.length < 2) continue;

    const mean   = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(values.map(v => Math.pow(v - mean, 2)).reduce((a, b) => a + b, 0) / values.length);
    if (stdDev === 0) continue;

    const zScore   = Math.abs((row.value - mean) / stdDev);
    const severity = zScore >= 2.5 ? "HIGH" : zScore >= 1.5 ? "MEDIUM" : "LOW";

    if (zScore >= 1.5) {
      anomalies.push({
        ...row,
        z_score:    Number(zScore.toFixed(2)),
        pct_change: mean > 0 ? Number((((row.value - mean) / mean) * 100).toFixed(1)) : null,
        severity,
        method:     "js-fallback",
      });
    }
  }

  // Dedup: keep top anomaly per campaign+metric
  const seen = new Set<string>();
  const deduped = anomalies
    .sort((a, b) => b.z_score - a.z_score)
    .filter(a => {
      const k = `${a.campaign}::${a.metric}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .slice(0, 20);

  return {
    anomalies: deduped,
    total:     deduped.length,
    high:      deduped.filter(a => a.severity === "HIGH").length,
    medium:    deduped.filter(a => a.severity === "MEDIUM").length,
    low:       deduped.filter(a => a.severity === "LOW").length,
    method:    "js-fallback",
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN EXPORT — call this from ingest route (non-blocking)
// ═══════════════════════════════════════════════════════════════════════════
export async function runAnomalyCheck(brandId: string, uploadId: string): Promise<void> {
  try {
    console.log(`[anomaly-engine] Starting for brand=${brandId} upload=${uploadId}`);

    // ── 1. Load recent facts (last 60 days) ──────────────────────────────
    const since = new Date();
    since.setDate(since.getDate() - 60);

    const facts = await prisma.performanceFact.findMany({
      where: { brandId, date: { gte: since } },
      orderBy: { date: "asc" },
    }) as unknown as RawFact[];

    if (facts.length < 3) {
      console.log("[anomaly-engine] Not enough data points, skipping");
      return;
    }

    // ── 2. Build input array for Python ──────────────────────────────────
    const METRICS = ["roas", "ctr", "cpc", "spend", "clicks", "conversions"];
    const inputData: { date: string; metric: string; value: number; campaign: string; platform: string }[] = [];

    for (const fact of facts) {
      const metrics    = fact.metrics    as Record<string, number>;
      const dimensions = fact.dimensions as Record<string, string>;
      const campaign   = dimensions?.campaign ?? dimensions?.campaign_name ?? "unknown";
      const dateStr    = fact.date instanceof Date
        ? fact.date.toISOString().split("T")[0]
        : String(fact.date).split("T")[0];

      for (const metric of METRICS) {
        const value = metrics[metric];
        if (typeof value === "number" && !isNaN(value)) {
          inputData.push({ date: dateStr, metric, value, campaign, platform: fact.platform });
        }
      }
    }

    if (inputData.length === 0) {
      console.log("[anomaly-engine] No metric data to analyse");
      return;
    }

    // ── 3. Run detection (Python with JS fallback) ────────────────────────
    let result: PythonResult;
    try {
      result = await runPythonDetection(inputData);
      console.log(`[anomaly-engine] Python detected ${result.total} anomalies (${result.high} HIGH)`);
    } catch (pyErr) {
      console.warn("[anomaly-engine] Python failed, using JS fallback:", pyErr);
      result = runJSDetection(inputData);
      console.log(`[anomaly-engine] JS fallback detected ${result.total} anomalies`);
    }

    if (result.anomalies.length === 0) {
      console.log("[anomaly-engine] No anomalies found");
      return;
    }

    const accuracy = await prisma.accuracy.findUnique({
      where: { brandId },
      select: { threshold: true },
    });
    const alertThreshold = accuracy?.threshold ?? 0.8;
    const thresholdedAnomalies = result.anomalies.filter(a => anomalyScore(a.z_score) >= alertThreshold);

    if (thresholdedAnomalies.length === 0) {
      console.log(`[anomaly-engine] ${result.anomalies.length} anomalies found, none met threshold ${(alertThreshold * 100).toFixed(0)}%`);
      return;
    }

    // ── 4. Save anomalies to DB ───────────────────────────────────────────
    const savedAnomalies = await Promise.all(
      thresholdedAnomalies.map(a =>
        prisma.anomaly.create({
          data: {
            brandId,
            uploadId,
            metricKey: a.metric,
            campaign:  a.campaign ?? null,
            platform:  a.platform ?? null,
            value:     a.value,
            zScore:    a.z_score,
            pctChange: a.pct_change ?? null,
            severity:  a.severity,
            method:    a.method ?? result.method,
            date:      new Date(a.date + "T12:00:00"),
          },
        })
      )
    );

    console.log(`[anomaly-engine] Saved ${savedAnomalies.length} anomalies to DB`);

    await prisma.alert.createMany({
      data: savedAnomalies.map((saved, index) => {
        const source = thresholdedAnomalies[index];
        return {
          brandId,
          anomalyId: saved.id,
          status: "OPEN",
          message: `${source.severity === "HIGH" ? "CRITICAL" : "WARNING"} anomaly: ${source.metric} score=${(anomalyScore(source.z_score) * 100).toFixed(0)}% z=${source.z_score} campaign=${source.campaign}`,
        };
      }),
    });

    console.log(`[anomaly-engine] Created ${savedAnomalies.length} anomaly alert rows`);

    // ── 5. Email — HIGH only, once per day per metric per brand ──────────
    const highAnomalies = thresholdedAnomalies.filter(a => a.severity === "HIGH");

    if (highAnomalies.length > 0) {
      const brand = await prisma.brand.findUnique({
        where: { id: brandId },
        select: { name: true },
      });

      const [brandMembers, admins] = await Promise.all([
        prisma.brandMember.findMany({
          where:   { brandId },
          include: { user: { select: { email: true } } },
        }),
        prisma.user.findMany({
          where:  { role: "AGENCY_ADMIN" },
          select: { email: true },
        }),
      ]);

      const allEmails = Array.from(new Set([
        ...brandMembers.map(m => m.user.email),
        ...admins.map(a => a.email),
      ]));

      if (allEmails.length > 0) {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        // Once-per-day dedup per metric
        for (const anomaly of highAnomalies) {
          const alreadySent = await prisma.notification.findFirst({
            where: {
              brandId,
              type:      "ANOMALY",
              createdAt: { gte: todayStart },
              message:   { contains: anomaly.metric },
            },
          });

          if (!alreadySent) {
            try {
              await sendAnomalyEmail({
                brandName:  brand?.name ?? brandId,
                anomalies:  [anomaly],
                recipients: allEmails,
              });

              const notification = await prisma.notification.create({
                data: {
                  brandId,
                  type:    "ANOMALY",
                  message: `HIGH anomaly: ${anomaly.metric} z=${anomaly.z_score} campaign=${anomaly.campaign}`,
                  status:  "OPEN",
                },
              });

              const recipientUsers = await prisma.user.findMany({
                where:  { email: { in: allEmails } },
                select: { id: true },
              });

              await prisma.notificationRecipient.createMany({
                data: recipientUsers.map(u => ({
                  notificationId: notification.id,
                  userId:         u.id,
                })),
                skipDuplicates: true,
              });

              console.log(`[anomaly-engine] Email sent for HIGH anomaly: ${anomaly.metric}`);
            } catch (emailErr) {
              console.error("[anomaly-engine] Email failed:", emailErr);
            }
          }
        }
      }
    }

    // ── 6. Emit Socket.io event → browser notification ────────────────────
    try {
      const io = getSocketServer();
      if (io) {
        // Emit to the brand's room so only relevant users get notified
        io.to(`brand:${brandId}`).emit("anomalies:detected", {
          brandId,
          uploadId,
          total:  thresholdedAnomalies.length,
          high:   thresholdedAnomalies.filter(a => a.severity === "HIGH").length,
          medium: thresholdedAnomalies.filter(a => a.severity === "MEDIUM").length,
          low:    thresholdedAnomalies.filter(a => a.severity === "LOW").length,
          method: result.method,
          topAnomalies: thresholdedAnomalies.slice(0, 3).map(a => ({
            metric:   a.metric,
            severity: a.severity,
            zScore:   a.z_score,
            campaign: a.campaign,
          })),
        });
        console.log(`[anomaly-engine] Socket.io event emitted to brand:${brandId}`);
      }
    } catch (socketErr) {
      // Socket failing should never block the ingest response
      console.warn("[anomaly-engine] Socket.io emit failed (non-critical):", socketErr);
    }

  } catch (err) {
    console.error("[anomaly-engine] Unexpected error:", err);
  }
}
