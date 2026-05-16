import { NextResponse } from "next/server";

export function errorResponse(err: unknown) {
  const msg = err instanceof Error ? err.message : "UNKNOWN";

  if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (msg.startsWith("FORBIDDEN")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json({ error: "Server error" }, { status: 500 });
}