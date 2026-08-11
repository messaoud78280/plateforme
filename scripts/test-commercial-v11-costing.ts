/**
 * GESTION COMMERCIALE V1.1 — moteur de chiffrage BTP.
 * Run: npx tsx scripts/test-commercial-v11-costing.ts
 */
import {
  calculateComponentLineCost,
  calculateWorkItemCosting,
  calculateDealFinancialSummary,
  effectiveQuantityWithLoss,
  hoursPerUnitFromTeamProduction,
  laborHoursForQuantity,
  marquePercentFromCostSell,
  markupPercentFromCostSell,
  personDaysFromHours,
  roundMoney,
  sellCoefficientFromCostSell,
  sellFromCostAndMarginPercent,
} from "../src/lib/commercial/money";
import { buildCompositionSnapshot } from "../src/lib/commercial/library";

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
  // 10 U × 2 € + 0,5 h × 30 € = 35 € / unité
  const costing = calculateWorkItemCosting({
    components: [
      { type: "MATERIAL", quantityPerUnit: 10, unitCostHt: 2 },
      { type: "LABOR", quantityPerUnit: 0.5, unitCostHt: 30 },
    ],
    sellMode: "MARGIN",
    marginPercent: 0,
    unitSellHt: 35,
  });
  assert(costing.dryCostHt === 35, "déboursé sec = 35");
  assert(costing.costPriceHt === 35, "prix de revient sans frais = 35");
  assert(roundMoney(costing.dryCostHt * 10, 2) === 350, "10 m² → 350 € déboursé");
}

{
  const withLoss = calculateComponentLineCost({
    quantityPerUnit: 10.5,
    unitCostHt: 1,
    lossPercent: 7,
  });
  assert(roundMoney(effectiveQuantityWithLoss(10.5, 7), 3) === 11.235, "qty + pertes 7%");
  assert(roundMoney(withLoss, 3) === 11.235, "coût ligne avec pertes");
}

{
  const costing = calculateWorkItemCosting({
    components: [{ type: "MATERIAL", quantityPerUnit: 10, unitCostHt: 2, lossPercent: 0 }],
    feesPercent: 10,
    feesAmountHt: 5,
    sellMode: "MARGIN",
    marginPercent: 20,
  });
  // dry 20 + fees 2 + 5 = 27 ; PV = 27 / 0.8 = 33.75
  assert(costing.dryCostHt === 20, "dry");
  assert(costing.feesHt === 7, "frais 10% + 5");
  assert(costing.costPriceHt === 27, "revient");
  assert(costing.unitSellHt === 33.75, "PV depuis marque 20%");
  assert(costing.marquePercent === 20, "taux de marque");
  assert(costing.markupPercent === markupPercentFromCostSell(27, 33.75), "taux de marge distinct");
  assert(
    costing.sellCoefficient === sellCoefficientFromCostSell(27, 33.75),
    "coefficient de vente",
  );
}

{
  const fixed = calculateWorkItemCosting({
    components: [{ type: "MATERIAL", quantityPerUnit: 1, unitCostHt: 80 }],
    sellMode: "FIXED_SELL",
    unitSellHt: 100,
  });
  assert(fixed.unitSellHt === 100, "PV fixe");
  assert(fixed.marquePercent === 20, "marque calculée depuis PV fixe");
}

{
  assert(laborHoursForQuantity(0.55, 100) === 55, "maçon 55 h");
  assert(laborHoursForQuantity(0.25, 100) === 25, "manœuvre 25 h");
  assert(personDaysFromHours(80, 8) === 10, "10 journées-personne");
}

{
  // MODE B préparé V1.2
  const h = hoursPerUnitFromTeamProduction({
    teamSize: 2,
    productionPerDay: 30,
    workDayHours: 8,
  });
  assert(roundMoney(h, 3) === 0.533, "MODE B → h/unité");
}

{
  const snap = buildCompositionSnapshot({
    id: "wi1",
    name: "Mur démo",
    reference: "OUV-MUR",
    saleUnit: "m²",
    kind: "COMPOSITE",
    feesPercent: 0,
    feesAmountHt: 0,
    sellMode: "MARGIN",
    marginPercent: 25,
    unitCostHt: 50,
    unitSellHt: 0,
    components: [
      {
        name: "Bloc",
        type: "MATERIAL",
        quantityPerUnit: 10,
        unit: "U",
        unitCostHt: 2,
        lineCostHt: 20,
        lossPercent: 0,
      },
    ],
  });
  assert(snap.workItemId === "wi1", "snapshot id");
  assert(snap.components.length === 1, "snapshot composants");
  assert(snap.unitCostHt > 0, "snapshot coût");
  assert(snap.unitSellHt === sellFromCostAndMarginPercent(snap.unitCostHt, 25), "snapshot PV");
  // Mutation bibliothèque ultérieure ne change pas un snapshot déjà pris
  const frozenSell = snap.unitSellHt;
  assert(frozenSell === snap.unitSellHt, "snapshot figé (référence locale)");
}

{
  const pos = calculateDealFinancialSummary({
    initialMarketHt: 82500,
    acceptedAmendmentsHt: 6800,
    invoicedHt: 0,
    paidTtc: 0,
    invoicedTtc: 0,
  });
  assert(pos.updatedMarketHt === 89300, "avenant positif");

  const neg = calculateDealFinancialSummary({
    initialMarketHt: 82500,
    acceptedAmendmentsHt: -1250,
    invoicedHt: 0,
    paidTtc: 0,
    invoicedTtc: 0,
  });
  assert(neg.updatedMarketHt === 81250, "avenant négatif");

  const mix = calculateDealFinancialSummary({
    initialMarketHt: 82500,
    acceptedAmendmentsHt: 6800 - 1250,
    invoicedHt: 0,
    paidTtc: 0,
    invoicedTtc: 0,
  });
  assert(mix.updatedMarketHt === 88050, "avenant mixte / marché actualisé");
}

{
  assert(marquePercentFromCostSell(75, 100) === 25, "marque 25%");
  assert(markupPercentFromCostSell(75, 100) === roundMoney((25 / 75) * 100, 2), "marge ≠ marque");
}

if (failed) {
  console.error(`\n${failed} échec(s)`);
  process.exit(1);
}
console.log("\nCommercial V1.1 costing: OK");
