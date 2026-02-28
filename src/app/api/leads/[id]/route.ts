import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, AuthError } from "@/lib/auth-guard";
import { z } from "zod";

const UpdateBody = z.object({
  name:   z.string().min(1).optional(),
  email:  z.string().email().optional(),
  phone:  z.string().optional(),
  status: z.enum(["NEW", "CONTACTED", "QUALIFIED", "LOST"]).optional(),
  source: z.string().optional(),
  notes:  z.string().optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    requireAuth(req);

    const { id } = await params;
    const data = UpdateBody.parse(await req.json());
    const lead = await prisma.lead.update({ where: { id }, data });

    return NextResponse.json({ lead });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    if (err instanceof z.ZodError)
      return NextResponse.json({ error: err.issues }, { status: 400 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    requireAuth(req);

    const { id } = await params;
    await prisma.lead.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}