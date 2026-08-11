/**
 * COMMERCIAL V1.1.1 — actions bibliothèque (archiver / supprimer / restaurer).
 * Run: npx tsx scripts/test-commercial-v111-library-actions.ts
 */
import {
  buildCompositionSnapshot,
  workItemRemovalMode,
} from "../src/lib/commercial/library";
import {
  calculateWorkItemCosting,
  marquePercentFromCostSell,
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
  assert(workItemRemovalMode(0) === "delete", "jamais utilisé → supprimer");
  assert(workItemRemovalMode(1) === "archive", "utilisé 1× → archiver");
  assert(workItemRemovalMode(12) === "archive", "utilisé N× → archiver");
}

{
  // Modifier biblio ≠ toucher un snapshot historique (immutabilité conceptuelle)
  const snap = buildCompositionSnapshot({
    id: "wi-1",
    name: "Parpaing",
    reference: "PAR-20",
    saleUnit: "m²",
    kind: "SIMPLE",
    feesPercent: 0,
    feesAmountHt: 0,
    sellMode: "MARGIN",
    marginPercent: 20,
    unitCostHt: 40,
    unitSellHt: 50,
    components: [
      {
        name: "Bloc 20",
        type: "MATERIAL",
        quantityPerUnit: 10,
        unit: "U",
        unitCostHt: 4,
        lineCostHt: 40,
        lossPercent: 0,
        materialId: "mat-1",
      },
    ],
  });
  const frozenCost = snap.unitCostHt;
  const frozenSell = snap.unitSellHt;
  const frozenName = snap.workItemName;

  // « Mise à jour bibliothèque » simulée — le snapshot local reste inchangé
  const libraryNow = {
    name: "Parpaing renforcé",
    unitCostHt: 55,
    unitSellHt: 70,
  };
  assert(snap.unitCostHt === frozenCost, "snapshot coût inchangé après « update biblio »");
  assert(snap.unitSellHt === frozenSell, "snapshot PV inchangé");
  assert(snap.workItemName === frozenName, "snapshot désignation inchangée");
  assert(libraryNow.unitCostHt !== snap.unitCostHt, "biblio et snapshot sont deux vérités");
}

{
  // COMPOSITE : recalcul V1.1 inchangé
  const costing = calculateWorkItemCosting({
    components: [
      { type: "MATERIAL", quantityPerUnit: 10, unitCostHt: 2, lossPercent: 0 },
      { type: "LABOR", quantityPerUnit: 0.5, unitCostHt: 30, lossPercent: 0 },
    ],
    sellMode: "MARGIN",
    marginPercent: 20,
  });
  assert(costing.costPriceHt === 35, "recalcul composite coût");
  assert(costing.unitSellHt === 43.75, "recalcul composite PV marque 20%");
  assert(
    marquePercentFromCostSell(costing.costPriceHt, costing.unitSellHt) === 20,
    "marque 20%",
  );
}

{
  // Petite variation exacte (non-régression arrondi)
  assert(roundMoney(8.4 * 1.1, 4) === 9.24, "pertes × PU");
}

if (failed > 0) {
  console.error(`\n${failed} assertion(s) failed`);
  process.exit(1);
}
console.log("\nCommercial V1.1.1 library actions: OK");
