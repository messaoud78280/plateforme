/**
 * Réparation CLI — classification ouvrages génériques depuis importMeta des prix.
 * Usage : npx tsx scripts/repair-work-item-import-classification.ts [--dry-run] [--limit=500]
 */
import { PrismaClient } from "@prisma/client";
import {
  buildMergeClassificationPatch,
  inferClassificationFromPriceImportMeta,
  workItemHasGenericClassification,
} from "../src/lib/be-work-devis-import-classification";

const prisma = new PrismaClient();
const dryRun = process.argv.includes("--dry-run");
const limitArg = process.argv.find((a) => a.startsWith("--limit="));
const limit = limitArg ? Number.parseInt(limitArg.split("=")[1] ?? "500", 10) : 500;

async function main() {
  const candidates = await prisma.workItem.findMany({
    where: {
      mergeStatus: { not: "merged" },
      OR: [
        { familyCode: null },
        { familyCode: "DIV" },
        { lot: { contains: "Divers", mode: "insensitive" } },
        { family: { contains: "Non class", mode: "insensitive" } },
        { unit: { in: ["unité", "u", "U"] } },
      ],
    },
    select: {
      id: true,
      code: true,
      title: true,
      lot: true,
      subLot: true,
      family: true,
      familyCode: true,
      unit: true,
    },
    take: limit,
    orderBy: { updatedAt: "desc" },
  });

  let updated = 0;
  let skipped = 0;

  for (const item of candidates) {
    if (!workItemHasGenericClassification(item)) {
      skipped += 1;
      continue;
    }

    const prices = await prisma.priceEntry.findMany({
      where: { workItemId: item.id, importMeta: { not: null } },
      select: { importMeta: true },
      take: 50,
    });

    const inferred = inferClassificationFromPriceImportMeta(prices);
    if (!inferred) {
      skipped += 1;
      continue;
    }

    const patch = buildMergeClassificationPatch(item, inferred);
    if (!patch) {
      skipped += 1;
      continue;
    }

    console.log(`${dryRun ? "[dry-run] " : ""}${item.code} — ${item.title}`);
    console.log(`  avant: ${item.familyCode} | ${item.lot} | ${item.family ?? "—"} | ${item.unit}`);
    console.log(
      `  après: ${patch.familyCode ?? item.familyCode} | ${patch.lot ?? item.lot} | ${patch.family ?? item.family} | ${patch.unit ?? item.unit}`,
    );

    if (!dryRun) {
      await prisma.workItem.update({ where: { id: item.id }, data: patch });
    }
    updated += 1;
  }

  console.log(`\nScannés: ${candidates.length} · Mis à jour: ${updated} · Ignorés: ${skipped}${dryRun ? " (dry-run)" : ""}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
