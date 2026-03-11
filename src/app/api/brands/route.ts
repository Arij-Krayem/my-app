import { prisma } from "@/lib/prisma";
import { requireAuth, AuthError } from "@/lib/auth-guard";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const Body = z.object({
  name: z.string().min(1),
});

export async function GET(req: NextRequest) {
  try {
    requireAuth(req);

    const brands = await prisma.brand.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, createdAt: true },
    });

    return NextResponse.json({ items: brands, totalItems: brands.length });
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

    const brand = await prisma.brand.create({
      data: {
        name: data.name,
        members: {
          create: { userId: payload.userId },
        },
        accuracy: {
          create: { sensitivity: 0.7, threshold: 0.8 },
        },
      },
      select: { id: true, name: true },
    });

    return NextResponse.json({ brand });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}