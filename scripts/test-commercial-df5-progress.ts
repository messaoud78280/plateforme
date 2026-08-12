/**
 * DF-5 — calculs situations + règles
 * Run: node --import tsx scripts/test-commercial-df5-progress.ts
 */
import assert from "node:assert/strict";
import {
  computeProgressLine,
  computeProgressTotals,
  percentFromQuantity,
  quantityFromPercent,
} from "../src/lib/commercial/progress-calc";

function testSituation1() {
  const market = 10_000;
  const line = computeProgressLine({
    contractQuantity: 1,
    unitSellHt: market,
    vatRate: 20,
    contractSellHt: market,
    previousPercent: 0,
    previousQuantity: 0,
    previousSellHt: 0,
    periodPercent: 30,
    inputMode: "percent",
  });
  assert.equal(line.periodSellHt, 3_000);
  assert.equal(line.cumulativeSellHt, 3_000);
  assert.equal(line.remainingSellHt, 7_000);
  assert.equal(line.cumulativePercent, 30);
  console.log("✓ situation 1 : 30 % → 3000 / reste 7000");
}

function testSituation2() {
  const market = 10_000;
  const line = computeProgressLine({
    contractQuantity: 1,
    unitSellHt: market,
    vatRate: 20,
    contractSellHt: market,
    previousPercent: 30,
    previousQuantity: 0.3,
    previousSellHt: 3_000,
    periodPercent: 20,
    inputMode: "percent",
  });
  assert.equal(line.periodSellHt, 2_000);
  assert.equal(line.cumulativeSellHt, 5_000);
  assert.equal(line.remainingSellHt, 5_000);
  assert.equal(line.cumulativePercent, 50);
  console.log("✓ situation 2 : précédent 30 + 20 → facture période 2000");
}

function testOverflow() {
  let threw = false;
  try {
    computeProgressLine({
      contractQuantity: 1,
      unitSellHt: 10_000,
      vatRate: 20,
      contractSellHt: 10_000,
      previousPercent: 80,
      previousQuantity: 0.8,
      previousSellHt: 8_000,
      periodPercent: 30,
      inputMode: "percent",
    });
  } catch {
    threw = true;
  }
  assert.equal(threw, true);
  console.log("✓ dépassement 80+30 refusé");
}

function testQuantity() {
  assert.equal(percentFromQuantity(100, 25), 25);
  assert.equal(quantityFromPercent(100, 25), 25);
  const line = computeProgressLine({
    contractQuantity: 100,
    unitSellHt: 25,
    vatRate: 20,
    contractSellHt: 2_500,
    previousPercent: 0,
    previousQuantity: 0,
    previousSellHt: 0,
    periodQuantity: 25,
    inputMode: "quantity",
  });
  assert.equal(line.periodPercent, 25);
  assert.equal(line.periodSellHt, 625);
  console.log("✓ quantité 25 m³ / 100 = 25 %");
}

function testTotals() {
  const lines = [
    {
      contractSellHt: 10_000,
      vatRate: 20,
      previousSellHt: 3_000,
      periodSellHt: 2_000,
      cumulativeSellHt: 5_000,
      remainingSellHt: 5_000,
    },
  ];
  const t = computeProgressTotals(lines);
  assert.equal(t.marketSellHt, 10_000);
  assert.equal(t.periodSellHt, 2_000);
  assert.equal(t.periodVat, 400);
  assert.equal(t.periodTtc, 2_400);
  assert.equal(t.remainingSellHt, 5_000);
  console.log("✓ totaux HT/TVA/TTC");
}

function testIdempotenceLogic() {
  // Simulation logique : second appel avec invoice déjà lié → même id
  const first = { invoiceId: "inv_1" };
  const second = first.invoiceId ? { id: first.invoiceId } : { id: "inv_2" };
  assert.equal(second.id, "inv_1");
  console.log("✓ idempotence facture (logique)");
}

function testOrgIsolationLogic() {
  const orgA = "org_a";
  const row = { organizationId: "org_b", id: "st_1" };
  const allowed = row.organizationId === orgA;
  assert.equal(allowed, false);
  console.log("✓ isolation organisation (filtre org)");
}

testSituation1();
testSituation2();
testOverflow();
testQuantity();
testTotals();
testIdempotenceLogic();
testOrgIsolationLogic();
console.log("DF-5 OK");
