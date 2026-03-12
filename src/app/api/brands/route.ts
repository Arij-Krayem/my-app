import { prisma } from "@/lib/prisma";
import { getBearer, verifyAccessToken } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const Body = z.object({
  name: z.string().min(1),
});

// ── GET /api/brands — returns brands the current user has access to ──
export async function GET(req: NextRequest) {
  const token = getBearer(req);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const auth = verifyAccessToken(token);

  // AGENCY_ADMIN sees all brands, MARKETER sees only their assigned brands
  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { role: true },
  });

  let brands;
  if (user?.role === "AGENCY_ADMIN") {
    brands = await prisma.brand.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  } else {
    brands = await prisma.brandMember.findMany({
      where: { userId: auth.userId },
      select: { brand: { select: { id: true, name: true } } },
    }).then(members => members.map(m => m.brand));
  }

  return NextResponse.json(brands);
}

// ── POST /api/brands — create a new brand ──
export async function POST(req: NextRequest) {
  const token = getBearer(req);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const auth = verifyAccessToken(token);
  const data = Body.parse(await req.json());

  const brand = await prisma.brand.create({
    data: {
      name: data.name,
      members: {
        create: { userId: auth.userId },
      },
      accuracy: {
        create: { sensitivity: 0.7, threshold: 0.8 },
      },
    },
    select: { id: true, name: true },
  });

  return NextResponse.json({ brand });
}