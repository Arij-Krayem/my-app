import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, AuthError } from "@/lib/auth-guard";
import { parse } from "csv-parse/sync";

// ─── Known column mappings for Google Ads and Meta Ads ───────────────────────
const GOOGLE_ADS_MAP: Record<string, string> = {
  "campaign":           "campaign_name",
  "campaign name":      "campaign_name",
  "ad group":           "adset_name",
  "ad group name":      "adset_name",
  "cost":               "spend",
  "cost (usd)":         "spend",
  "impressions":        "impressions",
  "clicks":             "clicks",
  "ctr":                "ctr",
  "avg. cpc":           "cpc",
  "conversions":        "conversions",
  "conv. value":        "conversion_value",
  "roas":               "roas",
  "date":               "date",
};

const META_ADS_MAP: Record<string, string> = {
  "campaign name":      "campaign_name",
  "ad set name":        "adset_name",
  "ad name":            "ad_name",
  "amount spent":       "spend",
  "amount spent (usd)": "spend",
  "impressions":        "impressions",
  "link clicks":        "clicks",
  "ctr (link click-through rate)": "ctr",
  "cpc (cost per link click)":     "cpc",
  "purchases":          "conversions",
  "purchase roas (return on ad spend)": "roas",
  "reporting starts":   "date",
  "day":                "date",
};

function detectPlatform(headers: string[]): "GOOGLE" | "META" | null {
  const lower = headers.map(h => h.toLowerCase().trim());
  const googleScore = lower.filter(h => Object.keys(GOOGLE_ADS_MAP).includes(h)).length;
  const metaScore   = lower.filter(h => Object.keys(META_ADS_MAP).includes(h)).length;
  if (googleScore === 0 && metaScore === 0) return null;
  return googleScore >= metaScore ? "GOOGLE" : "META";
}

function inferType(values: string[]): string {
  const sample = values.filter(Boolean).slice(0, 20);
  if (sample.every(v => !isNaN(Number(v.replace(/[$,%]/g, ""))))) return "number";
  if (sample.every(v => !isNaN(Date.parse(v)))) return "date";
  return "string";
}

function cleanNumber(val: string): number {
  return parseFloat(val.replace(/[$,%\s]/g, "")) || 0;
}

// ─── POST /api/uploads ────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);

    const formData = await req.formData();
    const file     = formData.get("file") as File | null;
    const brandId  = formData.get("brandId") as string | null;
    const platform = formData.get("platform") as string | null;

    // Validate inputs
    if (!file)    return NextResponse.json({ error: "No file uploaded" },          { status: 400 });
    if (!brandId) return NextResponse.json({ error: "brandId is required" },       { status: 400 });
    if (!platform || !["GOOGLE", "META", "CSV"].includes(platform)) {
      return NextResponse.json({ error: "platform must be GOOGLE, META, or CSV" }, { status: 400 });
    }
    if (!file.name.endsWith(".csv")) {
      return NextResponse.json({ error: "Only .csv files are accepted" },           { status: 400 });
    }

    // Verify brand exists
    const brand = await prisma.brand.findUnique({ where: { id: brandId } });
    if (!brand) return NextResponse.json({ error: "Brand not found" }, { status: 404 });

    // Parse CSV
    const text    = await file.text();
    let records: Record<string, string>[];
    try {
      records = parse(text, {
        columns:          true,
        skip_empty_lines: true,
        trim:             true,
      });
    } catch {
      return NextResponse.json({ error: "Invalid CSV format — could not parse file" }, { status: 400 });
    }

    if (records.length === 0) {
      return NextResponse.json({ error: "CSV file is empty" }, { status: 400 });
    }

    const headers       = Object.keys(records[0]);
    const detectedPlat  = detectPlatform(headers);
    const finalPlatform = (platform as "GOOGLE" | "META" | "CSV");

    // Build column metadata
    const columnMeta = headers.map(col => {
      const colValues  = records.map(r => r[col] ?? "");
      const inferredType = inferType(colValues);

      // Auto-suggest mapping
      const map     = finalPlatform === "GOOGLE" ? GOOGLE_ADS_MAP : META_ADS_MAP;
      const targetKey = map[col.toLowerCase().trim()] ?? null;

      return { name: col, inferredType, sample: colValues.slice(0, 3), targetKey };
    });

    // Create Upload record — save rawCsv for later ingestion
    const upload = await prisma.upload.create({
      data: {
        brandId,
        userId:   payload.userId,
        platform: finalPlatform,
        fileName: file.name,
        status:   "PENDING",
        rawCsv:   text,
      },
    });

    // Save detected columns
    await prisma.uploadColumn.createMany({
      data: columnMeta.map(col => ({
        uploadId:    upload.id,
        name:        col.name,
        inferredType: col.inferredType,
        sample:      col.sample,
      })),
    });

    // Auto-save suggested mappings
    const suggestedMappings = columnMeta.filter(c => c.targetKey);
    if (suggestedMappings.length > 0) {
      await prisma.columnMapping.createMany({
        data: suggestedMappings.map(col => ({
          uploadId:     upload.id,
          sourceColumn: col.name,
          targetKey:    col.targetKey!,
        })),
        skipDuplicates: true,
      });
    }

    return NextResponse.json({
      upload: {
        id:               upload.id,
        fileName:         upload.fileName,
        platform:         upload.platform,
        status:           upload.status,
        detectedPlatform: detectedPlat,
        totalRows:        records.length,
        totalColumns:     headers.length,
        columns:          columnMeta,
        autoMapped:       suggestedMappings.length,
        needsMapping:     columnMeta.length - suggestedMappings.length,
      },
    }, { status: 201 });

  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("[POST /api/uploads]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── GET /api/uploads ─────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);

    const { searchParams } = new URL(req.url);
    const brandId  = searchParams.get("brandId") ?? "";
    const platform = searchParams.get("platform") ?? "";
    const status   = searchParams.get("status")   ?? "";
    const page     = Math.max(1, Number(searchParams.get("page")     ?? "1"));
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") ?? "10")));

    const where: Record<string, unknown> = {};

    // MARKETER can only see their own uploads
    if (payload.role !== "AGENCY_ADMIN") where.userId = payload.userId;
    if (brandId)  where.brandId  = brandId;
    if (platform && ["GOOGLE", "META", "CSV"].includes(platform)) where.platform = platform;
    if (status   && ["PENDING", "MAPPED", "IMPORTED", "FAILED"].includes(status)) where.status = status;

    const [items, totalItems] = await Promise.all([
      prisma.upload.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip:    (page - 1) * pageSize,
        take:    pageSize,
        include: {
          _count: { select: { columns: true, mappings: true } },
        },
      }),
      prisma.upload.count({ where }),
    ]);

    return NextResponse.json({
      totalItems,
      totalPages:  Math.ceil(totalItems / pageSize),
      currentPage: page,
      itemsPerPage: pageSize,
      items,
    });

  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}