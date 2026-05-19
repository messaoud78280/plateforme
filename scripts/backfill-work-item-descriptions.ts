/**
 * Rattrapage des désignations complètes « À compléter » sur les ouvrages déjà en base.
 *
 * Usage :
 *   npm run db:backfill-work-item-descriptions          # simulation (dry-run)
 *   npm run db:backfill-work-item-descriptions -- --apply   # écriture en base
 */
import { PrismaClient } from "@prisma/client";
import { resolveFullDescriptionForExistingWorkItem } from "../src/lib/be-work-devis-work-item-description";
import { getScriptDatabaseUrl, loadScriptEnv } from "./load-script-env";

loadScriptEnv();
const connectionUrl = getScriptDatabaseUrl();
if (!connectionUrl) {
  console.error("❌ DATABASE_URL manquant (.env ou .env.local)");
  process.exit(1);
}

const apply = process.argv.includes("--apply");

const prisma = new PrismaClient({
  datasourceUrl: connectionUrl,
});

async function main() {
  const items = await prisma.workItem.findMany({
    select: {
      id: true,
      code: true,
      title: true,
      unit: true,
      shortDescription: true,
      fullDescription: true,
    },
    orderBy: { code: "asc" },
  });

  const toUpdate: { id: string; code: string; title: string; next: string }[] = [];

  for (const item of items) {
    const next = resolveFullDescriptionForExistingWorkItem(item);
    if (next && next !== item.fullDescription.trim()) {
      toUpdate.push({ id: item.id, code: item.code, title: item.title, next });
    }
  }

  console.log(`→ ${items.length} ouvrage(s) en base`);
  console.log(`→ ${toUpdate.length} désignation(s) à mettre à jour`);

  if (toUpdate.length === 0) {
    console.log("✓ Rien à faire.");
    return;
  }

  const preview = toUpdate.slice(0, 5);
  for (const row of preview) {
    console.log(`\n  ${row.code} — ${row.title.slice(0, 60)}${row.title.length > 60 ? "…" : ""}`);
    console.log(`    → ${row.next.slice(0, 120)}${row.next.length > 120 ? "…" : ""}`);
  }
  if (toUpdate.length > preview.length) {
    console.log(`\n  … et ${toUpdate.length - preview.length} autre(s)`);
  }

  if (!apply) {
    console.log("\n⚠️  Mode simulation. Relancez avec --apply pour enregistrer :");
    console.log("    npm run db:backfill-work-item-descriptions -- --apply");
    return;
  }

  console.log("\n→ Mise à jour en cours…");
  let updated = 0;
  for (const row of toUpdate) {
    await prisma.workItem.update({
      where: { id: row.id },
      data: { fullDescription: row.next },
    });
    updated += 1;
  }
  console.log(`✓ ${updated} ouvrage(s) mis à jour.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
