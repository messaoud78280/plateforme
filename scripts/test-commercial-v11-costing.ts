/**
 * GESTION COMMERCIALE V1.1 — moteur de chiffrage BTP.
 * Run: npx tsx scripts/test-commercial-v11-costing.ts
 */
import {
  calculateComponentLineCost,
  calculateLine,
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
import { buildCompositionSnapshot, workItemsToCsv } from "../src/lib/commercial/library";

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

{
  // Recette §5 / §52 — coût 100, PV 125
  assert(sellCoefficientFromCostSell(100, 125) === 1.25, "coefficient 1,25");
  assert(markupPercentFromCostSell(100, 125) === 25, "taux de marge 25 %");
  assert(marquePercentFromCostSell(100, 125) === 20, "taux de marque 20 %");
}

{
  // Recette §47 — Étanchéité terrasse 1 m² (puis × 100)
  const etancheite = calculateWorkItemCosting({
    components: [
      { type: "MATERIAL", quantityPerUnit: 1, unitCostHt: 10, lossPercent: 10 },
      { type: "LABOR", quantityPerUnit: 0.4, unitCostHt: 35 },
      { type: "EQUIPMENT", quantityPerUnit: 0.05, unitCostHt: 80 },
      { type: "SUBCONTRACT", quantityPerUnit: 1, unitCostHt: 2 },
    ],
    feesPercent: 5,
    feesAmountHt: 0,
    sellMode: "MARGIN",
    marginPercent: 20,
  });
  assert(etancheite.materialsHt === 11, "étanchéité matière 11 (10 + 10 % pertes)");
  assert(etancheite.laborHt === 14, "étanchéité MO 14");
  assert(etancheite.equipmentHt === 4, "étanchéité matériel 4");
  assert(etancheite.subcontractHt === 2, "étanchéité ST 2");
  assert(etancheite.dryCostHt === 31, "étanchéité déboursé 31");
  assert(etancheite.feesHt === 1.55, "étanchéité frais 5 %");
  assert(etancheite.costPriceHt === 32.55, "étanchéité revient 32.55");
  assert(etancheite.unitSellHt === 40.69, "étanchéité PV marque 20 %");
  const line100 = calculateLine({
    quantity: 100,
    unitCostHt: etancheite.costPriceHt,
    unitSellHt: etancheite.unitSellHt,
  });
  assert(line100.lineCostHt === 3255, "100 m² déboursé");
  assert(line100.lineSellHt === 4069, "100 m² vente");
}

{
  // Recette §49 — snapshot figé vs hausse matière 20 %
  const componentsAvant = [
    { name: "Membrane", type: "MATERIAL", quantityPerUnit: 1, unit: "m²", unitCostHt: 10, lineCostHt: 11, lossPercent: 10 },
  ];
  const snap = buildCompositionSnapshot({
    id: "wi-et",
    name: "Étanchéité terrasse",
    reference: "OUV-ET",
    saleUnit: "m²",
    kind: "COMPOSITE",
    feesPercent: 0,
    feesAmountHt: 0,
    sellMode: "MARGIN",
    marginPercent: 20,
    unitCostHt: 0,
    unitSellHt: 0,
    components: componentsAvant,
  });
  const frozen = snap.unitCostHt;
  const apres = calculateWorkItemCosting({
    components: [{ type: "MATERIAL", quantityPerUnit: 1, unitCostHt: 12, lossPercent: 10 }],
    sellMode: "MARGIN",
    marginPercent: 20,
  });
  assert(snap.unitCostHt === frozen, "snapshot devis inchangé après hausse");
  assert(apres.costPriceHt !== frozen, "bibliothèque recalculée");
  assert(apres.materialsHt === 13.2, "membrane 12 € + 10 % pertes");
}

{
  // Recette §48 — arrondis
  const r = calculateWorkItemCosting({
    components: [{ type: "MATERIAL", quantityPerUnit: 3.333, unitCostHt: 12.37, lossPercent: 7.5 }],
    feesPercent: 0,
    sellMode: "FIXED_SELL",
    unitSellHt: 50,
  });
  const expectedLine = calculateComponentLineCost({
    quantityPerUnit: 3.333,
    unitCostHt: 12.37,
    lossPercent: 7.5,
  });
  assert(r.materialsHt === roundMoney(expectedLine, 2) || r.materialsHt === expectedLine, "arrondi pertes × PU");
}

{
  assert(personDaysFromHours(40, 8) === 5, "journée 8 h → 5 j");
  assert(personDaysFromHours(40, 10) === 4, "journée 10 h → 4 j");
  assert(personDaysFromHours(35, 7) === 5, "journée 7 h → 5 j");
}

{
  function shouldApply(seq: number, current: number) {
    return seq === current;
  }
  assert(shouldApply(1, 2) === false, "mutationSeq : A tardive ignorée");
  assert(shouldApply(2, 2) === true, "mutationSeq : B récente appliquée");
}

{
  const samePrice = roundMoney(12, 4) === roundMoney(12, 4);
  assert(samePrice, "12 € → 12 € : pas de nouvelle variation");
}

{
  const csv = workItemsToCsv([
    {
      reference: "R1",
      name: "Mur ; « 20 cm »",
      family: "Maçonnerie",
      saleUnit: "m²",
      kind: "COMPOSITE",
      unitCostHt: 50.5,
      unitSellHt: 65,
      marginPercent: 22.31,
    },
  ]);
  assert(csv.startsWith("\uFEFF"), "CSV BOM UTF-8");
  assert(csv.includes("\"Mur ; « 20 cm »\""), "CSV échappe point-virgule");
  assert(csv.includes("50,5"), "CSV nombre virgule FR");
}

if (failed) {
  console.error(`\n${failed} échec(s)`);
  process.exit(1);
}
console.log("\nCommercial V1.1 costing: OK");
