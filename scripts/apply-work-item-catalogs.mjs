#!/usr/bin/env node
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
    /* ignore */
  }
}

loadEnvLocal();
const url = process.env.DATABASE_URL?.replace("pgbouncer=true", "pgbouncer=false") ?? process.env.DIRECT_URL;
if (!url) {
  console.error("DATABASE_URL manquant");
  process.exit(1);
}

const sql = readFileSync(resolve(root, "prisma/migrations/add-work-item-catalogs.sql"), "utf8");
const client = new pg.Client({
  connectionString: url,
  ssl: url.includes("supabase") ? { rejectUnauthorized: false } : undefined,
});

await client.connect();
try {
  await client.query(sql);
  const v = await client.query(`
    SELECT c.name, COUNT(w.id)::int AS n
    FROM "WorkItemCatalog" c
    LEFT JOIN "WorkItem" w ON w."catalogId" = c.id
    GROUP BY c.id, c.name
    ORDER BY c.name;
  `);
  console.log("OK migration catalogues.");
  for (const row of v.rows) console.log(` - ${row.name}: ${row.n} ouvrages`);
} finally {
  await client.end();
}
