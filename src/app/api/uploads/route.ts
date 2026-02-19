import { prisma } from "@/lib/prisma";
import { getAuth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const Body = z.object({
  brandId: z.string().min(1),
  platform: z.enum(["GOOGLE", "META", "CSV"]),
  fileName: z.string().min(1),
  columns: z.array(
    z.object({
      name: z.string(),
      inferredType: z.string().optional(),
      sample: z.any().optional(),
    })
  ).optional(),
});

async function assertBrandAccess(userId: string, brandId: string) {
  const member = await prisma.brandMember.findUnique({
    where: { userId_brandId: { userId, brandId } },
  });
  return !!member;
}

export async function POST(req: NextRequest) {
  const auth = getAuth(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = Body.parse(await req.json());

  const allowed = await assertBrandAccess(auth.userId, data.brandId);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const upload = await prisma.upload.create({
    data: {
      brandId: data.brandId,
      userId: auth.userId,
      platform: data.platform,
      fileName: data.fileName,
      columns: data.columns?.length
        ? { create: data.columns.map(c => ({ name: c.name, inferredType: c.inferredType, sample: c.sample })) }
        : undefined,
    },
    select: { id: true, status: true, brandId: true, platform: true, createdAt: true },
  });

  return NextResponse.json({ upload });
}
