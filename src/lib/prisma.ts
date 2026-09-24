import { PrismaClient } from "@prisma/client";
import { isPerfLogEnabled, recordPerfQuery } from "@/lib/perf/server-timing";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export type PrismaPoolDiagnostics = {
  hostKind: "supabase_pooler" | "supabase_direct" | "other" | "missing";
  /** Port lu dans DATABASE_URL avant toute réécriture. */
  configuredPort: string | null;
  /** Port effectivement utilisé par PrismaClient. */
  effectivePort: string | null;
  pgbouncer: boolean;
  connectionLimit: number | null;
  mode: "transaction" | "session" | "direct" | "unknown";
  /** true si le code a changé le port (5432→6543). */
  rewrittenToTransaction: boolean;
  /**
   * Politique active :
   * - off : aucune réécriture (défaut recommandé une fois DATABASE_URL en 6543)
   * - prefer_tx : réécriture autorisée via BEWORK_PREFER_TX_POOLER=1
   * - forced_session : BEWORK_FORCE_SESSION_POOLER=1
   */
  rewritePolicy: "off" | "prefer_tx" | "forced_session";
};

let lastDiagnostics: PrismaPoolDiagnostics = {
  hostKind: "missing",
  configuredPort: null,
  effectivePort: null,
  pgbouncer: false,
  connectionLimit: null,
  mode: "unknown",
  rewrittenToTransaction: false,
  rewritePolicy: "off",
};

export function getPrismaPoolDiagnostics(): PrismaPoolDiagnostics {
  return { ...lastDiagnostics };
}

/**
 * Durcit l’URL runtime Prisma.
 *
 * Contexte : Railway a encore DATABASE_URL en pooler session (5432, ~15 slots).
 * Prisma + SaaS → mode transaction 6543 + pgbouncer=true recommandé.
 *
 * Réécriture 5432→6543 : active par défaut tant que l’URL Railway n’est pas
 * corrigée. Toujours visible via health-db (configuredPort vs effectivePort).
 *
 * Désactiver :
 * - BEWORK_DISABLE_PORT_REWRITE=1
 * - ou BEWORK_FORCE_SESSION_POOLER=1
 *
 * Une fois DATABASE_URL Railway passé en 6543?pgbouncer=true, la réécriture
 * devient un no-op (configuredPort === effectivePort).
 *
 * DIRECT_URL (migrations) n’est PAS modifié ici.
 */
function hardenDatabaseUrl(raw: string): string {
  try {
    const u = new URL(raw);
    const host = u.hostname.toLowerCase();
    const isPooler = host.includes("pooler.supabase.com");
    const isDirect = host.startsWith("db.") && host.endsWith(".supabase.co");
    const configuredPort = u.port || (isPooler ? "5432" : null);
    const forceSession = process.env.BEWORK_FORCE_SESSION_POOLER === "1";
    const disableRewrite = process.env.BEWORK_DISABLE_PORT_REWRITE === "1";
    let rewrittenToTransaction = false;
    let rewritePolicy: PrismaPoolDiagnostics["rewritePolicy"] = "prefer_tx";

    if (forceSession) {
      rewritePolicy = "forced_session";
    } else if (disableRewrite) {
      rewritePolicy = "off";
    } else if (isPooler && (u.port === "5432" || u.port === "")) {
      u.port = "6543";
      rewrittenToTransaction = true;
      rewritePolicy = "prefer_tx";
    } else {
      rewritePolicy = "off";
    }

    if (u.port === "6543" && !u.searchParams.has("pgbouncer")) {
      u.searchParams.set("pgbouncer", "true");
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
      configuredPort,
      effectivePort: u.port || null,
      pgbouncer,
      connectionLimit: Number.isFinite(connectionLimit) ? connectionLimit : null,
      mode,
      rewrittenToTransaction,
      rewritePolicy,
    };

    return u.toString();
  } catch {
    return raw;
  }
}

function getConnectionUrl(): string {
  const pool = (process.env.DATABASE_URL ?? "").trim();
  const direct = (process.env.DIRECT_URL ?? "").trim();
  const isPg = (u: string) =>
    u.startsWith("postgresql://") || u.startsWith("postgres://");

  // Runtime : DATABASE_URL uniquement (ne pas détourner DIRECT_URL migrations).
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
    `[Prisma] pool mode=${d.mode} configuredPort=${d.configuredPort ?? "?"} effectivePort=${d.effectivePort ?? "?"} pgbouncer=${d.pgbouncer} connection_limit=${d.connectionLimit ?? "?"} rewritePolicy=${d.rewritePolicy} rewrittenTx=${d.rewrittenToTransaction}`,
  );
  if (d.mode === "session" && d.hostKind === "supabase_pooler") {
    console.warn(
      "[Prisma] DATABASE_URL est en mode session (port 5432). Risque EMAXCONNSESSION (~15 slots). " +
        "Recommandé : URL Transaction 6543?pgbouncer=true dans Railway.",
    );
  }
  if (d.rewrittenToTransaction) {
    console.warn(
      `[Prisma] DIAGNOSTIC: port Railway configuré=${d.configuredPort} → effectif=${d.effectivePort} (réécriture runtime). ` +
        `Corrigez DATABASE_URL Railway en 6543?pgbouncer=true pour supprimer cette réécriture. ` +
        `Désactiver: BEWORK_DISABLE_PORT_REWRITE=1`,
    );
  }
}

const enablePerfQuery = isPerfLogEnabled();

const baseClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: connectionUrl || "postgresql://localhost:5432/placeholder",
    log: ["error"],
  });

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

globalForPrisma.prisma = baseClient;
