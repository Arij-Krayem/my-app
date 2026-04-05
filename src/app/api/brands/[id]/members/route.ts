import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, AuthError } from "@/lib/auth-guard";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = requireAuth(req);
    const { id: brandId } = await params;

    // Verify access
    if (payload.role !== "AGENCY_ADMIN") {
      const member = await prisma.brandMember.findFirst({
        where: { userId: payload.userId, brandId },
      });
      if (!member)
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const members = await prisma.brandMember.findMany({
      where: { brandId },
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
    });

    return NextResponse.json({ items: members, totalItems: members.length });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}