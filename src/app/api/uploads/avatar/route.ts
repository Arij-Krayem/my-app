import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth/auth-guard";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const MAX_SIZE = 2 * 1024 * 1024;
const ALLOWED = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml", "image/webp"];
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "avatars");

export async function POST(req: NextRequest) {
  try {
    requireAuth(req);

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: PNG, JPG, JPEG, SVG, WEBP" },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File too large. Maximum size is 2 MB" }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const filePath = path.join(UPLOAD_DIR, safeName);

    await mkdir(UPLOAD_DIR, { recursive: true });

    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    return NextResponse.json({ url: `/uploads/avatars/${safeName}` }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[POST /api/uploads/avatar]", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
