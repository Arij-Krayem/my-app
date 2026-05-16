import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth, AuthError } from "@/lib/auth/auth-guard";
import { z } from "zod";

const Body = z.object({
  brandId:     z.string().min(1),
  sensitivity: z.number().min(0).max(1),
  threshold:   z.number().min(0).max(1),
});

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    const brandId = req.nextUrl.searchParams.get("brandId");

    if (!brandId)
      return NextResponse.json({ error: "brandId required" }, { status: 400 });

    // Only admins can access detection settings
    if (payload.role !== "AGENCY_ADMIN")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const accuracy = await prisma.accuracy.findUnique({
      where: { brandId },
    });

    if (!accuracy) {
      // Return defaults if not set yet
      return NextResponse.json({ sensitivity: 0.7, threshold: 0.8, brandId });
    }

    return NextResponse.json({
      brandId:     accuracy.brandId,
      sensitivity: accuracy.sensitivity,
      threshold:   accuracy.threshold,
      updatedAt:   accuracy.updatedAt,
    });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);

    if (payload.role !== "AGENCY_ADMIN")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const data = Body.parse(await req.json());

    const accuracy = await prisma.accuracy.upsert({
      where:  { brandId: data.brandId },
      update: { sensitivity: data.sensitivity, threshold: data.threshold },
      create: { brandId: data.brandId, sensitivity: data.sensitivity, threshold: data.threshold },
    });

    return NextResponse.json({
      brandId:     accuracy.brandId,
      sensitivity: accuracy.sensitivity,
      threshold:   accuracy.threshold,
      updatedAt:   accuracy.updatedAt,
    });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}