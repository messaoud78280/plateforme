import { PrismaClient } from "@prisma/client";
import { isPerfLogEnabled, recordPerfQuery } from "@/lib/perf/server-timing";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export type PrismaPoolDiagnostics = {
  hostKind: "supabase_pooler" | "supabase_direct" | "other" | "missing";
  port: string | null;
  pgbouncer: boolean;
  connectionLimit: number | null;
  /** Mode pooler détecté / forcé par le code. */
  mode: "transaction" | "session" | "direct" | "unknown";
  rewrittenToTransaction: boolean;
};

let lastDiagnostics: PrismaPoolDiagnostics = {
  hostKind: "missing",
  port: null,
  pgbouncer: false,
  connectionLimit: null,
  mode: "unknown",
  rewrittenToTransaction: false,
};

export function getPrismaPoolDiagnostics(): PrismaPoolDiagnostics {
  return { ...lastDiagnostics };
}

/**
 * Pooler Supabase :
 * - Session (5432) ≈ 15 slots partagés → EMAXCONNSESSION sous charge.
 * - Transaction (6543 + pgbouncer=true) : recommandé pour Prisma runtime.
 *
 * Escape hatches :
 * - BEWORK_FORCE_SESSION_POOLER=1 → ne pas réécrire 5432→6543
 * - BEWORK_PRISMA_CONNECTION_LIMIT=N → override du plafond
 */
function hardenDatabaseUrl(raw: string): string {
  try {
    const u = new URL(raw);
    const host = u.hostname.toLowerCase();
    const isPooler = host.includes("pooler.supabase.com");
    const isDirect = host.startsWith("db.") && host.endsWith(".supabase.co");
    const forceSession = process.env.BEWORK_FORCE_SESSION_POOLER === "1";
    let rewrittenToTransaction = false;

    if (isPooler && !forceSession && (u.port === "5432" || u.port === "")) {
      u.port = "6543";
      rewrittenToTransaction = true;
    }

    if ((isPooler || u.port === "6543") && !u.searchParams.has("pgbouncer")) {
      if (u.port === "6543") u.searchParams.set("pgbouncer", "true");
    }

    const limitRaw = (process.env.BEWORK_PRISMA_CONNECTION_LIMIT ?? "").trim();
    const limitFromEnv = Number.parseInt(limitRaw, 10);
    if (!u.searchParams.has("connection_limit")) {
      const limit =
        Number.isFinite(limitFromEnv) && limitFromEnv > 0
          ? Math.min(10, limitFromEnv)
          : 3;
      u.searchParams.set("connection_limit", String(limit));
    }
    if (!u.searchParams.has("pool_timeout")) {
      u.searchParams.set("pool_timeout", "20");
    }

    const connectionLimit = Number.parseInt(
      u.searchParams.get("connection_limit") || "",
      10,
    );
    const pgbouncer = u.searchParams.get("pgbouncer") === "true";
    const mode: PrismaPoolDiagnostics["mode"] = isDirect
      ? "direct"
      : u.port === "6543" || pgbouncer
        ? "transaction"
        : isPooler
          ? "session"
          : "unknown";

    lastDiagnostics = {
      hostKind: isPooler ? "supabase_pooler" : isDirect ? "supabase_direct" : "other",
      port: u.port || null,
      pgbouncer,
      connectionLimit: Number.isFinite(connectionLimit) ? connectionLimit : null,
      mode,
      rewrittenToTransaction,
    };

    return u.toString();
  } catch {
    return raw;
  }
}

// Prisma Client (requêtes runtime) : DATABASE_URL (pooler Supabase 6543 recommandé avec ?pgbouncer=true).
// DIRECT_URL sert surtout aux migrations / db push via `schema.prisma` `directUrl`.
function getConnectionUrl(): string {
  const pool = (process.env.DATABASE_URL ?? "").trim();
  const direct = (process.env.DIRECT_URL ?? "").trim();
  const isPg = (u: string) =>
    u.startsWith("postgresql://") || u.startsWith("postgres://");

  if (pool && isPg(pool)) return hardenDatabaseUrl(pool);
  if (direct && isPg(direct)) return hardenDatabaseUrl(direct);
  return "";
}

const connectionUrl = getConnectionUrl();

if (!connectionUrl && process.env.NODE_ENV === "production") {
  console.error(
    "[Prisma] DATABASE_URL (ou DIRECT_URL) manquant. Vérifiez les variables d'environnement Railway.",
  );
} else if (connectionUrl) {
  const d = lastDiagnostics;
  console.info(
    `[Prisma] pool mode=${d.mode} port=${d.port ?? "?"} pgbouncer=${d.pgbouncer} connection_limit=${d.connectionLimit ?? "?"} rewrittenTx=${d.rewrittenToTransaction}`,
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

/** Toujours mémoriser : évite des multi-instances sous hot-reload / bundling Next. */
globalForPrisma.prisma = baseClient;
