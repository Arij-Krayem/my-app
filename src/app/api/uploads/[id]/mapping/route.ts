import { prisma } from "@/lib/db/prisma";
import { requireAuth, AuthError } from "@/lib/auth/auth-guard";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";

const JsonValue: z.ZodType<Prisma.InputJsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(JsonValue),
    z.record(z.string(), JsonValue),
  ])
);

const Body = z.object({
  mappings: z
    .array(
      z.object({
        sourceColumn: z.string().min(1),
        targetKey: z.string().min(1),
        transformRule: JsonValue.optional(),
      })
    )
    .min(1),
});

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  // Auth (catch thrown 401 errors cleanly)
  let auth: ReturnType<typeof requireAuth>;

  try {
    auth = requireAuth(req);
  } catch (e: unknown) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { id: uploadId } = await ctx.params;

  //  Validate body
  let data: z.infer<typeof Body>;
  try {
    data = Body.parse(await req.json());
  } catch (e: unknown) {
    return NextResponse.json(
      { error: "Invalid body", details: e instanceof ZodError ? e.issues : undefined },
      { status: 400 }
    );
  }

  const upload = await prisma.upload.findUnique({
    where: { id: uploadId },
    select: { id: true, brandId: true },
  });
  if (!upload) return NextResponse.json({ error: "Upload not found" }, { status: 404 });

  const member = await prisma.brandMember.findUnique({
    where: { userId_brandId: { userId: auth.userId, brandId: upload.brandId } },
  });
  if (auth.role !== "AGENCY_ADMIN" && !member) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  //  Upsert mappings + mark upload as MAPPED
  await prisma.$transaction([
    ...data.mappings.map((m) =>
      prisma.columnMapping.upsert({
        where: { uploadId_sourceColumn: { uploadId, sourceColumn: m.sourceColumn } },
        create: {
          uploadId,
          sourceColumn: m.sourceColumn,
          targetKey: m.targetKey,
          transformRule: m.transformRule,
        },
        update: {
          targetKey: m.targetKey,
          transformRule: m.transformRule,
        },
      })
    ),
    prisma.upload.update({ where: { id: uploadId }, data: { status: "MAPPED" } }),
  ]);

  return NextResponse.json({ ok: true });
}
