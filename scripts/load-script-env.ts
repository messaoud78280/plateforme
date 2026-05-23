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
 * Jobs longs (synchro masse) : connexion directe db.*.supabase.co:5432.
 */
export function getScriptDatabaseUrlForLongJobs(): string {
  const direct = normalizeSupabaseDirectUrl((process.env.DIRECT_URL ?? "").trim());
  const pool = normalizeSupabaseDirectUrl((process.env.DATABASE_URL ?? "").trim());

  if (direct && isPgUrl(direct)) return direct;
  if (pool && isPgUrl(pool)) return pool;
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

/** pooler → db.[ref].supabase.co:5432 (évite « Can't reach database server at pooler:5432 »). */
export function normalizeSupabaseDirectUrl(raw: string): string {
  if (!raw || !isPgUrl(raw)) return raw;
  if (isTrueSupabaseDirectUrl(raw)) return raw;

  try {
    const u = new URL(raw);
    let projectRef = "";

    if (u.username.startsWith("postgres.")) {
      projectRef = u.username.slice("postgres.".length);
      u.username = "postgres";
    }

    const supabasePublic = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
    if (!projectRef && supabasePublic) {
      const m = supabasePublic.match(/https:\/\/([a-z0-9]+)\.supabase\.co/i);
      if (m?.[1]) projectRef = m[1];
    }

    if (u.hostname.includes("pooler.supabase.com") && projectRef) {
      u.hostname = `db.${projectRef}.supabase.co`;
      u.port = "5432";
      u.searchParams.delete("pgbouncer");
      if (!u.searchParams.has("sslmode")) u.searchParams.set("sslmode", "require");
      return u.toString();
    }

    return raw;
  } catch {
    return raw;
  }
}
