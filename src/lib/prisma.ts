import "dotenv/config";

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

export const prisma =
  global.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") global.prisma = prisma;

function getDbTarget() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    return { configured: false };
  }

  try {
    const parsed = new URL(connectionString);
    return {
      configured: true,
      host: parsed.hostname,
      port: parsed.port || "5432",
      database: parsed.pathname.replace(/^\//, ""),
      user: decodeURIComponent(parsed.username),
    };
  } catch {
    return { configured: true, parseError: true };
  }
}

const prismaBootstrap = globalThis as typeof globalThis & {
  __prismaConnectPromise?: Promise<void>;
};

if (!prismaBootstrap.__prismaConnectPromise) {
  prismaBootstrap.__prismaConnectPromise = prisma
    .$connect()
    .then(() => {
      console.log("[prisma] Database connected successfully", getDbTarget());
    })
    .catch((error) => {
      console.error("[prisma] Database connection failed", getDbTarget(), error);
      throw error;
    });
}
