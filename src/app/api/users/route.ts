import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const CreateBody = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  role: z.enum(["MARKETER", "AGENCY_ADMIN"]).default("MARKETER"),
  password: z.string().min(6),
});

export async function GET() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  const data = CreateBody.parse(await req.json());
  // you can reuse register logic; keeping minimal here:
  return NextResponse.json({ todo: "Implement with bcrypt like register" }, { status: 501 });
}
