import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, AuthError } from "@/lib/auth-guard";
import { parse } from "csv-parse/sync";
import { EntityType, Prisma } from "@prisma/client";
import { sendAlertEmail } from "@/lib/notification-mailer";

function cleanNumber(val: string): number {
  if (!val) return 0;
  return parseFloat(val.replace(/[$,%\s]/g, "")) || 0;
}

function cleanDate(val: string): Date | null {
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

function parseEntityType(value: string | undefined): EntityType | null {
  if (!value) return null;
  const normalized = value.trim().toUpperCase();
  if (
    normalized === "CAMPAIGN" ||
    normalized === "ADSET" ||
    normalized === "AD" ||
    normalized === "ACCOUNT"
  ) {
    return normalized;
  }
  return null;
}

function inferEntityType(mapped: Record<string, string>): EntityType {
  const explicit = parseEntityType(mapped["entity_type"]);
  if (explicit) return explicit;
  if (mapped["ad_id"] || mapped["ad_name"]) return "AD";
  if (mapped["adset_id"] || mapped["adset_name"]) return "ADSET";
  if (mapped["campaign_id"] || mapped["campaign_name"]) return "CAMPAIGN";
  return "ACCOUNT";
}

function inferEntityId(mapped: Record<string, string>): string | null {
  const candidates = [
    "entity_id",
    "ad_id",
    "adset_id",
    "campaign_id",
    "account_id",
    "ad_name",
    "adset_name",
    "campaign_name",
    "account_name",
  ];
  for (const key of candidates) {
    const value = mapped[key]?.trim();
    if (value) return value;
  }
  return null;
}

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

async function runAlertCheck(brandId: string) {
  try {
    // Get active rules
    const rules = await prisma.alertRule.findMany({
      where: { brandId, isActive: true },
    });
    if (rules.length === 0) return;

    // Get brand name
    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
      select: { name: true },
    });

    // Get last 30 days of facts
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const facts = await prisma.performanceFact.findMany({
      where: { brandId, date: { gte: since } },
    });
    if (facts.length === 0) return;

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

    // Get recipients
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

    for (const rule of rules) {
      const value = aggregated[rule.metricKey];
      if (value === undefined) continue;

      if (evaluate(value, rule.operator, rule.threshold)) {
        // Skip if OPEN alert already exists
        const existing = await prisma.alert.findFirst({
          where: { ruleId: rule.id, status: "OPEN" },
        });
        if (existing) continue;

        // Create alert
        const alert = await prisma.alert.create({
          data: {
            brandId,
            ruleId:  rule.id,
            status:  "OPEN",
            message: `${rule.metricKey} is ${value.toFixed(2)} ${rule.operator} ${rule.threshold} (${rule.severity}) — triggered on CSV ingest`,
          },
        });

        // Once-per-day email dedup
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

            const notification = await prisma.notification.create({
              data: {
                brandId,
                type:    "THRESHOLD",
                message: `${rule.metricKey} threshold breached: ${value.toFixed(2)} ${rule.operator} ${rule.threshold}`,
                status:  "OPEN",
              },
            });

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
          } catch (emailErr) {
            console.error("[ingest/alert-check] Email failed:", emailErr);
          }
        }
      }
    }
  } catch (err) {
    console.error("[ingest/alert-check] Failed:", err);
  }
}

// ─── POST /api/uploads/[id]/ingest ───────────────────────────────────────────
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload          = requireAuth(req);
    const { id: uploadId } = await params;

    // Load upload with mappings
    const upload = await prisma.upload.findUnique({
      where:   { id: uploadId },
      include: { mappings: true },
    });

    if (!upload)
      return NextResponse.json({ error: "Upload not found" }, { status: 404 });

    // Auth check
    if (payload.role !== "AGENCY_ADMIN" && upload.userId !== payload.userId)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Must be MAPPED before ingesting
    if (upload.status === "IMPORTED")
      return NextResponse.json({ error: "This upload has already been ingested" }, { status: 400 });

    if (upload.status === "PENDING")
      return NextResponse.json({ error: "Please confirm column mappings before ingesting" }, { status: 400 });

    if (!upload.rawCsv)
      return NextResponse.json({ error: "No CSV data found for this upload" }, { status: 400 });

    if (upload.mappings.length === 0)
      return NextResponse.json({ error: "No column mappings found — please map columns first" }, { status: 400 });

    // Parse raw CSV
    const records: Record<string, string>[] = parse(upload.rawCsv, {
      columns:          true,
      skip_empty_lines: true,
      trim:             true,
    });

    if (records.length === 0)
      return NextResponse.json({ error: "CSV has no data rows" }, { status: 400 });

    // Build reverse map: sourceColumn → targetKey
    const colMap: Record<string, string> = {};
    for (const m of upload.mappings) {
      colMap[m.sourceColumn] = m.targetKey;
    }

    // Transform each row into a PerformanceFact
    const facts: Prisma.PerformanceFactCreateManyInput[] = [];
    const errors: string[] = [];

    for (let i = 0; i < records.length; i++) {
      const row = records[i];

      // Remap row keys using column mappings
      const mapped: Record<string, string> = {};
      for (const [sourceCol, val] of Object.entries(row)) {
        const targetKey = colMap[sourceCol];
        if (targetKey) mapped[targetKey] = val;
      }

      // Parse date — required field
      const rawDate = mapped["date"];
      const date    = rawDate ? cleanDate(rawDate) : null;
      if (!date) {
        errors.push(`Row ${i + 2}: invalid or missing date "${rawDate}" — skipped`);
        continue;
      }

      const entityType = inferEntityType(mapped);
      const entityId   = inferEntityId(mapped);
      if (!entityId) {
        errors.push(`Row ${i + 2}: missing entity identifier - skipped`);
        continue;
      }

      const metrics = {
        impressions:     cleanNumber(mapped["impressions"]      ?? ""),
        clicks:          cleanNumber(mapped["clicks"]           ?? ""),
        spend:           cleanNumber(mapped["spend"]            ?? ""),
        conversions:     cleanNumber(mapped["conversions"]      ?? ""),
        conversionValue: cleanNumber(mapped["conversion_value"] ?? ""),
        ctr:             cleanNumber(mapped["ctr"]              ?? ""),
        cpc:             cleanNumber(mapped["cpc"]              ?? ""),
        roas:            cleanNumber(mapped["roas"]             ?? ""),
      };

      const dimensions = Object.fromEntries(
        Object.entries(mapped).filter(([key, value]) => {
          if (!value) return false;
          return ![
            "date", "entity_type", "entity_id",
            "ad_id", "adset_id", "campaign_id", "account_id",
            "impressions", "clicks", "spend", "conversions",
            "conversion_value", "ctr", "cpc", "roas",
          ].includes(key);
        })
      );

      facts.push({
        uploadId: upload.id,
        brandId:  upload.brandId,
        platform: upload.platform,
        date,
        entityType,
        entityId,
        dimensions,
        metrics,
      });
    }

    if (facts.length === 0)
      return NextResponse.json({ error: "No valid rows to ingest", errors }, { status: 400 });

    // Delete any existing facts for this upload (re-ingest safety)
    await prisma.performanceFact.deleteMany({ where: { uploadId } });

    // Batch insert facts
    await prisma.performanceFact.createMany({ data: facts });

    // Mark upload as IMPORTED
    await prisma.upload.update({
      where: { id: uploadId },
      data:  { status: "IMPORTED" },
    });

    // ✅ Auto-trigger alert check after successful ingest (non-blocking)
    runAlertCheck(upload.brandId).catch(err =>
      console.error("[ingest] Alert check failed silently:", err)
    );

    return NextResponse.json({
      message:   "CSV ingested successfully",
      uploadId,
      totalRows: records.length,
      ingested:  facts.length,
      skipped:   records.length - facts.length,
      errors:    errors.length > 0 ? errors : undefined,
    });

  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("[POST /api/uploads/ingest]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}