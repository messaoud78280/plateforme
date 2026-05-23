/**
 * Charge .env puis .env.local (comme Next.js) et retourne l’URL Prisma pour les scripts.
 */
import { config } from "dotenv";
import { resolve } from "node:path";

const root = resolve(__dirname, "..");

export function loadScriptEnv(): void {
  config({ path: resolve(root, ".env") });
  config({ path: resolve(root, ".env.local"), override: true });
}

function isPgUrl(u: string): boolean {
  return u.startsWith("postgresql://") || u.startsWith("postgres://");
}

/** Requêtes courtes : pooler Supabase (6543) en priorité. */
export function getScriptDatabaseUrl(): string {
  const pool = (process.env.DATABASE_URL ?? "").trim();
  const direct = (process.env.DIRECT_URL ?? "").trim();

  if (pool && isPgUrl(pool)) return pool;
  if (direct && isPgUrl(direct)) return direct;
  return "";
}

/**
 * Jobs longs (synchro masse) : connexion directe Postgres (5432).
 * Le pooler PgBouncer coupe souvent les connexions → « Server has closed the connection ».
 */
export function getScriptDatabaseUrlForLongJobs(): string {
  const direct = (process.env.DIRECT_URL ?? "").trim();
  const pool = (process.env.DATABASE_URL ?? "").trim();

  if (direct && isPgUrl(direct)) return direct;
  if (pool && isPgUrl(pool)) return pool;
  return "";
}

export function isPoolerDatabaseUrl(url: string): boolean {
  return /:6543\//.test(url) || /pgbouncer=true/i.test(url);
}
