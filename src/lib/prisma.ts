import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

// Prisma Client (requêtes runtime) : DATABASE_URL (pooler Supabase 6543 recommandé avec ?pgbouncer=true).
// DIRECT_URL sert surtout aux migrations / db push via `schema.prisma` `directUrl`.
function getConnectionUrl(): string {
  const pool = (process.env.DATABASE_URL ?? "").trim();
  const direct = (process.env.DIRECT_URL ?? "").trim();
  const isPg = (u: string) =>
    u.startsWith("postgresql://") || u.startsWith("postgres://");

  if (pool && isPg(pool)) return pool;
  if (direct && isPg(direct)) return direct;
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
