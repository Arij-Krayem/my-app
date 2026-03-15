import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, AuthError } from "@/lib/auth-guard";
import { sendAlertEmail } from "@/lib/notification-mailer";

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

    // Get brand name for emails
    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
      select: { name: true },
    });

    // Get active rules for this brand
    const rules = await prisma.alertRule.findMany({
      where: { brandId, isActive: true },
    });

    if (rules.length === 0) {
      return NextResponse.json({ checked: 0, created: 0 });
    }

    // Get latest performance facts (last 30 days)
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const facts = await prisma.performanceFact.findMany({
      where: { brandId, date: { gte: since } },
    });

    if (facts.length === 0) {
      return NextResponse.json({ checked: rules.length, created: 0, message: "No recent data" });
    }

    // Aggregate metrics
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
      aggregated[key] = vals.reduce((a, b) => a + b, 0) / vals.length;
    }
    for (const sumKey of ["spend", "clicks", "impressions", "conversions"]) {
      if (totals[sumKey]) {
        aggregated[sumKey] = totals[sumKey].reduce((a, b) => a + b, 0);
      }
    }

    // Get recipients: brand members + all agency admins
    const [brandMembers, admins] = await Promise.all([
      prisma.brandMember.findMany({
        where: { brandId },
        include: { user: { select: { email: true } } },
      }),
      prisma.user.findMany({
        where: { role: "AGENCY_ADMIN" },
        select: { email: true },
      }),
    ]);

    const allEmails = Array.from(new Set([
      ...brandMembers.map(m => m.user.email),
      ...admins.map(a => a.email),
    ]));

    // Once-per-day dedup: check if we already sent for this rule today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    let created    = 0;
    let emailsSent = 0;

    for (const rule of rules) {
      const value = aggregated[rule.metricKey];
      if (value === undefined) continue;

      if (evaluate(value, rule.operator, rule.threshold)) {
        // Check if OPEN alert already exists for this rule
        const existing = await prisma.alert.findFirst({
          where: { ruleId: rule.id, status: "OPEN" },
        });
        if (existing) continue;

        // Create the alert
        const alert = await prisma.alert.create({
          data: {
            brandId,
            ruleId:  rule.id,
            status:  "OPEN",
            message: `${rule.metricKey} is ${value.toFixed(2)} ${rule.operator} ${rule.threshold} (${rule.severity})`,
          },
        });
        created++;

        // Check once-per-day: was an email sent for this ruleId today?
        const sentToday = await prisma.notification.findFirst({
          where: {
            brandId,
            type:      "THRESHOLD",
            createdAt: { gte: todayStart },
            message:   { contains: rule.metricKey },
          },
        });

        if (!sentToday && allEmails.length > 0) {
          try {
            await sendAlertEmail({
              brandName:  brand?.name ?? brandId,
              metricKey:  rule.metricKey,
              value,
              operator:   rule.operator,
              threshold:  rule.threshold,
              severity:   rule.severity as "WARNING" | "CRITICAL",
              message:    alert.message,
              recipients: allEmails,
            });

            // Record notification sent
            const notification = await prisma.notification.create({
              data: {
                brandId,
                type:    "THRESHOLD",
                message: `${rule.metricKey} threshold breached: ${value.toFixed(2)} ${rule.operator} ${rule.threshold}`,
                status:  "OPEN",
              },
            });

            // Create recipients
            const recipientUsers = await prisma.user.findMany({
              where: { email: { in: allEmails } },
              select: { id: true },
            });

            await prisma.notificationRecipient.createMany({
              data: recipientUsers.map(u => ({
                notificationId: notification.id,
                userId:         u.id,
              })),
              skipDuplicates: true,
            });

            emailsSent++;
          } catch (emailErr) {
            console.error("[alerts/check] Email failed:", emailErr);
          }
        }
      }
    }

    return NextResponse.json({ checked: rules.length, created, emailsSent });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("[alerts/check]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}