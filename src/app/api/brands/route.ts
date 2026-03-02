import { prisma } from "@/lib/prisma";
import { getBearer, verifyAccessToken } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const Body = z.object({
  name: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const token = getBearer(req);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const auth = verifyAccessToken(token);

  const data = Body.parse(await req.json());

  const brand = await prisma.brand.create({
    data: {
      name: data.name,
      members: {
        create: { userId: auth.userId }, // creator is member
      },
      accuracy: {
        create: { sensitivity: 0.7, threshold: 0.8 },
      },
    },
    select: { id: true, name: true },
  });

  return NextResponse.json({ brand });
}
