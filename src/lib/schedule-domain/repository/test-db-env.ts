/**
 * Bootstrap connexion BDD pour tests repository Schedule V2.
 *
 * Cause historique :6543 injoignable depuis certains Mac / IPv4 :
 * - DATABASE_URL pointe souvent vers pooler transaction (6543)
 * - src/lib/prisma.ts peut réécrire session 5432 → 6543 (prefer_tx)
 *
 * Pour les tests longs (TX + advisory locks) :
 * - forcer session pooler :5432 (même projet Supabase)
 * - BEWORK_FORCE_SESSION_POOLER=1 pour bloquer la réécriture
 *
 * DIRECT_URL (db.*.supabase.co) = migrations / direct — ici auth échoue
 * avec le user `postgres` local ; ne pas l’utiliser pour ces tests.
 *
 * Chargé via : node --import ./…/test-db-env.ts
 */
import {
  loadScriptEnv,
  toSupabaseSessionPoolerUrl,
} from "../../../../scripts/load-script-env";

loadScriptEnv();

const pool = (process.env.DATABASE_URL ?? "").trim();
if (!pool) {
  throw new Error("DATABASE_URL absente — impossible de lancer les tests repository");
}

process.env.BEWORK_FORCE_SESSION_POOLER = "1";
process.env.DATABASE_URL = toSupabaseSessionPoolerUrl(pool);

if (!process.env.NODE_ENV) {
  Object.assign(process.env, { NODE_ENV: "test" });
}
