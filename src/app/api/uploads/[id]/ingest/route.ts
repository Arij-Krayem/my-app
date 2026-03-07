import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, AuthError } from "@/lib/auth-guard";
import { parse } from "csv-parse/sync";
import { EntityType, Prisma } from "@prisma/client";

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

// ─── POST /api/uploads/[id]/ingest ───────────────────────────────────────────
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload    = requireAuth(req);
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
      const entityId = inferEntityId(mapped);
      if (!entityId) {
        errors.push(`Row ${i + 2}: missing entity identifier - skipped`);
        continue;
      }

      const metrics = {
        impressions: cleanNumber(mapped["impressions"] ?? ""),
        clicks: cleanNumber(mapped["clicks"] ?? ""),
        spend: cleanNumber(mapped["spend"] ?? ""),
        conversions: cleanNumber(mapped["conversions"] ?? ""),
        conversionValue: cleanNumber(mapped["conversion_value"] ?? ""),
        ctr: cleanNumber(mapped["ctr"] ?? ""),
        cpc: cleanNumber(mapped["cpc"] ?? ""),
        roas: cleanNumber(mapped["roas"] ?? ""),
      };

      const dimensions = Object.fromEntries(
        Object.entries(mapped).filter(([key, value]) => {
          if (!value) return false;
          return ![
            "date",
            "entity_type",
            "entity_id",
            "ad_id",
            "adset_id",
            "campaign_id",
            "account_id",
            "impressions",
            "clicks",
            "spend",
            "conversions",
            "conversion_value",
            "ctr",
            "cpc",
            "roas",
          ].includes(key);
        })
      );

      facts.push({
        uploadId: upload.id,
        brandId: upload.brandId,
        platform: upload.platform,
        date,
        entityType,
        entityId,
        dimensions,
        metrics,
      });
    }

    if (facts.length === 0)
      return NextResponse.json({
        error:  "No valid rows to ingest",
        errors,
      }, { status: 400 });

    // Delete any existing facts for this upload (re-ingest safety)
    await prisma.performanceFact.deleteMany({ where: { uploadId } });

    // Batch insert facts
    await prisma.performanceFact.createMany({ data: facts });

    // Mark upload as IMPORTED
    await prisma.upload.update({
      where: { id: uploadId },
      data:  { status: "IMPORTED" },
    });

    return NextResponse.json({
      message:      "CSV ingested successfully",
      uploadId,
      totalRows:    records.length,
      ingested:     facts.length,
      skipped:      records.length - facts.length,
      errors:       errors.length > 0 ? errors : undefined,
    });

  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("[POST /api/uploads/ingest]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
