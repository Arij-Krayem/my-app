import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, AuthError } from "@/lib/auth-guard";
import { z } from "zod";

// ─── Validation schema with custom messages ───────────────────────────────────
const CreateBody = z.object({
  name: z
    .string()
    .min(1, "Please provide a name for this lead"),

  email: z
    .string()
    .min(1, "Email address is required")
    .email("Please enter a valid email address (e.g. jane@example.com)"),

  phone:  z.string().optional(),
  status: z.enum(["NEW", "CONTACTED", "QUALIFIED", "LOST"]).default("NEW"),
  source: z.string().optional(),
  notes:  z.string().optional(),
});

function formatZodErrors(err: z.ZodError) {
  const fields: Record<string, string> = {};
  for (const issue of err.issues) {
    const field = issue.path.join(".") || "body";
    fields[field] = issue.message;
  }
  return fields;
}

// ─── GET /api/leads — flat pagination like { totalItems, totalPages, ... } ────
export async function GET(req: NextRequest) {
  try {
    requireAuth(req);

    const { searchParams } = new URL(req.url);

    const currentPage  = Math.max(1, Number(searchParams.get("page")     ?? "1"));
    const itemsPerPage = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") ?? "10")));
    const q            = searchParams.get("q")      ?? "";
    const status       = searchParams.get("status") ?? "";
    const sortBy       = searchParams.get("sortBy") ?? "createdAt";
    const orderBy      = (searchParams.get("orderBy") ?? "desc") === "asc" ? "asc" : "desc";

    const where: Record<string, unknown> = {};

    if (q) {
      where.OR = [
        { name:  { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ];
    }

    if (status && ["NEW", "CONTACTED", "QUALIFIED", "LOST"].includes(status)) {
      where.status = status;
    }

    const validSortFields = ["createdAt", "name", "email", "status"];
    const safeSortBy = validSortFields.includes(sortBy) ? sortBy : "createdAt";

    const [items, totalItems] = await Promise.all([
      prisma.lead.findMany({
        where,
        orderBy: { [safeSortBy]: orderBy },
        skip: (currentPage - 1) * itemsPerPage,
        take: itemsPerPage,
      }),
      prisma.lead.count({ where }),
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

// ─── POST /api/leads — custom validation error messages ───────────────────────
export async function POST(req: NextRequest) {
  try {
    requireAuth(req);

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const result = CreateBody.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error:  "Validation failed",
          fields: formatZodErrors(result.error),
          example: {
            name:   "Jane Doe",
            email:  "jane@example.com",
            phone:  "+1 555 000 111",
            status: "NEW",
            source: "Google Ads",
            notes:  "Interested in premium plan",
          },
        },
        { status: 400 }
      );
    }

    const lead = await prisma.lead.create({ data: result.data });
    return NextResponse.json({ lead }, { status: 201 });

  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}