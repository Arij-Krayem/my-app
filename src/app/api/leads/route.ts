import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const leads = await prisma.user.findMany({
    where: { role: "AGENCY_ADMIN" },
    select: { id: true, email: true, name: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ leads });
}