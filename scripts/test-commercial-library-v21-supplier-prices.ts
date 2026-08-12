/**
 * Bibliothèque V2.1 — prix fournisseurs / prix retenu / impact.
 * Run: npx tsx scripts/test-commercial-library-v21-supplier-prices.ts
 */
import {
  buildCompositionSnapshot,
  groupLatestSupplierPrices,
  materialNeedsPriceReview,
  MATERIAL_PRICE_DIFF_ALERT_PERCENT,
  workItemRemovalMode,
} from "../src/lib/commercial/library";
import {
  calculateWorkItemCosting,
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
  const quotes = groupLatestSupplierPrices([
    {
      id: "p1",
      priceHt: 12.65,
      supplierName: "Point.P",
      supplierExternalOrgId: "s1",
      supplierReference: null,
      source: "MANUAL",
      notedAt: new Date("2026-08-08"),
      supplier: { id: "s1", name: "Point.P", tradeName: "Point.P" },
    },
    {
      id: "p2",
      priceHt: 12.2,
      supplierName: "Chausson",
      supplierExternalOrgId: "s2",
      supplierReference: null,
      source: "MANUAL",
      notedAt: new Date("2026-08-02"),
      supplier: { id: "s2", name: "Chausson", tradeName: "Chausson" },
    },
    {
      id: "p3",
      priceHt: 12.9,
      supplierName: "Point.P",
      supplierExternalOrgId: "s1",
      supplierReference: null,
      source: "MANUAL",
      notedAt: new Date("2026-07-01"),
      supplier: { id: "s1", name: "Point.P", tradeName: "Point.P" },
    },
  ]);
  assert(quotes.length === 2, "A — coexistence 2 fournisseurs (dernier Point.P retenu)");
  const pp = quotes.find((q) => q.supplierExternalOrgId === "s1");
  assert(pp?.priceHt === 12.65, "A — dernier prix Point.P = 12,65");
  assert(
    quotes.some((q) => q.supplierExternalOrgId === "s2" && q.priceHt === 12.2),
    "A — Chausson 12,20",
  );
}

{
  const stale = materialNeedsPriceReview({
    currentPriceHt: 11.8,
    referencePriceUpdatedAt: new Date("2025-01-01"),
    latestSupplierPriceHt: 11.8,
    now: new Date("2026-08-12"),
  });
  assert(stale.reasons.includes("STALE"), "prix ancien → STALE");

  const diff = materialNeedsPriceReview({
    currentPriceHt: 11.8,
    referencePriceUpdatedAt: new Date("2026-08-01"),
    latestSupplierPriceHt: 12.65,
    now: new Date("2026-08-12"),
  });
  assert(diff.reasons.includes("SUPPLIER_DIFF"), "écart ≥ 5 % → SUPPLIER_DIFF");
  assert(MATERIAL_PRICE_DIFF_ALERT_PERCENT === 5, "seuil 5 %");

  const tiny = materialNeedsPriceReview({
    currentPriceHt: 12,
    referencePriceUpdatedAt: new Date("2026-08-01"),
    latestSupplierPriceHt: 12.03,
    now: new Date("2026-08-12"),
  });
  assert(!tiny.reasons.includes("SUPPLIER_DIFF"), "+0,25 % ne déclenche pas");
}

{
  // Impact simulé : 1 matériau dans ouvrage FIXED_SELL
  const oldC = calculateWorkItemCosting({
    components: [
      { type: "MATERIAL", quantityPerUnit: 1, unitCostHt: 11.8, lossPercent: 0 },
      { type: "LABOR", quantityPerUnit: 0.5, unitCostHt: 30, lossPercent: 0 },
    ],
    sellMode: "FIXED_SELL",
    unitSellHt: 40,
  });
  const newC = calculateWorkItemCosting({
    components: [
      { type: "MATERIAL", quantityPerUnit: 1, unitCostHt: 12.65, lossPercent: 0 },
      { type: "LABOR", quantityPerUnit: 0.5, unitCostHt: 30, lossPercent: 0 },
    ],
    sellMode: "FIXED_SELL",
    unitSellHt: 40,
  });
  assert(roundMoney(oldC.costPriceHt, 2) === 26.8, "E — ancien déboursé");
  assert(roundMoney(newC.costPriceHt, 2) === 27.65, "E — nouveau déboursé");
  assert(newC.marquePercent < oldC.marquePercent, "E — marge diminue");
}

{
  const snap = buildCompositionSnapshot({
    id: "wi",
    name: "Cloison",
    reference: null,
    saleUnit: "m²",
    kind: "COMPOSITE",
    feesPercent: 0,
    feesAmountHt: 0,
    sellMode: "FIXED_SELL",
    marginPercent: 30,
    unitCostHt: 34.2,
    unitSellHt: 49,
    components: [
      {
        name: "Laine",
        type: "MATERIAL",
        quantityPerUnit: 1,
        unit: "m²",
        unitCostHt: 11.8,
        lineCostHt: 11.8,
        lossPercent: 0,
        materialId: "mat-1",
      },
    ],
  });
  const frozenCost = snap.unitCostHt;
  const frozenSell = snap.unitSellHt;
  // « update biblio » n’altère pas le snapshot local
  assert(snap.unitCostHt === frozenCost, "G — snapshot coût figé");
  assert(snap.unitSellHt === frozenSell && frozenSell === 49, "G — snapshot PV figé");
  assert(workItemRemovalMode(3) === "archive", "compat archivage");
}

if (failed > 0) {
  console.error(`\n${failed} assertion(s) failed`);
  process.exit(1);
}
console.log("\nBibliothèque V2.1 supplier prices: OK");
