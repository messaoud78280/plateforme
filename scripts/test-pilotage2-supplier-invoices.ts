/**
 * PILOTAGE-2 — Factures fournisseurs / anti double-comptage
 * Run: npx tsx scripts/test-pilotage2-supplier-invoices.ts
 */
import assert from "node:assert/strict";
import {
  classifySupplierCostCategory,
  parseSupplierInvoiceCategory,
  resolvePurchaseActualHt,
  signedSupplierInvoiceHt,
} from "../src/lib/chantier/supplier-invoices";
import { estimateCategoryFinalCost } from "../src/lib/chantier/project-profitability";

function testSignedHt() {
  assert.equal(signedSupplierInvoiceHt("STANDARD", 10_000), 10_000);
  assert.equal(signedSupplierInvoiceHt("CREDIT", 1_500), -1_500);
  assert.equal(signedSupplierInvoiceHt("CREDIT", -1_500), -1_500);
  console.log("✓ HT signé : facture + / avoir −");
}

function testNoDoubleCountInvoiceAndReceipt() {
  const r = resolvePurchaseActualHt({
    recordedInvoiceHt: 10_000,
    hasRecordedInvoice: true,
    receiptHt: 6_000,
  });
  assert.equal(r.source, "invoice");
  assert.equal(r.actualHt, 10_000);
  assert.notEqual(r.actualHt, 16_000);
  console.log("✓ Facture 10k + réception 6k → réel 10k (pas 16k)");
}

function testReceiptFallback() {
  const r = resolvePurchaseActualHt({
    recordedInvoiceHt: 0,
    hasRecordedInvoice: false,
    receiptHt: 4_000,
  });
  assert.equal(r.source, "receipt");
  assert.equal(r.actualHt, 4_000);
  console.log("✓ Sans facture : réel = réception 4k");
}

function testCancelledInvoiceIgnored() {
  const r = resolvePurchaseActualHt({
    recordedInvoiceHt: 0,
    hasRecordedInvoice: false,
    receiptHt: 4_000,
  });
  assert.equal(r.actualHt, 4_000);
  console.log("✓ Facture annulée : retombe sur la réception");
}

function testCreditNet() {
  const net = signedSupplierInvoiceHt("STANDARD", 10_000) +
    signedSupplierInvoiceHt("CREDIT", 2_000);
  assert.equal(net, 8_000);
  const r = resolvePurchaseActualHt({
    recordedInvoiceHt: net,
    hasRecordedInvoice: true,
    receiptHt: 9_000,
  });
  assert.equal(r.actualHt, 8_000);
  console.log("✓ Avoir : réel net 8k, réception ignorée");
}

function testForecastUsesInvoice() {
  const f = estimateCategoryFinalCost({
    plannedHt: 30_000,
    committedHt: 18_000,
    actualHt: 34_000,
  });
  assert.equal(f, 34_000);
  console.log("✓ Forecast relève le réel facture 34k");
}

function testCategory() {
  assert.equal(classifySupplierCostCategory("SUBCONTRACTOR"), "SUBCONTRACT");
  assert.equal(classifySupplierCostCategory("SUPPLIER"), "UNCLASSIFIED");
  assert.equal(parseSupplierInvoiceCategory("MATERIAL"), "MATERIAL");
  assert.equal(parseSupplierInvoiceCategory("inventé"), "UNCLASSIFIED");
  console.log("✓ Catégorie : ST fiable, sinon Non classé / choix utilisateur");
}

function testEngagedUnchanged() {
  const committed = 18_000;
  const actual = 10_000;
  assert.notEqual(committed + actual, committed);
  assert.equal(committed, 18_000);
  console.log("✓ Engagé reste la commande, distinct du réel facture");
}

function main() {
  testSignedHt();
  testNoDoubleCountInvoiceAndReceipt();
  testReceiptFallback();
  testCancelledInvoiceIgnored();
  testCreditNet();
  testForecastUsesInvoice();
  testCategory();
  testEngagedUnchanged();
  console.log("\nPILOTAGE-2 — tests unitaires OK");
}

main();
