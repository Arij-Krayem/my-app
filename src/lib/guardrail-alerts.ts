import { prisma } from "@/lib/prisma";
import { sendAlertEmail } from "@/lib/notification-mailer";

type EvaluationResult = {
  checked: number;
  created: number;
  emailsSent: number;
  message?: string;
};

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

export async function evaluateGuardrailRulesForBrand(
  brandId: string,
  ruleIds?: string[],
): Promise<EvaluationResult> {
  const rules = await prisma.alertRule.findMany({
    where: {
      brandId,
      isActive: true,
      ...(ruleIds?.length ? { id: { in: ruleIds } } : {}),
    },
  });

  if (rules.length === 0) return { checked: 0, created: 0, emailsSent: 0 };

  const brand = await prisma.brand.findUnique({
    where: { id: brandId },
    select: { name: true },
  });

  const facts = await prisma.performanceFact.findMany({
    where: { brandId },
  });

  if (facts.length === 0) {
    return { checked: rules.length, created: 0, emailsSent: 0, message: "No data" };
  }

  const totals: Record<string, number[]> = {};
  for (const fact of facts) {
    const metrics = fact.metrics as Record<string, unknown>;
    for (const [key, val] of Object.entries(metrics)) {
      if (typeof val === "number" && Number.isFinite(val)) {
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

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  let created = 0;
  let emailsSent = 0;

  for (const rule of rules) {
    const value = aggregated[rule.metricKey];
    if (value === undefined || !evaluate(value, rule.operator, rule.threshold)) continue;

    const existing = await prisma.alert.findFirst({
      where: { ruleId: rule.id, status: "OPEN" },
    });
    if (existing) continue;

    const alert = await prisma.alert.create({
      data: {
        brandId,
        ruleId: rule.id,
        status: "OPEN",
        message: `${rule.metricKey} is ${value.toFixed(2)} ${rule.operator} ${rule.threshold} (${rule.severity})`,
      },
    });
    created++;

    const sentToday = await prisma.notification.findFirst({
      where: {
        brandId,
        type: "THRESHOLD",
        createdAt: { gte: todayStart },
        message: { contains: rule.metricKey },
      },
    });

    if (sentToday || allEmails.length === 0) continue;

    try {
      await sendAlertEmail({
        brandName: brand?.name ?? brandId,
        metricKey: rule.metricKey,
        value,
        operator: rule.operator,
        threshold: rule.threshold,
        severity: rule.severity as "WARNING" | "CRITICAL",
        message: alert.message,
        recipients: allEmails,
      });

      const notification = await prisma.notification.create({
        data: {
          brandId,
          type: "THRESHOLD",
          message: `${rule.metricKey} threshold breached: ${value.toFixed(2)} ${rule.operator} ${rule.threshold}`,
          status: "OPEN",
        },
      });

      const recipientUsers = await prisma.user.findMany({
        where: { email: { in: allEmails } },
        select: { id: true },
      });

      await prisma.notificationRecipient.createMany({
        data: recipientUsers.map(u => ({
          notificationId: notification.id,
          userId: u.id,
        })),
        skipDuplicates: true,
      });

      emailsSent++;
    } catch (emailErr) {
      console.error("[guardrail-alerts] Email failed:", emailErr);
    }
  }

  return { checked: rules.length, created, emailsSent };
}
