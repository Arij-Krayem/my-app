import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth, AuthError } from "@/lib/auth/auth-guard";

type Params = { params: Promise<{ id: string }> };

// GET /api/uploads/[id] 
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const payload  = requireAuth(req);
    const { id }   = await params;

    const upload = await prisma.upload.findUnique({
      where:   { id },
      include: {
        columns:  true,
        mappings: true,
      },
    });

    if (!upload)
      return NextResponse.json({ error: "Upload not found" }, { status: 404 });

    // MARKETER can only see their own uploads
    if (payload.role !== "AGENCY_ADMIN" && upload.userId !== payload.userId)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Build a mapping summary — show which columns are mapped vs unmapped
    const mappedKeys  = new Set(upload.mappings.map(m => m.sourceColumn));
    const columnsSummary = upload.columns.map(col => ({
      id:           col.id,
      name:         col.name,
      inferredType: col.inferredType,
      sample:       col.sample,
      mappedTo:     upload.mappings.find(m => m.sourceColumn === col.name)?.targetKey ?? null,
      isMapped:     mappedKeys.has(col.name),
    }));

    const mappedCount   = columnsSummary.filter(c => c.isMapped).length;
    const unmappedCount = columnsSummary.length - mappedCount;

    return NextResponse.json({
      upload: {
        id:          upload.id,
        fileName:    upload.fileName,
        platform:    upload.platform,
        status:      upload.status,
        brandId:     upload.brandId,
        createdAt:   upload.createdAt,
        mappingProgress: {
          total:    columnsSummary.length,
          mapped:   mappedCount,
          unmapped: unmappedCount,
          percent:  columnsSummary.length > 0
            ? Math.round((mappedCount / columnsSummary.length) * 100)
            : 0,
        },
        columns: columnsSummary,
      },
    });

  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/uploads/[id] — update column mappings
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const payload = requireAuth(req);
    const { id }  = await params;

    const upload = await prisma.upload.findUnique({ where: { id } });
    if (!upload)
      return NextResponse.json({ error: "Upload not found" }, { status: 404 });

    if (payload.role !== "AGENCY_ADMIN" && upload.userId !== payload.userId)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { mappings } = await req.json() as {
      mappings: { sourceColumn: string; targetKey: string }[]
    };

    if (!Array.isArray(mappings) || mappings.length === 0)
      return NextResponse.json({ error: "mappings array is required" }, { status: 400 });

    // Upsert each mapping
    await Promise.all(
      mappings.map(m =>
        prisma.columnMapping.upsert({
          where:  { uploadId_sourceColumn: { uploadId: id, sourceColumn: m.sourceColumn } },
          update: { targetKey: m.targetKey },
          create: { uploadId: id, sourceColumn: m.sourceColumn, targetKey: m.targetKey },
        })
      )
    );

    // Update upload status to MAPPED
    await prisma.upload.update({
      where: { id },
      data:  { status: "MAPPED" },
    });

    return NextResponse.json({ message: "Mappings saved successfully", status: "MAPPED" });

  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/uploads/[id]
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const payload = requireAuth(req);
    const { id }  = await params;

    const upload = await prisma.upload.findUnique({ where: { id } });
    if (!upload)
      return NextResponse.json({ error: "Upload not found" }, { status: 404 });

    if (payload.role !== "AGENCY_ADMIN" && upload.userId !== payload.userId)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await prisma.upload.delete({ where: { id } });
    return NextResponse.json({ ok: true });

  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}