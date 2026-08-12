/**
 * Bibliothèque V2 — favoris, filtres, composition, snapshots.
 * Run: npx tsx scripts/test-commercial-library-v2.ts
 */
import {
  buildCompositionSnapshot,
  workItemRemovalMode,
} from "../src/lib/commercial/library";
import {
  calculateWorkItemCosting,
  marginPercentFromCostSell,
  roundMoney,
} from "../src/lib/commercial/money";

let failed = 0;
function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error("FAIL:", msg);
    failed += 1;
  } else {
    console.log("OK:", msg);
  }
}

{
  assert(workItemRemovalMode(0) === "delete", "suppression si jamais utilisé");
  assert(workItemRemovalMode(17) === "archive", "archivage si utilisé en devis");
}

{
  // Ouvrage SIMPLE — PV fixe
  const simple = calculateWorkItemCosting({
    components: [],
    sellMode: "FIXED_SELL",
    unitSellHt: 62,
    marginPercent: 0,
  });
  assert(simple.costPriceHt === 0, "simple : coût 0 si pas de composants");
  assert(simple.unitSellHt === 62, "simple : PV fixe 62");
  assert(
    Math.abs(marginPercentFromCostSell(0, 62) - 100) < 0.01 ||
      marginPercentFromCostSell(0, 62) === 100,
    "simple : marque 100 % si coût 0",
  );
}

{
  // COMPOSÉ — mur parpaing type
  const costing = calculateWorkItemCosting({
    components: [
      { type: "MATERIAL", quantityPerUnit: 10, unitCostHt: 1.45, lossPercent: 0 },
      { type: "MATERIAL", quantityPerUnit: 0.025, unitCostHt: 125, lossPercent: 0 },
      { type: "LABOR", quantityPerUnit: 0.45, unitCostHt: 32, lossPercent: 0 },
      { type: "LABOR", quantityPerUnit: 0.25, unitCostHt: 25, lossPercent: 0 },
    ],
    sellMode: "FIXED_SELL",
    unitSellHt: 62,
  });
  assert(roundMoney(costing.dryCostHt, 2) === 38.28, "déboursé sec 38,28");
  assert(roundMoney(costing.costPriceHt, 2) === 38.28, "prix de revient 38,28");
  assert(costing.unitSellHt === 62, "vente 62");
  const marge = marginPercentFromCostSell(costing.costPriceHt, 62);
  assert(roundMoney(marge, 1) === 38.3, `marge % ≈ 38,3 (got ${marge})`);
  assert(
    roundMoney(62 - costing.costPriceHt, 2) === 23.72,
    "marge € 23,72",
  );
}

{
  // Pertes / chutes
  const withLoss = calculateWorkItemCosting({
    components: [
      { type: "MATERIAL", quantityPerUnit: 10, unitCostHt: 1, lossPercent: 5 },
    ],
    sellMode: "FIXED_SELL",
    unitSellHt: 20,
  });
  assert(roundMoney(withLoss.materialsHt, 2) === 10.5, "perte 5 % → qty × 1,05");
}

{
  const snap = buildCompositionSnapshot({
    id: "wi-v2",
    name: "Mur",
    reference: null,
    saleUnit: "m²",
    kind: "COMPOSITE",
    feesPercent: 0,
    feesAmountHt: 0,
    sellMode: "FIXED_SELL",
    marginPercent: 38.3,
    unitCostHt: 38.28,
    unitSellHt: 62,
    components: [],
  });
  const frozen = snap.unitSellHt;
  assert(frozen === 62, "snapshot PV figé");
  assert(snap.workItemName === "Mur", "snapshot nom figé");
}

if (failed > 0) {
  console.error(`\n${failed} assertion(s) failed`);
  process.exit(1);
}
console.log("\nBibliothèque V2: OK");
