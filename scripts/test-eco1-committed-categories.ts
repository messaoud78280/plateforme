/**
 * ECO-1 — ventilation de l’engagé achats par catégorie.
 * npx tsx scripts/test-eco1-committed-categories.ts
 */
import assert from "node:assert/strict";
import {
  aggregateCommittedByCategory,
  derivePurchaseOrderInvoiceCategory,
  resolvePurchaseLineCostCategory,
} from "../src/lib/purchase-orders/cost-category";
import { estimateCategoryFinalCost } from "../src/lib/chantier/project-profitability";
import { resolvePurchaseActualHt } from "../src/lib/chantier/supplier-invoices";

function testMaterialOnly() {
  const s = aggregateCommittedByCategory({
    lines: [{ quantity: 35, unitPriceHt: 1000, costCategory: "MATERIAL" }],
    amountHt: 35_000,
  });
  assert.equal(s.MATERIAL, 35_000);
  assert.equal(s.EQUIPMENT, 0);
  assert.equal(s.UNCLASSIFIED, 0);
  console.log("OK: PO 100 % matériaux");
}

function testEquipmentOnly() {
  const s = aggregateCommittedByCategory({
    lines: [{ quantity: 1, unitPriceHt: 8_000, costCategory: "EQUIPMENT" }],
    amountHt: 8_000,
  });
  assert.equal(s.EQUIPMENT, 8_000);
  assert.equal(s.MATERIAL, 0);
  assert.equal(s.UNCLASSIFIED, 0);
  console.log("OK: PO 100 % matériel");
}

function testMixed() {
  const s = aggregateCommittedByCategory({
    lines: [
      { quantity: 1, unitPriceHt: 5_000, costCategory: "MATERIAL" },
      { quantity: 1, unitPriceHt: 2_000, costCategory: "EQUIPMENT" },
    ],
    amountHt: 7_000,
  });
  assert.equal(s.MATERIAL, 5_000);
  assert.equal(s.EQUIPMENT, 2_000);
  assert.equal(s.UNCLASSIFIED, 0);
  console.log("OK: PO mixte 5 000 + 2 000");
}

function testUnclassified() {
  const s = aggregateCommittedByCategory({
    lines: [{ quantity: 1, unitPriceHt: 4_260 }],
    amountHt: 4_260,
  });
  assert.equal(s.UNCLASSIFIED, 4_260);
  assert.equal(s.MATERIAL, 0);
  console.log("OK: PO sans catégorie → À classer");
}

function testMaterialRequirementAuto() {
  const cat = resolvePurchaseLineCostCategory({
    hasMaterialRequirement: true,
  });
  assert.equal(cat, "MATERIAL");
  const s = aggregateCommittedByCategory({
    lines: [{ quantity: 10, unitPriceHt: 100, hasMaterialRequirement: true }],
  });
  assert.equal(s.MATERIAL, 1_000);
  console.log("OK: besoin matériau → MATERIAL automatique");
}

function testBudgetAboveCommitted() {
  const f = estimateCategoryFinalCost({
    plannedHt: 80_000,
    committedHt: 60_000,
    actualHt: 58_200,
  });
  assert.equal(f, 80_000);
  console.log("OK: budget > engagé / réel → forecast = prévu");
}

function testOverrun() {
  const f = estimateCategoryFinalCost({
    plannedHt: 80_000,
    committedHt: 90_000,
    actualHt: 58_200,
  });
  assert.equal(f, 90_000);
  console.log("OK: engagé > budget → forecast = 90 000");
}

function testInvoiceNoDoubleCount() {
  const resolved = resolvePurchaseActualHt({
    recordedInvoiceHt: 33_500,
    hasRecordedInvoice: true,
    receiptHt: 20_000,
  });
  assert.equal(resolved.source, "invoice");
  assert.equal(resolved.actualHt, 33_500);
  const committed = aggregateCommittedByCategory({
    lines: [{ quantity: 35, unitPriceHt: 1000, costCategory: "MATERIAL" }],
  });
  assert.equal(committed.MATERIAL, 35_000);
  assert.notEqual(committed.MATERIAL + resolved.actualHt, 35_000 + 20_000 + 33_500);
  console.log("OK: facture liée — réel = facture, pas réception + facture");
}

function testInvoiceDefaultFromPo() {
  assert.equal(
    derivePurchaseOrderInvoiceCategory({
      lines: [{ quantity: 1, unitPriceHt: 25_000, costCategory: "MATERIAL" }],
    }),
    "MATERIAL",
  );
  assert.equal(
    derivePurchaseOrderInvoiceCategory({
      lines: [
        { quantity: 1, unitPriceHt: 5_000, costCategory: "MATERIAL" },
        { quantity: 1, unitPriceHt: 2_000, costCategory: "EQUIPMENT" },
      ],
    }),
    "UNCLASSIFIED",
  );
  console.log("OK: défaut facture = catégorie unique du BC");
}

function testNoSupplierHeuristic() {
  const s = aggregateCommittedByCategory({
    lines: [{ quantity: 1, unitPriceHt: 10_000 }],
    defaultCostCategory: null,
  });
  assert.equal(s.UNCLASSIFIED, 10_000);
  console.log("OK: pas de classification par fournisseur");
}

testMaterialOnly();
testEquipmentOnly();
testMixed();
testUnclassified();
testMaterialRequirementAuto();
testBudgetAboveCommitted();
testOverrun();
testInvoiceNoDoubleCount();
testInvoiceDefaultFromPo();
testNoSupplierHeuristic();
console.log("\nECO-1 unitaires OK");
