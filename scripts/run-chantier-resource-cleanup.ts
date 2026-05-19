/**
 * Nettoyage global ressources chantier : alias en double + fiches strictement identiques.
 *
 * Usage:
 *   npx tsx scripts/run-chantier-resource-cleanup.ts           # dry-run (aperçu)
 *   npx tsx scripts/run-chantier-resource-cleanup.ts --apply   # exécution en base
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();
import { PrismaClient } from "@prisma/client";
import {
  buildResourceDuplicateCleanupPreview,
  dedupeAllResourceAliases,
  applyResourceDuplicateCleanup,
} from "../src/lib/chantier-resources/execute-cleanup";

const connectionUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionUrl) {
  console.error("❌ DIRECT_URL ou DATABASE_URL manquant (.env ou .env.local)");
  process.exit(1);
}

const apply = process.argv.includes("--apply");

const prisma = new PrismaClient({
  datasourceUrl: connectionUrl,
});

async function main() {
  console.log(apply ? "▶ Nettoyage en base…\n" : "▶ Aperçu (dry-run) — ajoutez --apply pour exécuter\n");

  const preview = await buildResourceDuplicateCleanupPreview(prisma);

  const aliasPreview = await prisma.siteResource.findMany({
    where: { status: { not: "fusionne" } },
    select: {
      id: true,
      shortName: true,
      aliases: { select: { id: true, normalizedLabel: true, label: true, createdAt: true, confidenceScore: true, sourceWorkItemId: true } },
    },
  });

  let aliasRemovable = 0;
  let aliasResources = 0;
  const { aliasIdsToRemoveKeepingOnePerNormalized } = await import("../src/lib/chantier-resources/alias-dedup");
  for (const r of aliasPreview) {
    const ids = aliasIdsToRemoveKeepingOnePerNormalized(r.aliases);
    if (ids.length > 0) {
      aliasRemovable += ids.length;
      aliasResources += 1;
    }
  }

  console.log("── Alias / synonymes ──");
  console.log(`  Fiches avec doublons d'alias : ${aliasResources}`);
  console.log(`  Alias en double à supprimer   : ${aliasRemovable}`);

  console.log("\n── Fiches ressources (doublons stricts / regroupement) ──");
  console.log(`  Ressources analysées          : ${preview.totalAnalyzed}`);
  console.log(`  Groupes à fusionner           : ${preview.groups.length}`);
  console.log(`  Doublons stricts supprimables : ${preview.strictDuplicatesRemovable}`);
  console.log(`  Fusions avec prix distincts   : ${preview.groups.reduce((n, g) => n + g.mergeWithPriceIds.length, 0)}`);
  console.log(`  Corrections classification    : ${preview.classificationFixes.length}`);

  if (!apply) {
    console.log("\n→ Relancez avec --apply pour appliquer.");
    return;
  }

  console.log("\n── Application ──");
  const aliases = await dedupeAllResourceAliases(prisma);
  console.log(`✓ Alias : ${aliases.removed} supprimé(s) sur ${aliases.resourcesAffected} fiche(s)`);

  const resources = await applyResourceDuplicateCleanup(prisma, preview);
  console.log(
    `✓ Fiches : ${resources.merged} fusion(s), ${resources.removed} doublon(s) strict(s), ${resources.pricesAdded} prix conservé(s), ${resources.classificationFixes} classification(s) corrigée(s)`,
  );

  console.log("\n✅ Nettoyage terminé.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
