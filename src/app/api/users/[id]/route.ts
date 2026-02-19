import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const UpdateBody = z.object({
  name: z.string().optional(),
  role: z.enum(["MARKETER", "AGENCY_ADMIN"]).optional(),
});

export async function GET(_: NextRequest, ctx: { params: { id: string } }) {
  const user = await prisma.user.findUnique({
    where: { id: ctx.params.id },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ user });
}

export async function PATCH(req: NextRequest, ctx: { params: { id: string } }) {
  const data = UpdateBody.parse(await req.json());
  const user = await prisma.user.update({
    where: { id: ctx.params.id },
    data,
    select: { id: true, email: true, name: true, role: true },
  });
  return NextResponse.json({ user });
}

export async function DELETE(_: NextRequest, ctx: { params: { id: string } }) {
  await prisma.user.delete({ where: { id: ctx.params.id } });
  return NextResponse.json({ ok: true });
}
