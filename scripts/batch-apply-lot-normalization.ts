/**
 * Applique des mises à jour lot/familyCode à partir d’un JSON (export MCP).
 * Usage : npx tsx scripts/batch-apply-lot-normalization.ts < items.json > updates.sql
 */
import { readFileSync } from "node:fs";
import {
  normalizeWorkItemLotFields,
  workItemLotNeedsNormalization,
} from "../src/lib/bework-devis-lot-normalize";

type Row = {
  id: string;
  lot: string;
  subLot: string | null;
  family: string | null;
  familyCode: string | null;
  title: string;
  shortDescription: string | null;
  fullDescription: string | null;
  itemType: string;
};

const inputPath = process.argv[2];
const raw = inputPath ? readFileSync(inputPath, "utf8") : readFileSync(0, "utf8");
const items = JSON.parse(raw) as Row[];

function esc(s: string): string {
  return s.replace(/'/g, "''");
}

let updates = 0;
for (const item of items) {
  if (
    !workItemLotNeedsNormalization({
      lot: item.lot,
      subLot: item.subLot,
      family: item.family,
      familyCode: item.familyCode,
      title: item.title,
      shortDescription: item.shortDescription,
      fullDescription: item.fullDescription,
      itemType: item.itemType,
    })
  ) {
    continue;
  }

  const n = normalizeWorkItemLotFields({
    lot: item.lot,
    subLot: item.subLot,
    family: item.family,
    familyCode: item.familyCode,
    title: item.title,
    shortDescription: item.shortDescription,
    fullDescription: item.fullDescription,
    itemType: item.itemType,
  });

  console.log(
    `UPDATE "WorkItem" SET lot = '${esc(n.lot)}', "subLot" = ${n.subLot ? `'${esc(n.subLot)}'` : "NULL"}, "familyCode" = '${esc(n.familyCode)}' WHERE id = '${esc(item.id)}';`,
  );
  updates += 1;
}

console.error(`-- ${updates} mises à jour générées sur ${items.length} ouvrages`);
