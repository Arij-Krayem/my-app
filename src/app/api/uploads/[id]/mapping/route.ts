import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const Body = z.object({
  mappings: z
    .array(
      z.object({
        sourceColumn: z.string().min(1),
        targetKey: z.string().min(1),
        transformRule: z.any().optional(),
      })
    )
    .min(1),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(req: NextRequest, ctx: RouteContext) {
  try {
    const auth = requireAuth(req) as { userId: string; role?: string };
    const { id: uploadId } = await ctx.params;

    let data: z.infer<typeof Body>;
    try {
      data = Body.parse(await req.json());
    } catch (e: any) {
      return NextResponse.json(
        { error: "Invalid body", details: e?.errors ?? undefined },
        { status: 400 }
      );
    }

    const upload = await prisma.upload.findUnique({
      where: { id: uploadId },
      select: { id: true, brandId: true },
    });

    if (!upload) {
      return NextResponse.json({ error: "Upload not found" }, { status: 404 });
    }

    const member = await prisma.brandMember.findUnique({
      where: { userId_brandId: { userId: auth.userId, brandId: upload.brandId } },
    });

    if (auth.role !== "AGENCY_ADMIN" && !member) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.$transaction([
      ...data.mappings.map((mapping) =>
        prisma.columnMapping.upsert({
          where: {
            uploadId_sourceColumn: {
              uploadId,
              sourceColumn: mapping.sourceColumn,
            },
          },
          create: {
            uploadId,
            sourceColumn: mapping.sourceColumn,
            targetKey: mapping.targetKey,
            transformRule: mapping.transformRule,
          },
          update: {
            targetKey: mapping.targetKey,
            transformRule: mapping.transformRule,
          },
        })
      ),
      prisma.upload.update({ where: { id: uploadId }, data: { status: "MAPPED" } }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Unauthorized" },
      { status: e?.status ?? 500 }
    );
  }
}
