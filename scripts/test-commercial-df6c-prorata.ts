/**
 * DF-6C — Provision compte prorata
 * Run: node --import tsx scripts/test-commercial-df6c-prorata.ts
 */
import assert from "node:assert/strict";
import { computeProrataProvision } from "../src/lib/commercial/prorata-calc";
import { computeRetentionForPeriod } from "../src/lib/commercial/retention-calc";
import { computeDepositDeduction } from "../src/lib/commercial/deposit-calc";

function chain(opts: {
  worksHt: number;
  worksVat: number;
  worksTtc: number;
  rgRate: number;
  marketHt: number;
  previousRg: number;
  prorataRate: number;
  previousProrata: number;
  remainingDeposit: number;
}) {
  const r = computeRetentionForPeriod({
    periodSellHt: opts.worksHt,
    periodVat: opts.worksVat,
    periodTtc: opts.worksTtc,
    ratePercent: opts.rgRate,
    marketSellHt: opts.marketHt,
    previousRetentionHt: opts.previousRg,
  });
  const p = computeProrataProvision({
    enabled: opts.prorataRate > 0,
    ratePercent: opts.prorataRate,
    baseMode: "PERIOD_WORK_HT",
    periodSellHt: opts.worksHt,
    previousProrataHt: opts.previousProrata,
    netAfterRetentionSellHt: r.netPeriodSellHt,
    netAfterRetentionVat: r.netPeriodVat,
    netAfterRetentionTtc: r.netPeriodTtc,
  });
  const d = computeDepositDeduction({
    netPeriodSellHt: p.postProrataPeriodSellHt,
    netPeriodVat: p.postProrataPeriodVat,
    netPeriodTtc: p.postProrataPeriodTtc,
    remainingDepositHt: opts.remainingDeposit,
  });
  return { r, p, d };
}

function test1Situation1() {
  const { r, p, d } = chain({
    worksHt: 20_000,
    worksVat: 4_000,
    worksTtc: 24_000,
    rgRate: 5,
    marketHt: 100_000,
    previousRg: 0,
    prorataRate: 2,
    previousProrata: 0,
    remainingDeposit: 10_000,
  });
  assert.equal(r.retentionPeriodHt, 1_000);
  assert.equal(p.prorataPeriodHt, 400);
  assert.equal(p.prorataCumulativeHt, 400);
  // 20000 - 1000 - 400 - 10000 = 8600
  assert.equal(d.payablePeriodSellHt, 8_600);
  console.log("✓ T1 Sit1 : RG 1000 / prorata 400 / payable 8600");
}

function test2Situation2() {
  const { p } = chain({
    worksHt: 30_000,
    worksVat: 6_000,
    worksTtc: 36_000,
    rgRate: 5,
    marketHt: 100_000,
    previousRg: 1_000,
    prorataRate: 2,
    previousProrata: 400,
    remainingDeposit: 0,
  });
  assert.equal(p.prorataPeriodHt, 600);
  assert.equal(p.prorataCumulativeHt, 1_000);
  console.log("✓ T2 Sit2 : prorata 600 / cumul 1000 (Sit1 figée)");
}

function test3Zero() {
  const p = computeProrataProvision({
    enabled: false,
    ratePercent: 0,
    baseMode: "PERIOD_WORK_HT",
    periodSellHt: 20_000,
    previousProrataHt: 0,
    netAfterRetentionSellHt: 19_000,
    netAfterRetentionVat: 3_800,
    netAfterRetentionTtc: 22_800,
  });
  assert.equal(p.prorataPeriodHt, 0);
  assert.equal(p.postProrataPeriodSellHt, 19_000);
  console.log("✓ T3 prorata off → postProrata = net RG");
}

function test4NotDiscount() {
  // Travaux bruts restent 20000 ; prorata est provision séparée
  const works = 20_000;
  const { p } = chain({
    worksHt: works,
    worksVat: 4_000,
    worksTtc: 24_000,
    rgRate: 5,
    marketHt: 100_000,
    previousRg: 0,
    prorataRate: 2,
    previousProrata: 0,
    remainingDeposit: 0,
  });
  assert.equal(works, 20_000);
  assert.notEqual(p.postProrataPeriodSellHt, works);
  assert.equal(p.prorataBaseAmountHt, works);
  console.log("✓ T4 base = travaux bruts, pas une remise sur le marché");
}

function test5ExampleGoNet() {
  // Exemple GO sans acompte partiel forcé : acompte 5000
  const { d } = chain({
    worksHt: 20_000,
    worksVat: 4_000,
    worksTtc: 24_000,
    rgRate: 5,
    marketHt: 100_000,
    previousRg: 0,
    prorataRate: 2,
    previousProrata: 0,
    remainingDeposit: 5_000,
  });
  // 20000 - 1000 - 400 - 5000 = 13600
  assert.equal(d.payablePeriodSellHt, 13_600);
  console.log("✓ T5 exemple GO net 13 600 € HT");
}

test1Situation1();
test2Situation2();
test3Zero();
test4NotDiscount();
test5ExampleGoNet();
console.log("\nDF-6C OK");
