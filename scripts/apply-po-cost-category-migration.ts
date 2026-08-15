/**
 * ECO-1 — applique les colonnes costCategory / defaultCostCategory.
 * npx tsx scripts/apply-po-cost-category-migration.ts
 */
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  getScriptDatabaseUrlCandidatesForLongJobs,
  loadScriptEnv,
} from "./load-script-env";

loadScriptEnv();
process.env.NODE_TLS_REJECT_UNAUTHORIZED ??= "0";

function maskUrl(url: string) {
  return url.replace(/:[^:@]+@/, ":***@");
}

async function main() {
  const sql = readFileSync(
    resolve(process.cwd(), "prisma/migrations/add-po-line-cost-category.sql"),
    "utf8",
  );
  const errors: string[] = [];
  for (const url of getScriptDatabaseUrlCandidatesForLongJobs()) {
    const client = new PrismaClient({ datasourceUrl: url });
    try {
      await client.$queryRaw`SELECT 1`;
      const stmts = sql
        .split(";")
        .map((s) =>
          s
            .split("\n")
            .filter((line) => !line.trim().startsWith("--"))
            .join("\n")
            .trim(),
        )
        .filter((s) => s.length > 0);
      for (const stmt of stmts) {
        await client.$executeRawUnsafe(stmt);
      }
      const cols = await client.$queryRawUnsafe<
        Array<{ table_name: string; column_name: string }>
      >(`
        SELECT table_name, column_name
        FROM information_schema.columns
        WHERE table_name IN ('PurchaseOrder', 'PurchaseOrderLine')
          AND column_name IN ('defaultCostCategory', 'costCategory')
        ORDER BY table_name, column_name
      `);
      console.log(`OK ${maskUrl(url)}`);
      console.log(cols);
      await client.$disconnect();
      return;
    } catch (e) {
      const msg = e instanceof Error ? e.message.split("\n")[0] : String(e);
      errors.push(`${maskUrl(url)} → ${msg}`);
      await client.$disconnect().catch(() => {});
    }
  }
  throw new Error(`Migration impossible.\n${errors.join("\n")}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
