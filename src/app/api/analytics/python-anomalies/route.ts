import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, AuthError } from "@/lib/auth-guard";
import { spawn } from "child_process";
import path from "path";

async function runPython(inputData: object): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(process.cwd(), "scripts", "anomaly_detection.py");
    const py         = spawn("python", [scriptPath]);
    let output = "";
    let errors = "";

    py.stdin.write(JSON.stringify(inputData));
    py.stdin.end();

    py.stdout.on("data", (d) => { output += d.toString(); });
    py.stderr.on("data", (d) => { errors += d.toString(); });

    py.on("close", (code) => {
      if (code !== 0) reject(new Error(errors));
      else {
        try { resolve(JSON.parse(output)); }
        catch { reject(new Error("Invalid JSON from Python")); }
      }
    });
  });
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    const { brandId, metricKey } = await req.json();

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
      value:  Number((f.metrics as any)[metricKey] ?? 0),
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