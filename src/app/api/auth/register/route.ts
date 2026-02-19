import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const Body = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
  role: z.enum(["MARKETER", "AGENCY_ADMIN"]).optional(),
});

export async function POST(req: Request) {
  const data = Body.parse(await req.json());

  const exists = await prisma.user.findUnique({ where: { email: data.email } });
  if (exists) return NextResponse.json({ error: "Email already used" }, { status: 409 });

  const passwordHash = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      role: data.role ?? "MARKETER",
      passwordHash,
    },
    select: { id: true, email: true, role: true, name: true },
  });

  return NextResponse.json({ user });
}
