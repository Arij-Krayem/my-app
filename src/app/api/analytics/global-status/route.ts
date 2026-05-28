// ADMIN ONLY — multidimensional: status × severity × brand
import { NextRequest, NextResponse } from "next/server";
import { Prisma }                    from "@prisma/client";
import { requireAuth, AuthError }    from "@/lib/auth/auth-guard";
import { prisma }                    from "@/lib/db/prisma";

type TimeRange = "week" | "month" | "all";

function parseRange(value: string | null): TimeRange {
  return value === "week" || value === "month" || value === "all" ? value : "all";
}

function rangeStartDate(range: TimeRange): Date | null {
  const days = range === "week" ? 7 : range === "month" ? 30 : null;
  if (!days) return null;

  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (payload.role !== "AGENCY_ADMIN")
      return NextResponse.json({ error: "Access denied" }, { status: 403 });

    //Dim 1 × Dim 2 × Dim 3: brand × status × severity
    const range = parseRange(req.nextUrl.searchParams.get("range"));
    const rangeStart = rangeStartDate(range);
    const alertDateFilter = range === "week"
      ? Prisma.sql`a."createdAt" >= NOW() - INTERVAL '7 days'`
      : range === "month"
        ? Prisma.sql`a."createdAt" >= NOW() - INTERVAL '30 days'`
        : Prisma.sql`TRUE`;

    const rows = await prisma.$queryRaw<{
      brand_name: string;
      status:     string;
      severity:   string | null;
      count:      string;
    }[]>`
      SELECT
        b.name                                    AS brand_name,
        a.status,
        ar.severity,
        COUNT(*)::text                            AS count
      FROM "Alert" a
      JOIN "Brand" b  ON b.id = a."brandId"
      LEFT JOIN "AlertRule" ar ON ar.id = a."ruleId"
      WHERE ${alertDateFilter}
      GROUP BY b.name, a.status, ar.severity
      ORDER BY b.name, a.status
    `;

    // Global totals (for donut)
    const totals: Record<string, number> = {};
    for (const r of rows) {
      totals[r.status] = (totals[r.status] ?? 0) + Number(r.count);
    }

    // Per-brand pivot: { brandName, open, resolved, unresolved, critical, warning }
    const brandMap: Record<string, {
      brand: string;
      open: number; resolved: number; unresolved: number;
      critical: number; warning: number; total: number;
    }> = {};

    for (const r of rows) {
      if (!brandMap[r.brand_name]) {
        brandMap[r.brand_name] = {
          brand: r.brand_name,
          open: 0, resolved: 0, unresolved: 0,
          critical: 0, warning: 0, total: 0,
        };
      }
      const n = Number(r.count);
      const b = brandMap[r.brand_name];
      b.total += n;
      if (r.status === "OPEN")      b.open      += n;
      if (r.status === "RESOLVED")  b.resolved  += n;
      if (r.status === "ACK")       b.unresolved += n;
      if (r.severity === "CRITICAL") b.critical  += n;
      if (r.severity === "WARNING")  b.warning   += n;
    }

    const [brandCount, userCount, uploadCount] = await Promise.all([
      prisma.brand.count(),
      prisma.user.count(),
      prisma.upload.count({
        where: rangeStart ? { createdAt: { gte: rangeStart } } : undefined,
      }),
    ]);

    return NextResponse.json({
      // Dim 1 (status) totals — for the summary donut
      totals: {
        resolved:   totals["RESOLVED"] ?? 0,
        open:       totals["OPEN"]     ?? 0,
        unresolved: totals["ACK"]      ?? 0,
        total:      Object.values(totals).reduce((a, b) => a + b, 0),
      },
      // Dim 1 × Dim 2 × Dim 3 — for the grouped bar chart
      byBrand: Object.values(brandMap),
      meta: { brands: brandCount, users: userCount, uploads: uploadCount },
    });

  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("[GET /api/analytics/global-status]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
