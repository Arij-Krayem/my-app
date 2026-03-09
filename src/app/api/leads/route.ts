import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, AuthError } from "@/lib/auth-guard";
import { z } from "zod";

const CreateBody = z.object({
  name:   z.string().min(1),
  email:  z.string().email(),
  phone:  z.string().optional(),
  status: z.enum(["NEW", "CONTACTED", "QUALIFIED", "LOST"]).default("NEW"),
  source: z.string().optional(),
  notes:  z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    requireAuth(req);

    const { searchParams } = new URL(req.url);
    const page     = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const pageSize = Math.max(1, Number(searchParams.get("pageSize") ?? "10"));
    const q        = searchParams.get("q") ?? "";

    const where = q
      ? {
          OR: [
            { name:  { contains: q, mode: "insensitive" as const } },
            { email: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip:  (page - 1) * pageSize,
        take:  pageSize,
      }),
      prisma.lead.count({ where }),
    ]);

    return NextResponse.json({ leads, total, page, pageSize });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    requireAuth(req);

    const data = CreateBody.parse(await req.json());
    const lead = await prisma.lead.create({ data });

    return NextResponse.json({ lead }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    if (err instanceof z.ZodError)
      return NextResponse.json({ error: err.errors }, { status: 400 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}