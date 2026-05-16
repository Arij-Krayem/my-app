import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth, AuthError } from "@/lib/auth/auth-guard";
import { spawn } from "child_process";
import path from "path";

interface PythonAnomaly {
  date?: string;
  metric?: string;
  value?: number;
  score?: number;
  severity?: string;
  [key: string]: unknown;
}

function metricValue(metrics: unknown, metricKey: string): number {
  if (!metrics || typeof metrics !== "object" || Array.isArray(metrics)) return 0;
  const value = (metrics as Record<string, unknown>)[metricKey];
  return Number(value ?? 0);
}

async function runPython(inputData: object): Promise<PythonAnomaly[]> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(process.cwd(), "scripts", "anomaly_detection.py");
    const pythonBin  = process.env.PYTHON_BIN?.trim() || "python";
    const py         = spawn(pythonBin, [scriptPath]);
    let output = "";
    let errors = "";

    py.stdin.write(JSON.stringify(inputData));
    py.stdin.end();

    py.stdout.on("data", (d) => { output += d.toString(); });
    py.stderr.on("data", (d) => { errors += d.toString(); });

    py.on("close", (code) => {
      if (code !== 0) reject(new Error(errors));
      else {
        try { resolve(JSON.parse(output) as PythonAnomaly[]); }
        catch { reject(new Error("Invalid JSON from Python")); }
      }
    });
  });
}

export async function POST(req: NextRequest) {
  try {
    requireAuth(req);
    const body = await req.json() as { brandId?: unknown; metricKey?: unknown };
    const brandId = typeof body.brandId === "string" ? body.brandId : "";
    const metricKey = typeof body.metricKey === "string" ? body.metricKey : "";

    if (!brandId || !metricKey) {
      return NextResponse.json({ error: "brandId and metricKey are required" }, { status: 400 });
    }

    // Fetch facts from DB
    const facts = await prisma.performanceFact.findMany({
      where:   { brandId },
      orderBy: { date: "asc" },
      select:  { date: true, metrics: true },
    });

    // Build time series for the metric
    const series = facts.map(f => ({
      date:   f.date.toISOString().split("T")[0],
      metric: metricKey,
      value:  metricValue(f.metrics, metricKey),
    })).filter(d => d.value > 0);

    if (series.length < 3)
      return NextResponse.json({ anomalies: [], message: "Not enough data" });

    // Call Python
    const anomalies = await runPython({ series });

    return NextResponse.json({ anomalies, total: anomalies.length });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("[python-anomalies]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
