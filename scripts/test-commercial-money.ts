/**
 * Moteur financier Commercial* — tests purs.
 * Run: npx tsx scripts/test-commercial-money.ts
 */
import {
  calculateLine,
  calculateDocumentTotals,
  calculateDealFinancialSummary,
  calculateWorkItemUnitCost,
  depositAmountFromPercent,
  sellFromCostAndMarginPercent,
  marginPercentFromCostSell,
  roundMoney,
} from "../src/lib/commercial/money";

let failed = 0;
function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error("FAIL:", msg);
    failed += 1;
  } else console.log("OK:", msg);
}

{
  const l = calculateLine({
    quantity: 10,
    unitSellHt: 100,
    unitCostHt: 60,
    discountPercent: 0,
    vatRate: 20,
  });
  assert(l.lineSellHt === 1000, "qty×prix HT");
  assert(l.lineVat === 200, "TVA 20%");
  assert(l.lineTtc === 1200, "TTC");
  assert(l.lineCostHt === 600, "déboursé");
  assert(l.marginAmount === 400, "marge ligne");
}

{
  const l = calculateLine({
    quantity: 2,
    unitSellHt: 100,
    discountPercent: 10,
    vatRate: 20,
  });
  assert(l.lineSellHt === 180, "remise 10%");
}

{
  const totals = calculateDocumentTotals([
    calculateLine({ quantity: 1, unitSellHt: 100, unitCostHt: 40, vatRate: 20 }),
    calculateLine({
      quantity: 1,
      unitSellHt: 50,
      unitCostHt: 0,
      vatRate: 20,
      isOptional: true,
    }),
  ]);
  assert(totals.totalSellHt === 100, "option exclue des totaux");
  assert(totals.totalVat === 20, "TVA doc");
  assert(totals.marginPercent === 60, "marge %");
}

{
  assert(depositAmountFromPercent(50000, 30) === 15000, "acompte 30%");
}

{
  const s = calculateDealFinancialSummary({
    initialMarketHt: 82500,
    acceptedAmendmentsHt: 6800 - 1250,
    invoicedHt: 20000,
    paidTtc: 10000,
    invoicedTtc: 24000,
  });
  assert(s.updatedMarketHt === 88050, "marché actualisé");
  assert(s.remainingToInvoiceHt === 68050, "reste facturer");
  assert(s.remainingToCollectTtc === 14000, "reste encaisser");
}

{
  const cost = calculateWorkItemUnitCost([
    { type: "MATERIAL", quantityPerUnit: 12.5, unitCostHt: 2 },
    { type: "LABOR", quantityPerUnit: 0.72, unitCostHt: 35 },
  ]);
  assert(roundMoney(cost, 2) === 50.2, "ouvrage composé");
  const sell = sellFromCostAndMarginPercent(50.2, 25);
  assert(sell > 50.2, "PV > coût");
  assert(marginPercentFromCostSell(50.2, sell) >= 24.9, "marge cible ~25%");
}

{
  const neg = calculateDealFinancialSummary({
    initialMarketHt: 10000,
    acceptedAmendmentsHt: -1500,
    invoicedHt: 0,
    paidTtc: 0,
    invoicedTtc: 0,
  });
  assert(neg.updatedMarketHt === 8500, "avenant négatif");
}

// Arrondis half-up
{
  assert(roundMoney(1.005, 2) === 1.01, "arrondi 1.005 → 1.01");
  assert(roundMoney(1.004, 2) === 1, "arrondi 1.004 → 1.00");
  const l = calculateLine({ quantity: 3, unitSellHt: 10, vatRate: 20 });
  assert(l.lineSellHt === 30 && l.lineVat === 6 && l.lineTtc === 36, "totaux exacts");
}

if (failed) {
  console.error(`\n${failed} échec(s)`);
  process.exit(1);
}
console.log("\nCommercial money: OK");
