// src/app/api/users/[id]/approve/route.ts
// ─── ADMIN ONLY: approve a user account + send approval email ─────────────────
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthError }    from "@/lib/auth-guard";
import { prisma }                    from "@/lib/prisma";
import { sendApprovalEmail }         from "@/lib/notification-mailer";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload    = requireAuth(req);
    const { id }     = await params;

    // Admin only
    if (payload.role !== "AGENCY_ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Approve + activate
    const updated = await prisma.user.update({
      where: { id },
      data:  { isApproved: true, isActive: true },
      select: { id: true, email: true, name: true, isApproved: true, isActive: true },
    });

    // Send approval email via Nodemailer
    try {
      await sendApprovalEmail({
        recipientEmail: user.email,
        recipientName:  user.name ?? user.email,
        loginUrl:       `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/login`,
      });
    } catch (emailErr) {
      // Don't fail the request if email fails — account is still approved
      console.error("[approve] Email send failed (non-critical):", emailErr);
    }

    return NextResponse.json({ user: updated, message: "User approved and notified" });

  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("[POST /api/users/[id]/approve]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}