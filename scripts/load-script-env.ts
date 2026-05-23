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

export function isPoolerDatabaseUrl(url: string): boolean {
  return /pooler\.supabase\.com/i.test(url) || /:6543\//.test(url) || /pgbouncer=true/i.test(url);
}

export function isTrueSupabaseDirectUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.hostname.startsWith("db.") && u.hostname.endsWith(".supabase.co") && u.port !== "6543";
  } catch {
    return false;
  }
}

/**
 * Pooler Supabase en mode session (port 5432) — recommandé pour scripts longs depuis un Mac.
 * Ne pas convertir en db.*.supabase.co (souvent inaccessible en IPv4).
 */
export function toSupabaseSessionPoolerUrl(raw: string): string {
  if (!raw || !isPgUrl(raw)) return raw;
  try {
    const u = new URL(raw);
    if (!u.hostname.includes("supabase.com")) return raw;
    u.port = "5432";
    u.searchParams.delete("pgbouncer");
    if (!u.searchParams.has("sslmode")) u.searchParams.set("sslmode", "require");
    return u.toString();
  } catch {
    return raw;
  }
}

/** URLs à tester dans l’ordre (session pooler d’abord). */
export function getScriptDatabaseUrlCandidatesForLongJobs(): string[] {
  const pool = (process.env.DATABASE_URL ?? "").trim();
  const direct = (process.env.DIRECT_URL ?? "").trim();
  const out: string[] = [];
  const add = (u: string) => {
    if (u && isPgUrl(u) && !out.includes(u)) out.push(u);
  };

  if (pool) add(toSupabaseSessionPoolerUrl(pool));
  if (direct.includes("pooler.supabase.com")) add(toSupabaseSessionPoolerUrl(direct));
  else if (direct) add(direct);
  if (pool) add(pool);

  return out;
}

export function getScriptDatabaseUrlForLongJobs(): string {
  return getScriptDatabaseUrlCandidatesForLongJobs()[0] ?? "";
}
