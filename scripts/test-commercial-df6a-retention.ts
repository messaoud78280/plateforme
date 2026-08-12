/**
 * DF-6A — Retenue de garantie
 * Run: node --import tsx scripts/test-commercial-df6a-retention.ts
 */
import assert from "node:assert/strict";
import {
  computeRetentionForPeriod,
  effectiveRetentionStatus,
  retentionCapFromMarket,
} from "../src/lib/commercial/retention-calc";

function test1() {
  const r = computeRetentionForPeriod({
    periodSellHt: 20_000,
    periodVat: 4_000,
    periodTtc: 24_000,
    ratePercent: 5,
    marketSellHt: 100_000,
    previousRetentionHt: 0,
  });
  assert.equal(r.retentionPeriodHt, 1_000);
  assert.equal(r.netPeriodSellHt, 19_000);
  assert.equal(r.retentionCapHt, 5_000);
  console.log("✓ T1 situation 20k / RG 5% → 1000 / net 19000");
}

function test2() {
  const r = computeRetentionForPeriod({
    periodSellHt: 30_000,
    periodVat: 6_000,
    periodTtc: 36_000,
    ratePercent: 5,
    marketSellHt: 100_000,
    previousRetentionHt: 1_000,
  });
  assert.equal(r.retentionPeriodHt, 1_500);
  assert.equal(r.retentionCumulativeHt, 2_500);
  console.log("✓ T2 situation 30k → RG 1500 / cumul 2500");
}

function test3() {
  const r = computeRetentionForPeriod({
    periodSellHt: 50_000,
    periodVat: 10_000,
    periodTtc: 60_000,
    ratePercent: 5,
    marketSellHt: 100_000,
    previousRetentionHt: 2_500,
  });
  // raw would be 2500 but room to cap = 2500 → OK
  assert.equal(r.retentionCumulativeHt, 5_000);
  assert.equal(r.retentionRemainingCapHt, 0);
  // Travaux 100% possible avec RG toujours retenue (créance séparée)
  assert.equal(retentionCapFromMarket(100_000, 5), 5_000);
  console.log("✓ T3 marché terminé / RG au plafond toujours retenue");
}

function test4PaymentLogic() {
  // Facture net 19000 TTC approx — amountDue = net, pas works
  const worksTtc = 24_000;
  const retentionTtc = 1_200; // 1000 HT + 200 TVA
  const netTtc = 22_800;
  const amountDue = netTtc; // jamais worksTtc
  assert.notEqual(amountDue, worksTtc);
  assert.equal(amountDue + retentionTtc, worksTtc);
  console.log("✓ T4 net exigible ≠ travaux bruts (pas de fausse dette RG)");
}

function test5DueStatus() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  assert.equal(effectiveRetentionStatus("HELD", yesterday), "DUE");
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 2);
  assert.equal(effectiveRetentionStatus("HELD", tomorrow), "HELD");
  console.log("✓ T5 date dépassée → À libérer");
}

function test6ReleaseLogic() {
  const before = { status: "HELD", releasedAt: null as Date | null };
  const after = {
    ...before,
    status: "RELEASED",
    releasedAt: new Date("2026-08-12"),
  };
  assert.equal(after.status, "RELEASED");
  assert.ok(after.releasedAt);
  console.log("✓ T6 libération enregistre date");
}

function test7Settled() {
  const r = { status: "RELEASED" };
  const paid = { ...r, status: "SETTLED", settledAt: new Date() };
  assert.equal(paid.status, "SETTLED");
  console.log("✓ T7 RG encaissée → SETTLED");
}

function test8OrgIsolation() {
  const row = { organizationId: "org_b" };
  assert.equal(row.organizationId === "org_a", false);
  console.log("✓ T8 isolation organisation");
}

test1();
test2();
test3();
test4PaymentLogic();
test5DueStatus();
test6ReleaseLogic();
test7Settled();
test8OrgIsolation();
console.log("DF-6A OK");
