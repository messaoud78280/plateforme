/**
 * ECO-2 — préparation facture fournisseur depuis BC / réception.
 * npx tsx scripts/test-eco2-prepare-supplier-invoice.ts
 */
import assert from "node:assert/strict";
import {
  buildSupplierInvoicePrefill,
  computeInvoiceVariance,
  computeReceivedTheoreticalHt,
  summarizePoSupplierBilling,
} from "../src/lib/chantier/prepare-supplier-invoice";
import { resolvePurchaseActualHt } from "../src/lib/chantier/supplier-invoices";

function testPartialReceipt() {
  const prefill = buildSupplierInvoicePrefill({
    supplierId: "sup-pp",
    supplierName: "POINT.P",
    projectId: "prj",
    projectTitle: "Résidence Victor Hugo",
    purchaseOrderId: "po-101",
    purchaseOrderNumber: "BC-ECO-2026-101",
    orderAmountHt: 35_000,
    defaultCostCategory: "MATERIAL",
    lines: [
      {
        designation: "Isolant toiture-terrasse",
        quantity: 35,
        unitPriceHt: 1_000,
        costCategory: "MATERIAL",
        receivedConforming: 20,
      },
    ],
  });
  assert.equal(prefill.supplierName, "POINT.P");
  assert.equal(prefill.projectTitle, "Résidence Victor Hugo");
  assert.equal(prefill.purchaseOrderNumber, "BC-ECO-2026-101");
  assert.equal(prefill.category, "MATERIAL");
  assert.equal(prefill.categoryKnown, true);
  assert.equal(prefill.hasReceipt, true);
  assert.equal(prefill.receivedAmountHt, 20_000);
  assert.equal(prefill.orderAmountHt, 35_000);
  assert.equal(prefill.receivedQty, 20);
  assert.equal(prefill.orderedQty, 35);
  console.log("OK: réception partielle → préparation");
}

function testFullReceipt() {
  const ht = computeReceivedTheoreticalHt([
    { unitPriceHt: 25_000, receivedConforming: 1 },
  ]);
  assert.equal(ht, 25_000);
  const prefill = buildSupplierInvoicePrefill({
    supplierId: "s",
    projectId: "p",
    purchaseOrderId: "po",
    purchaseOrderNumber: "BC-ECO-2026-102",
    orderAmountHt: 25_000,
    lines: [
      {
        designation: "Membrane",
        quantity: 1,
        unitPriceHt: 25_000,
        costCategory: "MATERIAL",
        receivedConforming: 1,
      },
    ],
  });
  assert.equal(prefill.receivedAmountHt, 25_000);
  assert.equal(prefill.hasReceipt, true);
  console.log("OK: réception totale → préparation");
}

function testNoReceipt() {
  const prefill = buildSupplierInvoicePrefill({
    supplierId: "s",
    projectId: "p",
    purchaseOrderId: "po",
    purchaseOrderNumber: "BC-ECO-2026-103",
    orderAmountHt: 8_000,
    lines: [
      {
        designation: "Location nacelle",
        quantity: 1,
        unitPriceHt: 8_000,
        costCategory: "EQUIPMENT",
      },
    ],
  });
  assert.equal(prefill.hasReceipt, false);
  assert.equal(prefill.receivedAmountHt, null);
  assert.equal(prefill.category, "EQUIPMENT");
  assert.equal(prefill.categoryLabel, "Matériel / location");
  console.log("OK: PO sans réception → facture possible");
}

function testInvoiceWithoutPo() {
  const variance = computeInvoiceVariance(null, 180);
  assert.equal(variance.varianceHt, null);
  assert.equal(variance.overOrder, false);
  console.log("OK: facture sans PO — pas d’écart commande");
}

function testMaterialDefault() {
  const prefill = buildSupplierInvoicePrefill({
    supplierId: "s",
    projectId: "p",
    purchaseOrderId: "po",
    purchaseOrderNumber: "BC-1",
    lines: [
      {
        designation: "Isolant",
        quantity: 10,
        unitPriceHt: 100,
        costCategory: "MATERIAL",
      },
    ],
  });
  assert.equal(prefill.category, "MATERIAL");
  assert.equal(prefill.categoryKnown, true);
  console.log("OK: PO MATERIAL → facture MATERIAL");
}

function testEquipmentDefault() {
  const prefill = buildSupplierInvoicePrefill({
    supplierId: "s",
    projectId: "p",
    purchaseOrderId: "po",
    purchaseOrderNumber: "BC-2",
    lines: [
      {
        designation: "Nacelle",
        quantity: 1,
        unitPriceHt: 8_000,
        costCategory: "EQUIPMENT",
      },
    ],
  });
  assert.equal(prefill.category, "EQUIPMENT");
  assert.equal(prefill.categoryLabel, "Matériel / location");
  console.log("OK: PO EQUIPMENT → facture EQUIPMENT");
}

function testInvoiceBelowOrder() {
  const v = computeInvoiceVariance(35_000, 33_500);
  assert.equal(v.varianceHt, -1_500);
  assert.equal(v.overOrder, false);
  console.log("OK: facture < commande (−1 500)");
}

function testInvoiceAboveOrder() {
  const v = computeInvoiceVariance(35_000, 37_000);
  assert.equal(v.varianceHt, 2_000);
  assert.equal(v.overOrder, true);
  console.log("OK: facture > commande (+2 000, non bloquant)");
}

function testTwoInvoicesOnPo() {
  const s = summarizePoSupplierBilling({
    orderHt: 35_000,
    invoices: [
      { kind: "STANDARD", amountHt: 20_000, status: "RECORDED" },
      { kind: "STANDARD", amountHt: 13_500, status: "RECORDED" },
      { kind: "STANDARD", amountHt: 9_999, status: "CANCELLED" },
    ],
  });
  assert.equal(s.invoicedHt, 33_500);
  assert.equal(s.remainingHt, 1_500);
  assert.equal(s.invoiceCount, 2);
  console.log("OK: deux factures sur un PO (33 500 / 35 000)");
}

function testNoDoubleCount() {
  const r = resolvePurchaseActualHt({
    recordedInvoiceHt: 33_500,
    hasRecordedInvoice: true,
    receiptHt: 20_000,
  });
  assert.equal(r.source, "invoice");
  assert.equal(r.actualHt, 33_500);
  assert.notEqual(r.actualHt, 35_000 + 20_000 + 33_500);
  console.log("OK: anti-double-comptage — réel = 33 500");
}

function testMixedPoNoAutoSplit() {
  const prefill = buildSupplierInvoicePrefill({
    supplierId: "s",
    projectId: "p",
    purchaseOrderId: "po",
    purchaseOrderNumber: "BC-MIX",
    orderAmountHt: 7_000,
    lines: [
      { designation: "Membrane", quantity: 1, unitPriceHt: 5_000, costCategory: "MATERIAL" },
      { designation: "Nacelle", quantity: 1, unitPriceHt: 2_000, costCategory: "EQUIPMENT" },
    ],
  });
  assert.equal(prefill.mixedCategories, true);
  assert.equal(prefill.categoryKnown, false);
  assert.equal(prefill.category, "UNCLASSIFIED");
  console.log("OK: PO mixte — pas de ventilation auto multi-catégorie");
}

function testUnclassified() {
  const prefill = buildSupplierInvoicePrefill({
    supplierId: "s",
    projectId: "p",
    purchaseOrderId: "po",
    purchaseOrderNumber: "BC-X",
    lines: [{ designation: "Divers", quantity: 1, unitPriceHt: 100 }],
  });
  assert.equal(prefill.category, "UNCLASSIFIED");
  assert.equal(prefill.categoryKnown, false);
  console.log("OK: sans catégorie → à préciser");
}

testPartialReceipt();
testFullReceipt();
testNoReceipt();
testInvoiceWithoutPo();
testMaterialDefault();
testEquipmentDefault();
testInvoiceBelowOrder();
testInvoiceAboveOrder();
testTwoInvoicesOnPo();
testNoDoubleCount();
testMixedPoNoAutoSplit();
testUnclassified();
console.log("\nECO-2 unitaires OK");
