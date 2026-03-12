import { prisma } from "@/lib/prisma";
import { getBearer, verifyAccessToken } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

async function assertBrandAccess(userId: string, brandId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  // AGENCY_ADMIN can upload to any brand
  if (user?.role === "AGENCY_ADMIN") return true;

  const member = await prisma.brandMember.findUnique({
    where: { userId_brandId: { userId, brandId } },
  });
  return !!member;
}

const PLATFORM_MAP: Record<string, "GOOGLE" | "META" | "CSV"> = {
  "Google Ads":  "GOOGLE",
  "Meta Ads":    "META",
  "GOOGLE_ADS":  "GOOGLE",
  "META_ADS":    "META",
  "GOOGLE":      "GOOGLE",
  "META":        "META",
  "CSV":         "CSV",
};

export async function POST(req: NextRequest) {
  const token = getBearer(req);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const auth = verifyAccessToken(token);

  // Accept BOTH FormData and JSON
  const contentType = req.headers.get("content-type") ?? "";
  let brandId: string;
  let platformRaw: string;
  let fileName: string;

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    brandId     = (form.get("brandId")  as string) ?? "";
    platformRaw = (form.get("platform") as string) ?? "";
    const file  = form.get("file") as File | null;
    fileName    = file?.name ?? "upload.csv";
  } else {
    const body  = await req.json();
    brandId     = body.brandId     ?? "";
    platformRaw = body.platform    ?? "";
    fileName    = body.fileName    ?? "upload.csv";
  }

  if (!brandId)     return NextResponse.json({ error: "brandId is required" },  { status: 400 });
  if (!platformRaw) return NextResponse.json({ error: "platform is required" }, { status: 400 });

  const platform = PLATFORM_MAP[platformRaw];
  if (!platform) return NextResponse.json({ error: `Unknown platform: ${platformRaw}` }, { status: 400 });

  const allowed = await assertBrandAccess(auth.userId, brandId);
  if (!allowed) return NextResponse.json({ error: "Forbidden — you don't have access to this brand" }, { status: 403 });

  const upload = await prisma.upload.create({
    data: {
      brandId,
      userId:   auth.userId,
      platform,
      fileName,
    },
    select: { id: true, status: true, brandId: true, platform: true, createdAt: true },
  });

  // Return flat object so frontend can do data.id directly
  return NextResponse.json(upload);
}

export async function GET(req: NextRequest) {
  const token = getBearer(req);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const auth = verifyAccessToken(token);
  const { searchParams } = new URL(req.url);
  const brandId = searchParams.get("brandId");

  const uploads = await prisma.upload.findMany({
    where: {
      userId: auth.userId,
      ...(brandId ? { brandId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true, fileName: true, platform: true, status: true, brandId: true, createdAt: true },
  });

  return NextResponse.json(uploads);
}