// src/app/api/uploads/logo/route.ts
// ─── Handles brand logo file uploads ─────────────────────────────────────────
// Saves to: public/uploads/logos/<timestamp>-<originalname>
// Returns:  { url: "/uploads/logos/filename.png" }

import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthError }    from "@/lib/auth/auth-guard";
import { writeFile, mkdir }          from "fs/promises";
import path                          from "path";

const MAX_SIZE   = 2 * 1024 * 1024; // 2 MB
const ALLOWED    = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml", "image/webp"];
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "logos");

export async function POST(req: NextRequest) {
  try {
    requireAuth(req);

    const formData = await req.formData();
    const file     = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // ── Validate type ─────────────────────────────────────────────────────
    if (!ALLOWED.includes(file.type)) {
      return NextResponse.json({
        error: "Invalid file type. Allowed: PNG, JPG, JPEG, SVG, WEBP",
      }, { status: 400 });
    }

    // ── Validate size ─────────────────────────────────────────────────────
    if (file.size > MAX_SIZE) {
      return NextResponse.json({
        error: "File too large. Maximum size is 2 MB",
      }, { status: 400 });
    }

    // ── Build safe filename ───────────────────────────────────────────────
    const ext      = file.name.split(".").pop()?.toLowerCase() ?? "png";
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const filePath = path.join(UPLOAD_DIR, safeName);

    // ── Ensure directory exists ───────────────────────────────────────────
    await mkdir(UPLOAD_DIR, { recursive: true });

    // ── Write file ────────────────────────────────────────────────────────
    const bytes  = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    const url = `/uploads/logos/${safeName}`;
    return NextResponse.json({ url }, { status: 201 });

  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("[POST /api/uploads/logo]", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}