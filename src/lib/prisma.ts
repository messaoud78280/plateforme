import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

// DIRECT_URL = connexion directe (5432). DATABASE_URL = pooler (6543) avec ?pgbouncer=true.
// Sur Railway, utiliser DATABASE_URL (pooler) si DIRECT_URL est vide ou invalide.
function getConnectionUrl(): string {
  const rawDirect = (process.env.DIRECT_URL ?? "").trim();
  const validDirect =
    rawDirect && (rawDirect.startsWith("postgresql://") || rawDirect.startsWith("postgres://"));
  const url = validDirect ? rawDirect : (process.env.DATABASE_URL ?? "").trim();
  if (url && (url.startsWith("postgresql://") || url.startsWith("postgres://"))) return url;
  return "";
}

const connectionUrl = getConnectionUrl();

// En production, ne pas faire planter l'app au chargement si DATABASE_URL manque
// (évite "Application error" au premier rendu). La première requête DB échouera proprement.
if (!connectionUrl && process.env.NODE_ENV === "production") {
  console.error(
    "[Prisma] DATABASE_URL (ou DIRECT_URL) manquant. Vérifiez les variables d'environnement Railway."
  );
}

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: connectionUrl || "postgresql://localhost:5432/placeholder",
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
