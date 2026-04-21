import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, AuthError } from "@/lib/auth-guard";
import { z } from "zod";

const UpdateBody = z.object({
  brandId: z.string().min(1).optional(),
  metricKey: z.string().min(1).optional(),
  operator: z.enum([">", "<", ">=", "<=", "=="]).optional(),
  threshold: z.number().optional(),
  severity: z.enum(["WARNING", "CRITICAL"]).optional(),
  isActive: z.boolean().optional(),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function ensureRuleAccess(userId: string, role: string, ruleId: string) {
  const rule = await prisma.alertRule.findUnique({
    where: { id: ruleId },
    select: { id: true, brandId: true },
  });

  if (!rule) {
    return { error: NextResponse.json({ error: "Rule not found" }, { status: 404 }) };
  }

  if (role !== "AGENCY_ADMIN") {
    const member = await prisma.brandMember.findFirst({
      where: { userId, brandId: rule.brandId },
      select: { id: true },
    });

    if (!member) {
      return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
    }
  }

  return { rule };
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const payload = requireAuth(req);
    const { id } = await params;
    const access = await ensureRuleAccess(payload.userId, payload.role, id);

    if ("error" in access) {
      return access.error;
    }

    const data = UpdateBody.parse(await req.json());

    if (data.brandId && data.brandId !== access.rule.brandId && payload.role !== "AGENCY_ADMIN") {
      const member = await prisma.brandMember.findFirst({
        where: { userId: payload.userId, brandId: data.brandId },
        select: { id: true },
      });

      if (!member) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const rule = await prisma.alertRule.update({
      where: { id },
      data,
      include: { brand: { select: { name: true } } },
    });

    return NextResponse.json({ rule });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }

    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid payload", details: err.flatten() }, { status: 400 });
    }

    console.error("[PATCH /api/alerts/rules/[id]]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const payload = requireAuth(req);
    const { id } = await params;
    const access = await ensureRuleAccess(payload.userId, payload.role, id);

    if ("error" in access) {
      return access.error;
    }

    await prisma.alertRule.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }

    console.error("[DELETE /api/alerts/rules/[id]]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
