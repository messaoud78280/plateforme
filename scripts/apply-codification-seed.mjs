#!/usr/bin/env node
/**
 * Applique le seed Artiprix (pooler .env.local).
 * Usage: node scripts/apply-codification-seed.mjs
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnvLocal() {
  try {
    const raw = readFileSync(resolve(root, ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const m = /^([A-Z_]+)="([^"]*)"/.exec(line.trim());
      if (m) process.env[m[1]] = m[2];
    }
  } catch {
    /* .env géré par Prisma sinon */
  }
}

loadEnvLocal();
const url = process.env.DATABASE_URL?.replace("pgbouncer=true", "pgbouncer=false") ?? process.env.DIRECT_URL;
if (!url) {
  console.error("DATABASE_URL ou DIRECT_URL manquant dans .env.local");
  process.exit(1);
}

const sql = readFileSync(
  resolve(root, "prisma/migrations/add-workitem-bework-codification-artiprix-seed.sql"),
  "utf8",
);

// Pooler Supabase : certificat parfois rejeté en local sans NODE_TLS_REJECT_UNAUTHORIZED=0
const client = new pg.Client({
  connectionString: url,
  ssl: url.includes("supabase") ? { rejectUnauthorized: false } : undefined,
});
await client.connect();
try {
  await client.query(sql);
  const verify = await client.query(`
    SELECT COUNT(*)::int AS n FROM "WorkItemCodificationMapping" WHERE active = true;
  `);
  const cols = await client.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'WorkItem'
      AND column_name IN ('codeBework', 'codificationStatus')
    ORDER BY 1;
  `);
  console.log("OK seed Artiprix appliqué.");
  console.log("Mappings actifs:", verify.rows[0]?.n);
  console.log("Colonnes WorkItem:", cols.rows.map((r) => r.column_name).join(", "));
} finally {
  await client.end();
}
