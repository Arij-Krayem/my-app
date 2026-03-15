import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, AuthError } from "@/lib/auth-guard";

function evaluate(value: number, operator: string, threshold: number): boolean {
  switch (operator) {
    case ">":  return value > threshold;
    case "<":  return value < threshold;
    case ">=": return value >= threshold;
    case "<=": return value <= threshold;
    case "==": return value === threshold;
    default:   return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    const { brandId } = await req.json();

    if (!brandId) return NextResponse.json({ error: "brandId required" }, { status: 400 });

    // Verify access
    if (payload.role !== "AGENCY_ADMIN") {
      const member = await prisma.brandMember.findFirst({
        where: { userId: payload.userId, brandId },
      });
      if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get active rules for this brand
    const rules = await prisma.alertRule.findMany({
      where: { brandId, isActive: true },
    });

    if (rules.length === 0) {
      return NextResponse.json({ checked: 0, created: 0 });
    }

    // Get latest performance facts (last 7 days)
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const facts = await prisma.performanceFact.findMany({
      where: { brandId, date: { gte: since } },
    });

    if (facts.length === 0) {
      return NextResponse.json({ checked: rules.length, created: 0, message: "No recent data" });
    }

    // Aggregate metrics across all facts
    const totals: Record<string, number[]> = {};
    for (const fact of facts) {
      const metrics = fact.metrics as Record<string, number>;
      for (const [key, val] of Object.entries(metrics)) {
        if (typeof val === "number") {
          if (!totals[key]) totals[key] = [];
          totals[key].push(val);
        }
      }
    }

    const aggregated: Record<string, number> = {};
    for (const [key, vals] of Object.entries(totals)) {
      aggregated[key] = vals.reduce((a, b) => a + b, 0) / vals.length; // avg
    }
    // spend and clicks should be sum not avg
    for (const sumKey of ["spend", "clicks", "impressions", "conversions"]) {
      if (totals[sumKey]) {
        aggregated[sumKey] = totals[sumKey].reduce((a, b) => a + b, 0);
      }
    }

    let created = 0;
    for (const rule of rules) {
      const value = aggregated[rule.metricKey];
      if (value === undefined) continue;

      if (evaluate(value, rule.operator, rule.threshold)) {
        // Check if an OPEN alert already exists for this rule
        const existing = await prisma.alert.findFirst({
          where: { ruleId: rule.id, status: "OPEN" },
        });
        if (existing) continue;

        await prisma.alert.create({
          data: {
            brandId,
            ruleId: rule.id,
            status: "OPEN",
            message: `${rule.metricKey} is ${value.toFixed(2)} ${rule.operator} ${rule.threshold} (${rule.severity})`,
          },
        });
        created++;
      }
    }

    return NextResponse.json({ checked: rules.length, created });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("[alerts/check]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}