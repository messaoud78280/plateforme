import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

// Connexion directe (port 5432) évite les erreurs "prepared statement" avec PgBouncer (port 6543).
// Utilisez DIRECT_URL pour l'app (local + Railway) et DATABASE_URL en secours.
const connectionUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionUrl) {
  throw new Error("DIRECT_URL ou DATABASE_URL est requis (Supabase : préférez DIRECT_URL, port 5432)");
}

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasourceUrl: connectionUrl,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
