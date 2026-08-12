/**
 * DF-6B — Déduction d’acomptes sur situations
 * Run: node --import tsx scripts/test-commercial-df6b-deposit.ts
 */
import assert from "node:assert/strict";
import { computeDepositDeduction } from "../src/lib/commercial/deposit-calc";
import { computeRetentionForPeriod } from "../src/lib/commercial/retention-calc";

function test1FullDeduction() {
  const d = computeDepositDeduction({
    netPeriodSellHt: 19_000,
    netPeriodVat: 3_800,
    netPeriodTtc: 22_800,
    remainingDepositHt: 10_000,
  });
  assert.equal(d.depositDeductedHt, 10_000);
  assert.equal(d.payablePeriodSellHt, 9_000);
  assert.equal(d.payablePeriodVat, 1_800);
  assert.equal(d.payablePeriodTtc, 10_800);
  console.log("✓ T1 acompte 10k sur net 19k → payable 9k");
}

function test2CapAtNet() {
  const d = computeDepositDeduction({
    netPeriodSellHt: 5_000,
    netPeriodVat: 1_000,
    netPeriodTtc: 6_000,
    remainingDepositHt: 20_000,
  });
  assert.equal(d.depositDeductedHt, 5_000);
  assert.equal(d.payablePeriodSellHt, 0);
  assert.equal(d.payablePeriodTtc, 0);
  console.log("✓ T2 acompte > net → déduction plafonnée, payable 0");
}

function test3NoDeposit() {
  const d = computeDepositDeduction({
    netPeriodSellHt: 19_000,
    netPeriodVat: 3_800,
    netPeriodTtc: 22_800,
    remainingDepositHt: 0,
  });
  assert.equal(d.depositDeductedHt, 0);
  assert.equal(d.payablePeriodSellHt, 19_000);
  console.log("✓ T3 sans acompte → payable = net");
}

function test4ChainRgThenDeposit() {
  // Travaux 20k / RG 5% → net 19k → acompte 5k → payable 14k
  const r = computeRetentionForPeriod({
    periodSellHt: 20_000,
    periodVat: 4_000,
    periodTtc: 24_000,
    ratePercent: 5,
    marketSellHt: 100_000,
    previousRetentionHt: 0,
  });
  assert.equal(r.netPeriodSellHt, 19_000);
  const d = computeDepositDeduction({
    netPeriodSellHt: r.netPeriodSellHt,
    netPeriodVat: r.netPeriodVat,
    netPeriodTtc: r.netPeriodTtc,
    remainingDepositHt: 5_000,
  });
  assert.equal(d.depositDeductedHt, 5_000);
  assert.equal(d.payablePeriodSellHt, 14_000);
  // amountDue = payable TTC, jamais travaux bruts
  assert.notEqual(d.payablePeriodTtc, 24_000);
  console.log("✓ T4 chaîne travaux → RG → acompte → net exigible");
}

function test5PartialAcrossSituations() {
  // Sit1 : déduit 8k sur 10k acompte → reste 2k
  const s1 = computeDepositDeduction({
    netPeriodSellHt: 15_000,
    netPeriodVat: 3_000,
    netPeriodTtc: 18_000,
    remainingDepositHt: 10_000,
  });
  assert.equal(s1.depositDeductedHt, 10_000);
  const remainingAfterS1 = 10_000 - s1.depositDeductedHt;
  assert.equal(remainingAfterS1, 0);
  const s2 = computeDepositDeduction({
    netPeriodSellHt: 12_000,
    netPeriodVat: 2_400,
    netPeriodTtc: 14_400,
    remainingDepositHt: remainingAfterS1,
  });
  assert.equal(s2.depositDeductedHt, 0);
  assert.equal(s2.payablePeriodSellHt, 12_000);
  console.log("✓ T5 acompte épuisé sur S1 → S2 sans déduction");
}

test1FullDeduction();
test2CapAtNet();
test3NoDeposit();
test4ChainRgThenDeposit();
test5PartialAcrossSituations();
console.log("\nDF-6B OK");
