import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, AuthError } from "@/lib/auth-guard";
import { evaluateGuardrailRulesForBrand } from "@/lib/guardrail-alerts";
import { z } from "zod";

const Body = z.object({
  brandId:   z.string().min(1),
  metricKey: z.string().min(1),
  operator:  z.enum([">", "<", ">=", "<=", "=="]),
  threshold: z.number(),
  severity:  z.enum(["WARNING", "CRITICAL"]),
});
const UpdateBody = Body.extend({
  id: z.string().min(1),
});

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    const brandId = req.nextUrl.searchParams.get("brandId");

    let brandIds: string[] = [];
    if (payload.role === "AGENCY_ADMIN") {
      const brands = await prisma.brand.findMany({ select: { id: true } });
      brandIds = brands.map(b => b.id);
    } else {
      const memberships = await prisma.brandMember.findMany({
        where: { userId: payload.userId },
        select: { brandId: true },
      });
      brandIds = memberships.map(m => m.brandId);
    }

    const filterBrandIds = brandId && brandIds.includes(brandId) ? [brandId] : brandIds;

    const rules = await prisma.alertRule.findMany({
      where: { brandId: { in: filterBrandIds } },
      orderBy: { createdAt: "desc" },
      include: { brand: { select: { name: true } } },
    });

    return NextResponse.json({ items: rules });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    const data = Body.parse(await req.json());

    // Verify brand access
    if (payload.role !== "AGENCY_ADMIN") {
      const member = await prisma.brandMember.findFirst({
        where: { userId: payload.userId, brandId: data.brandId },
      });
      if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const rule = await prisma.alertRule.create({ data });
    const evaluation = await evaluateGuardrailRulesForBrand(data.brandId, [rule.id]);

    return NextResponse.json({ rule, evaluation }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    const { id, ...data } = UpdateBody.parse(await req.json());

    const existingRule = await prisma.alertRule.findUnique({
      where: { id },
      select: { brandId: true, isActive: true },
    });

    if (!existingRule) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }

    if (payload.role !== "AGENCY_ADMIN") {
      const accessibleBrands = Array.from(new Set([existingRule.brandId, data.brandId]));
      const memberCount = await prisma.brandMember.count({
        where: {
          userId: payload.userId,
          brandId: { in: accessibleBrands },
        },
      });

      if (memberCount !== accessibleBrands.length) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const rule = await prisma.alertRule.update({
      where: { id },
      data,
    });

    const evaluation = rule.isActive
      ? await evaluateGuardrailRulesForBrand(rule.brandId, [rule.id])
      : { checked: 0, created: 0, emailsSent: 0 };

    return NextResponse.json({ rule, evaluation });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    const id = req.nextUrl.searchParams.get("id");

    if (!id) return NextResponse.json({ error: "Rule ID required" }, { status: 400 });

    const rule = await prisma.alertRule.findUnique({
      where: { id },
      select: { brandId: true },
    });

    if (!rule) return NextResponse.json({ error: "Rule not found" }, { status: 404 });

    if (payload.role !== "AGENCY_ADMIN") {
      const member = await prisma.brandMember.findFirst({
        where: { userId: payload.userId, brandId: rule.brandId },
      });
      if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.alertRule.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
