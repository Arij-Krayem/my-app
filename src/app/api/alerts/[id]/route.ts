import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth, AuthError } from "@/lib/auth/auth-guard";

type PatchRouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(req: NextRequest, context: PatchRouteContext) {
  try {
    const payload = requireAuth(req);
    const { id: alertId } = await context.params;
    const { status } = await req.json();

    if (!["OPEN", "ACK", "RESOLVED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Verify the alert belongs to a brand the user can access
    const alert = await prisma.alert.findUnique({
      where: { id: alertId },
      select: { brandId: true },
    });

    if (!alert) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }

    if (payload.role !== "AGENCY_ADMIN") {
      const member = await prisma.brandMember.findFirst({
        where: { userId: payload.userId, brandId: alert.brandId },
      });
      if (!member) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const updated = await prisma.alert.update({
      where: { id: alertId },
      data: { status },
    });

    return NextResponse.json({ alert: updated });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
