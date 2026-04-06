import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

declare global {
  var prisma: PrismaClient | undefined;
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

export const prisma =
  global.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

function getDbTarget() {
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) {
    return { loaded: false };
  }

  try {
    const parsed = new URL(rawUrl);
    return {
      loaded: true,
      host: parsed.hostname,
      port: parsed.port || "5432",
      database: parsed.pathname.replace(/^\//, ""),
      user: parsed.username,
    };
  } catch {
    return { loaded: true, invalid: true };
  }
}

if (!(globalThis as { __prismaConnectLogged?: boolean }).__prismaConnectLogged) {
  (globalThis as { __prismaConnectLogged?: boolean }).__prismaConnectLogged = true;
  prisma.$connect()
    .then(() => {
      console.log("[prisma] Database connected successfully", getDbTarget());
    })
    .catch((error) => {
      console.error("[prisma] Database connection failed", getDbTarget(), error);
    });
}
