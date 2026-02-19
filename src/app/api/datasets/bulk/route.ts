import { prisma } from "@/lib/prisma";
import { getAuth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const Row = z.object({
  date: z.string().min(1),
  platform: z.enum(["GOOGLE", "META", "CSV"]),
  entityType: z.enum(["CAMPAIGN", "ADSET", "AD", "ACCOUNT"]),
  entityId: z.string().min(1),
  dimensions: z.record(z.string(), z.any()).optional(),
  metrics: z.record(z.string(), z.any()).optional(),
});


const Body = z.object({
  uploadId: z.string().min(1),
  rows: z.array(Row).min(1).max(5000), // protect server
});

export async function POST(req: NextRequest) {
  const auth = getAuth(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = Body.parse(await req.json());

  const upload = await prisma.upload.findUnique({
    where: { id: data.uploadId },
    select: { id: true, brandId: true },
  });
  if (!upload) return NextResponse.json({ error: "Upload not found" }, { status: 404 });

  const member = await prisma.brandMember.findUnique({
    where: { userId_brandId: { userId: auth.userId, brandId: upload.brandId } },
  });
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.performanceFact.createMany({
    data: data.rows.map((r) => ({
      brandId: upload.brandId,
      uploadId: upload.id,
      platform: r.platform,
      date: new Date(r.date),
      entityType: r.entityType,
      entityId: r.entityId,
      dimensions: r.dimensions ?? {},
      metrics: r.metrics ?? {},
    })),
  });

  await prisma.upload.update({ where: { id: upload.id }, data: { status: "IMPORTED" } });

  return NextResponse.json({ inserted: data.rows.length });
}
