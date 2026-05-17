/**
 * Harmonise les champs lot / subLot / familyCode des ouvrages BeWork Devis.
 *
 * Usage :
 *   npm run db:normalize-work-item-lots              # simulation
 *   npm run db:normalize-work-item-lots -- --apply   # écriture en base
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import {
  normalizeWorkItemLotFields,
  workItemLotNeedsNormalization,
} from "../src/lib/bework-devis-lot-normalize";

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
  const items = await prisma.workItem.findMany({
    select: { id: true, code: true, lot: true, subLot: true, family: true, familyCode: true },
    orderBy: { code: "asc" },
  });

  let workItemsUpdated = 0;
  let quoteLinesUpdated = 0;
  const lotMerges = new Map<string, string>();

  for (const item of items) {
    if (!workItemLotNeedsNormalization(item)) continue;

    const before = `${item.lot}${item.subLot ? ` / ${item.subLot}` : ""}`;
    const n = normalizeWorkItemLotFields(item);
    const after = `${n.lot}${n.subLot ? ` / ${n.subLot}` : ""}`;

    if (before !== after) {
      lotMerges.set(before, after);
    }

    if (!apply) {
      console.log(`  ${item.code}: « ${before} » → « ${after} »`);
      workItemsUpdated += 1;
      continue;
    }

    await prisma.workItem.update({
      where: { id: item.id },
      data: { lot: n.lot, subLot: n.subLot, familyCode: n.familyCode },
    });

    const ql = await prisma.quoteLine.updateMany({
      where: { workItemId: item.id },
      data: { lot: n.lot, family: n.subLot ?? undefined },
    });
    quoteLinesUpdated += ql.count;
    workItemsUpdated += 1;
  }

  if (apply) {
    const orphanLines = await prisma.quoteLine.findMany({
      where: { workItemId: null },
      select: { id: true, lot: true, family: true },
    });
    for (const line of orphanLines) {
      const n = normalizeWorkItemLotFields({
        lot: line.lot,
        subLot: line.family,
      });
      if (n.lot === line.lot && (n.subLot ?? null) === (line.family?.trim() || null)) continue;
      await prisma.quoteLine.update({
        where: { id: line.id },
        data: { lot: n.lot, family: n.subLot ?? undefined },
      });
      quoteLinesUpdated += 1;
    }
  }

  const distinctLotsAfter = apply
    ? await prisma.workItem.findMany({ select: { lot: true }, distinct: ["lot"] })
    : [];

  console.log(apply ? "✅ Normalisation appliquée" : "ℹ️  Simulation (ajoutez --apply pour écrire)");
  console.log(`   Ouvrages harmonisés : ${workItemsUpdated}`);
  if (apply) {
    console.log(`   Lignes de devis mises à jour : ${quoteLinesUpdated}`);
    console.log(`   Lots distincts restants : ${distinctLotsAfter.length}`);
  }
  if (lotMerges.size > 0 && !apply) {
    console.log(`   Exemples de fusions (${Math.min(8, lotMerges.size)} / ${lotMerges.size}) :`);
    let i = 0;
    for (const [from, to] of lotMerges) {
      if (i++ >= 8) break;
      console.log(`     · ${from} → ${to}`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
