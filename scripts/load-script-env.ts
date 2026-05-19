/**
 * Charge .env puis .env.local (comme Next.js) et retourne l’URL Prisma pour les scripts.
 * Préfère DATABASE_URL (pooler 6543) : plus fiable en local que db.*.supabase.co:5432.
 */
import { config } from "dotenv";
import { resolve } from "node:path";

const root = resolve(__dirname, "..");

export function loadScriptEnv(): void {
  config({ path: resolve(root, ".env") });
  config({ path: resolve(root, ".env.local"), override: true });
}

export function getScriptDatabaseUrl(): string {
  const pool = (process.env.DATABASE_URL ?? "").trim();
  const direct = (process.env.DIRECT_URL ?? "").trim();
  const isPg = (u: string) => u.startsWith("postgresql://") || u.startsWith("postgres://");

  if (pool && isPg(pool)) return pool;
  if (direct && isPg(direct)) return direct;
  return "";
}
