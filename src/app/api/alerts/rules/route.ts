import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth, AuthError } from "@/lib/auth/auth-guard";
import { evaluateGuardrailRulesForBrand } from "@/lib/guardrails/guardrail-alerts";
import { validateGuardrailRuleInput } from "@/lib/guardrails/guardrail-rule-validation";

function validationResponse(errors: ReturnType<typeof validateGuardrailRuleInput>["errors"]) {
  return NextResponse.json(
    { error: "Invalid guardrail rule", fieldErrors: errors },
    { status: 400 },
  );
}

async function readJson(req: NextRequest) {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

async function canAccessBrand(userId: string, brandId: string, role: string) {
  if (role === "AGENCY_ADMIN") {
    const brand = await prisma.brand.findUnique({ where: { id: brandId }, select: { id: true } });
    return Boolean(brand);
  }

  const member = await prisma.brandMember.findFirst({
    where: { userId, brandId },
    select: { id: true },
  });
  return Boolean(member);
}

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
    const body = await readJson(req);
    if (!body) return validationResponse({ threshold: "Enter valid rule details." });

    const validation = validateGuardrailRuleInput(body);
    if (!validation.data) return validationResponse(validation.errors);
    const data = validation.data;

    if (!(await canAccessBrand(payload.userId, data.brandId, payload.role))) {
      if (payload.role === "AGENCY_ADMIN") {
        return validationResponse({ brandId: "Select a valid brand." });
      }
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
    const body = await readJson(req);
    if (!body) return validationResponse({ threshold: "Enter valid rule details." });

    const id = typeof body?.id === "string" ? body.id.trim() : "";
    if (!id) return validationResponse({ brandId: "Rule ID is required." });

    const validation = validateGuardrailRuleInput(body);
    if (!validation.data) return validationResponse(validation.errors);
    const data = validation.data;

    const existingRule = await prisma.alertRule.findUnique({
      where: { id },
      select: { brandId: true, isActive: true },
    });

    if (!existingRule) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }

    if (!(await canAccessBrand(payload.userId, data.brandId, payload.role))) {
      if (payload.role === "AGENCY_ADMIN") {
        return validationResponse({ brandId: "Select a valid brand." });
      }
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
