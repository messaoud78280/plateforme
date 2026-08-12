/**
 * DF-4 — Échéances, OVERDUE, paiements
 * Run: npx tsx scripts/test-commercial-df4-collections.ts
 */
import assert from "node:assert/strict";
import {
  agingBucket,
  assertPaymentWithinRemaining,
  computeDueDateFromTerms,
  daysOverdue,
  defaultDueDateFromIssue,
  evaluateCommercialInvoiceStatus,
  isCollectibleInvoiceType,
  isDueDatePast,
} from "../src/lib/commercial/invoice-status";

function testA_futureIssued() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const s = evaluateCommercialInvoiceStatus({
    status: "ISSUED",
    totalTtc: 10_000,
    amountPaid: 0,
    amountDue: 10_000,
    dueDate: tomorrow,
  });
  assert.equal(s, "ISSUED");
  console.log("✓ A échéance future → ISSUED");
}

function testB_partial() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 5);
  const s = evaluateCommercialInvoiceStatus({
    status: "ISSUED",
    totalTtc: 10_000,
    amountPaid: 4_000,
    amountDue: 6_000,
    dueDate: tomorrow,
  });
  assert.equal(s, "PARTIALLY_PAID");
  console.log("✓ B partiel → PARTIALLY_PAID");
}

function testC_paid() {
  const s = evaluateCommercialInvoiceStatus({
    status: "OVERDUE",
    totalTtc: 10_000,
    amountPaid: 10_000,
    amountDue: 0,
    dueDate: new Date("2020-01-01"),
  });
  assert.equal(s, "PAID");
  console.log("✓ C total / overdue soldé → PAID");
}

function testD_overdue() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const s = evaluateCommercialInvoiceStatus({
    status: "ISSUED",
    totalTtc: 10_000,
    amountPaid: 0,
    amountDue: 10_000,
    dueDate: yesterday,
  });
  assert.equal(s, "OVERDUE");
  assert.ok(daysOverdue(yesterday) >= 1);
  console.log("✓ D échéance hier → OVERDUE");
}

function testE_overduePartial() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 20);
  const s = evaluateCommercialInvoiceStatus({
    status: "PARTIALLY_PAID",
    totalTtc: 10_000,
    amountPaid: 4_000,
    amountDue: 6_000,
    dueDate: yesterday,
  });
  assert.equal(s, "OVERDUE");
  console.log("✓ E retard + partiel → reste OVERDUE");
}

function testF_draftNeverOverdue() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 10);
  const s = evaluateCommercialInvoiceStatus({
    status: "DRAFT",
    totalTtc: 10_000,
    amountPaid: 0,
    amountDue: 10_000,
    dueDate: yesterday,
  });
  assert.equal(s, "DRAFT");
  console.log("✓ F DRAFT jamais OVERDUE");
}

function testG_surpaiement() {
  assert.throws(
    () => assertPaymentWithinRemaining(6_000, 6_500),
    /Surpaiement refusé/,
  );
  assert.doesNotThrow(() => assertPaymentWithinRemaining(6_000, 6_000));
  console.log("✓ G surpaiement bloqué");
}

function testH_temporal() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  assert.equal(isDueDatePast(yesterday), true);
  assert.equal(isDueDatePast(tomorrow), false);
  const due = defaultDueDateFromIssue(new Date("2026-08-12"));
  assert.equal(due.toISOString().slice(0, 10), "2026-09-11");
  const j30 = computeDueDateFromTerms(new Date("2026-08-12"), "J30");
  assert.equal(j30.toISOString().slice(0, 10), "2026-09-11");
  console.log("✓ H temporel overdue + J+30 = 11/09/2026");
}

function testI_aging() {
  const d20 = new Date();
  d20.setDate(d20.getDate() - 20);
  assert.equal(agingBucket(d20, 1000), "d8_30");
  const future = new Date();
  future.setDate(future.getDate() + 3);
  assert.equal(agingBucket(future, 1000), "not_due");
  console.log("✓ I aging buckets");
}

function testJ_creditExcluded() {
  assert.equal(isCollectibleInvoiceType("CREDIT"), false);
  assert.equal(isCollectibleInvoiceType("PROGRESS"), true);
  console.log("✓ J CREDIT hors KPI encaissement");
}

function testK_cancelRecalc() {
  // Après annulation d’un paiement sur facture soldée → recalcul statut
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 5);
  const s = evaluateCommercialInvoiceStatus({
    status: "ISSUED", // après cancel on réévalue depuis ISSUED-like
    totalTtc: 10_000,
    amountPaid: 4_000,
    amountDue: 6_000,
    dueDate: yesterday,
  });
  assert.equal(s, "OVERDUE");
  console.log("✓ K annulation → recalcul OVERDUE si échéance passée");
}

testA_futureIssued();
testB_partial();
testC_paid();
testD_overdue();
testE_overduePartial();
testF_draftNeverOverdue();
testG_surpaiement();
testH_temporal();
testI_aging();
testJ_creditExcluded();
testK_cancelRecalc();
console.log("\nDF-4 OK");
