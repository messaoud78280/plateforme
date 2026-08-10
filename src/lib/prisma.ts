import { PrismaClient } from "@prisma/client";
import { isPerfLogEnabled, recordPerfQuery } from "@/lib/perf/server-timing";

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

if (!connectionUrl && process.env.NODE_ENV === "production") {
  console.error(
    "[Prisma] DATABASE_URL (ou DIRECT_URL) manquant. Vérifiez les variables d'environnement Railway.",
  );
}

const enablePerfQuery = isPerfLogEnabled();

const baseClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: connectionUrl || "postgresql://localhost:5432/placeholder",
    log: ["error"],
  });

/**
 * PERF_DEBUG : extension dans le même AsyncLocalStorage que l’appelant
 * ($on('query') sortait du contexte ALS → compteur à 0).
 */
function withPerfExtension(client: PrismaClient): PrismaClient {
  if (!enablePerfQuery) return client;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const extended = (client as any).$extends({
    query: {
      $allModels: {
        async $allOperations({
          model,
          operation,
          args,
          query,
        }: {
          model?: string;
          operation: string;
          args: unknown;
          query: (args: unknown) => Promise<unknown>;
        }) {
          const t0 = Date.now();
          try {
            return await query(args);
          } finally {
            const ms = Date.now() - t0;
            recordPerfQuery({
              model: model ?? "sql",
              action: operation,
              ms,
            });
            if (ms >= 40) {
              console.info(`[perf] prisma.${model ?? "sql"}.${operation} ${ms}ms`);
            }
          }
        },
      },
    },
  });
  return extended as PrismaClient;
}

export const prisma: PrismaClient = withPerfExtension(baseClient);

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = baseClient;
