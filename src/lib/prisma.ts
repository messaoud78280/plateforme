import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

// DIRECT_URL = connexion directe (5432). DATABASE_URL = pooler (6543) avec ?pgbouncer=true.
// Sur Railway, utiliser DATABASE_URL (pooler) si DIRECT_URL est vide ou invalide.
const rawDirect = (process.env.DIRECT_URL ?? "").trim();
const validDirect =
  rawDirect && (rawDirect.startsWith("postgresql://") || rawDirect.startsWith("postgres://"));
const connectionUrl = validDirect ? rawDirect : (process.env.DATABASE_URL ?? "").trim();
if (!connectionUrl || (!connectionUrl.startsWith("postgresql://") && !connectionUrl.startsWith("postgres://"))) {
  throw new Error("DIRECT_URL ou DATABASE_URL doit être une URL postgresql:// ou postgres:// valide.");
}

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasourceUrl: connectionUrl,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
