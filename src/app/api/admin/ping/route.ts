import { NextRequest, NextResponse } from "next/server";
import { AuthError, requireAdmin } from "@/lib/auth-guard";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAdmin(req);

    return NextResponse.json({
      ok: true,
      message: "Welcome admin!",
      userId: payload.userId,
      role: payload.role,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}