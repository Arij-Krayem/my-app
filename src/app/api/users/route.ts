import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, AuthError } from "@/lib/auth-guard";
import { z } from "zod";

// ─── Validation schema with custom messages ───────────────────────────────────
const CreateUserBody = z.object({
  email: z
    .string()
    .min(1, "Email address is required")
    .email("Please enter a valid email address (e.g. user@example.com)"),

  name: z
    .string()
    .min(1, "Please provide a full name"),

  password: z
    .string()
    .min(6, "Password must be at least 6 characters long"),

  role: z
    .enum(["MARKETER", "AGENCY_ADMIN"])
    .default("MARKETER"),
});

function formatZodErrors(err: z.ZodError) {
  const fields: Record<string, string> = {};
  for (const issue of err.issues) {
    const field = issue.path.join(".") || "body";
    fields[field] = issue.message;
  }
  return fields;
}

// ─── GET /api/users — admin only, flat pagination ────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);

    if (payload.role !== "AGENCY_ADMIN")
      return NextResponse.json({ error: "Forbidden — AGENCY_ADMIN only" }, { status: 403 });

    const { searchParams } = new URL(req.url);

    const currentPage  = Math.max(1, Number(searchParams.get("page")     ?? "1"));
    const itemsPerPage = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") ?? "10")));
    const q            = searchParams.get("q")    ?? "";
    const role         = searchParams.get("role") ?? "";
    const sortBy       = searchParams.get("sortBy")  ?? "createdAt";
    const orderBy      = (searchParams.get("orderBy") ?? "desc") === "asc" ? "asc" : "desc";

    const where: Record<string, unknown> = {};

    if (q) {
      where.OR = [
        { name:  { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ];
    }

    if (role && ["MARKETER", "AGENCY_ADMIN"].includes(role)) {
      where.role = role;
    }

    const validSortFields = ["createdAt", "name", "email", "role"];
    const safeSortBy = validSortFields.includes(sortBy) ? sortBy : "createdAt";

    const [items, totalItems] = await Promise.all([
      prisma.user.findMany({
        where,
        select:  { id: true, email: true, name: true, role: true, createdAt: true },
        orderBy: { [safeSortBy]: orderBy },
        skip: (currentPage - 1) * itemsPerPage,
        take: itemsPerPage,
      }),
      prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(totalItems / itemsPerPage);

    return NextResponse.json({
      totalItems,
      totalPages,
      currentPage,
      itemsPerPage,
      sortBy:  safeSortBy,
      orderBy,
      items,
    });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── POST /api/users — admin only, with custom validation errors ──────────────
export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);

    if (payload.role !== "AGENCY_ADMIN")
      return NextResponse.json({ error: "Forbidden — AGENCY_ADMIN only" }, { status: 403 });

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const result = CreateUserBody.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error:  "Validation failed",
          fields: formatZodErrors(result.error),
          example: {
            email:    "user@example.com",
            name:     "John Doe",
            password: "securePassword123",
            role:     "MARKETER",
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Use POST /api/auth/register to create users" },
      { status: 400 }
    );

  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}