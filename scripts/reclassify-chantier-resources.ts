/**
 * Recatégorise toutes les fiches ressources chantier selon la taxonomie métier BTP.
 *
 * Usage:
 *   npx tsx scripts/reclassify-chantier-resources.ts           # aperçu
 *   npx tsx scripts/reclassify-chantier-resources.ts --apply   # mise à jour en base
 */
import { PrismaClient } from "@prisma/client";
import {
  collectClassificationFixes,
  loadResourcesForClassification,
  reclassifyAllSiteResources,
} from "../src/lib/chantier-resources/classification";
import { getFamilyLabel, getSubFamilyLabel } from "../src/lib/chantier-resources/taxonomy";
import { getScriptDatabaseUrl, loadScriptEnv } from "./load-script-env";

loadScriptEnv();
const connectionUrl = getScriptDatabaseUrl();
if (!connectionUrl) {
  console.error("❌ DATABASE_URL manquant (.env ou .env.local)");
  process.exit(1);
}

const apply = process.argv.includes("--apply");
const prisma = new PrismaClient({ datasourceUrl: connectionUrl });

async function main() {
  const resources = await loadResourcesForClassification(prisma);
  const fixes = collectClassificationFixes(resources);

  console.log(apply ? "▶ Recatégorisation en base…\n" : "▶ Aperçu (dry-run) — ajoutez --apply pour exécuter\n");
  console.log(`Fiches analysées : ${resources.length}`);
  console.log(`Corrections proposées : ${fixes.length}\n`);

  const byFamily = new Map<string, number>();
  for (const f of fixes) {
    const key = `${f.currentFamily} → ${f.suggestedFamily}`;
    byFamily.set(key, (byFamily.get(key) ?? 0) + 1);
  }
  if (byFamily.size > 0) {
    console.log("── Principaux déplacements ──");
    [...byFamily.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .forEach(([k, n]) => console.log(`  ${n}×  ${k}`));
    console.log("");
  }

  fixes.slice(0, 25).forEach((f) => {
    const from = `${getFamilyLabel(f.currentType, f.currentFamily)}${f.currentSubFamily ? ` / ${getSubFamilyLabel(f.currentType, f.currentFamily, f.currentSubFamily)}` : ""}`;
    const to = `${getFamilyLabel(f.suggestedType, f.suggestedFamily)}${f.suggestedSubFamily ? ` / ${getSubFamilyLabel(f.suggestedType, f.suggestedFamily, f.suggestedSubFamily)}` : ""}`;
    console.log(`• ${f.shortName.slice(0, 72)}${f.shortName.length > 72 ? "…" : ""}`);
    console.log(`    ${from}  →  ${to}`);
  });
  if (fixes.length > 25) console.log(`\n… et ${fixes.length - 25} autre(s) fiche(s).`);

  if (!apply) {
    console.log("\n→ Relancez avec --apply pour mettre à jour la bibliothèque.");
    return;
  }

  const result = await reclassifyAllSiteResources(prisma);
  console.log(`\n✅ ${result.applied} fiche(s) recatégorisée(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
