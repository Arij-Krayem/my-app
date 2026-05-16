import { prisma } from "@/lib/db/prisma";
import { getBearer, verifyAccessToken } from "@/lib/auth/auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const Query = z.object({
  brandId: z.string().min(1),
  from: z.string().min(1),
  to: z.string().min(1),
});

export async function GET(req: NextRequest) {
  const token = getBearer(req);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const auth = verifyAccessToken(token);

  const url = new URL(req.url);
  const q = Query.parse({
    brandId: url.searchParams.get("brandId"),
    from: url.searchParams.get("from"),
    to: url.searchParams.get("to"),
  });

  const member = await prisma.brandMember.findUnique({
    where: { userId_brandId: { userId: auth.userId, brandId: q.brandId } },
  });
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const from = new Date(q.from);
  const to = new Date(q.to);

  // NOTE: JSONB aggregation is easier with raw SQL for MVP
  const totals = await prisma.$queryRaw<
    { spend: number; clicks: number; impressions: number; conversions: number; value: number }[]
  >`
    SELECT
      COALESCE(SUM((metrics->>'spend')::numeric), 0)     AS spend,
      COALESCE(SUM((metrics->>'clicks')::numeric), 0)    AS clicks,
      COALESCE(SUM((metrics->>'impressions')::numeric), 0) AS impressions,
      COALESCE(SUM((metrics->>'conversions')::numeric), 0) AS conversions,
      COALESCE(SUM((metrics->>'value')::numeric), 0)     AS value
    FROM "PerformanceFact"
    WHERE "brandId" = ${q.brandId}
      AND "date" >= ${from}
      AND "date" <= ${to};
  `;

  const daily = await prisma.$queryRaw<
    { day: string; spend: number }[]
  >`
    SELECT
      to_char(date_trunc('day', "date"), 'YYYY-MM-DD') AS day,
      COALESCE(SUM((metrics->>'spend')::numeric), 0)   AS spend
    FROM "PerformanceFact"
    WHERE "brandId" = ${q.brandId}
      AND "date" >= ${from}
      AND "date" <= ${to}
    GROUP BY 1
    ORDER BY 1 ASC;
  `;

  return NextResponse.json({
    totals: totals[0] ?? { spend: 0, clicks: 0, impressions: 0, conversions: 0, value: 0 },
    dailySpend: daily,
  });
}
