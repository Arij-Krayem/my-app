import { prisma } from "@/lib/prisma";
import { getAuth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const Body = z.object({
  mappings: z.array(
    z.object({
      sourceColumn: z.string().min(1),
      targetKey: z.string().min(1),
      transformRule: z.any().optional(),
    })
  ).min(1),
});

export async function POST(req: NextRequest, ctx: { params: { id: string } }) {
  const auth = getAuth(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const uploadId = ctx.params.id;
  const data = Body.parse(await req.json());

  const upload = await prisma.upload.findUnique({
    where: { id: uploadId },
    select: { id: true, brandId: true },
  });
  if (!upload) return NextResponse.json({ error: "Upload not found" }, { status: 404 });

  const member = await prisma.brandMember.findUnique({
    where: { userId_brandId: { userId: auth.userId, brandId: upload.brandId } },
  });
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Upsert mappings
  await prisma.$transaction([
    ...data.mappings.map((m) =>
      prisma.columnMapping.upsert({
        where: { uploadId_sourceColumn: { uploadId, sourceColumn: m.sourceColumn } },
        create: { uploadId, sourceColumn: m.sourceColumn, targetKey: m.targetKey, transformRule: m.transformRule },
        update: { targetKey: m.targetKey, transformRule: m.transformRule },
      })
    ),
    prisma.upload.update({ where: { id: uploadId }, data: { status: "MAPPED" } }),
  ]);

  return NextResponse.json({ ok: true });
}
