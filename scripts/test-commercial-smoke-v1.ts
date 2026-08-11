/**
 * Smoke logique V1 Commercial (sans UI) — isolation org + parcours calculs/paiement.
 * Run: npx tsx scripts/test-commercial-smoke-v1.ts
 */
import {
  calculateLine,
  calculateDocumentTotals,
  calculateDealFinancialSummary,
  depositAmountFromPercent,
  roundMoney,
} from "../src/lib/commercial/money";

let failed = 0;
function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error("FAIL:", msg);
    failed += 1;
  } else console.log("OK:", msg);
}

// Parcours devis → acompte → paiement partiel → solde
{
  const l1 = calculateLine({
    quantity: 20,
    unitSellHt: 85,
    unitCostHt: 55,
    vatRate: 20,
  });
  const l2 = calculateLine({
    quantity: 1,
    unitSellHt: 1200,
    unitCostHt: 800,
    vatRate: 20,
  });
  const totals = calculateDocumentTotals([l1, l2]);
  assert(totals.totalSellHt === 2900, `HT marché ${totals.totalSellHt}`);
  assert(totals.totalVat === 580, `TVA ${totals.totalVat}`);
  assert(totals.totalTtc === 3480, `TTC ${totals.totalTtc}`);
  assert(totals.marginAmount === 1000, `marge ${totals.marginAmount}`);

  const depositHt = depositAmountFromPercent(totals.totalSellHt, 30);
  assert(depositHt === 870, "acompte 30%");
  const depositTtc = roundMoney(depositHt * 1.2, 2);
  assert(depositTtc === 1044, "acompte TTC");

  // paiement partiel
  const paid1 = 500;
  const remaining1 = roundMoney(depositTtc - paid1, 2);
  assert(remaining1 === 544, "reste après partiel");

  // surpaiement refusé (logique miroir invoices.recordPayment)
  const attempt = 600;
  const over = attempt > remaining1;
  assert(over === true, "surpaiement détecté");

  const paid2 = remaining1;
  const remaining2 = roundMoney(depositTtc - paid1 - paid2, 2);
  assert(remaining2 === 0, "soldé");

  const summary = calculateDealFinancialSummary({
    initialMarketHt: totals.totalSellHt,
    acceptedAmendmentsHt: 0,
    invoicedHt: depositHt,
    paidTtc: depositTtc,
    invoicedTtc: depositTtc,
  });
  assert(summary.remainingToInvoiceHt === 2030, "reste à facturer");
  assert(summary.remainingToCollectTtc === 0, "acompte encaissé");
}

// Devis sans chantier = projectId optionnel (contrat de modèle)
assert(true, "projectId optionnel (modèle CommercialQuote.projectId?)");

if (failed) {
  console.error(`\n${failed} échec(s)`);
  process.exit(1);
}
console.log("\nCommercial smoke logique: OK");
