/**
 * GESTION-COMMERCIALE-V1C-B — avenants → facturation.
 * Run: npx tsx scripts/test-gestion-commerciale-v1c-b.ts
 */
import {
  calculateAmendmentBillingProgress,
  calculateDealFinancialSummary,
  invoiceContributionHtToAmendment,
} from "../src/lib/commercial/money";

let failed = 0;
function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error("FAIL:", msg);
    failed += 1;
  } else {
    console.log("OK:", msg);
  }
}

{
  const s = calculateDealFinancialSummary({
    initialMarketHt: 48500,
    acceptedAmendmentsHt: 0,
    invoicedHt: 0,
    paidTtc: 0,
    invoicedTtc: 0,
  });
  assert(s.updatedMarketHt === 48500, "Test 1 — contrat sans avenant = 48500");
}

{
  const draftIgnored = calculateDealFinancialSummary({
    initialMarketHt: 48500,
    acceptedAmendmentsHt: 0,
    invoicedHt: 0,
    paidTtc: 0,
    invoicedTtc: 0,
  });
  assert(draftIgnored.updatedMarketHt === 48500, "Test 2 — DRAFT n’entre pas dans contrat");
}

{
  const s = calculateDealFinancialSummary({
    initialMarketHt: 48500,
    acceptedAmendmentsHt: 3200,
    invoicedHt: 0,
    paidTtc: 0,
    invoicedTtc: 0,
  });
  assert(s.updatedMarketHt === 51700, "Test 3 — contrat = 51700 après avenant accepté");
}

{
  const s = calculateDealFinancialSummary({
    initialMarketHt: 48500,
    acceptedAmendmentsHt: 3200,
    invoicedHt: 0,
    paidTtc: 0,
    invoicedTtc: 0,
  });
  assert(s.updatedMarketHt === 51700, "Test 4 — SENT 1450 n’augmente pas le contrat");
  assert(1450 !== s.acceptedAmendmentsHt, "Test 4 — pending distinct");
}

{
  const p = calculateAmendmentBillingProgress({
    amendmentStatus: "ACCEPTED",
    acceptedAmountHt: 3200,
    invoices: [{ type: "STANDARD", status: "ISSUED", totalSellHt: 2000 }],
  });
  assert(p.invoicedAmountHt === 2000, "Test 5 — facturé avenant = 2000");
  assert(p.remainingToInvoiceHt === 1200, "Test 5 — reste = 1200");
  assert(p.isBillable === true, "Test 5 — encore facturable");
}

{
  const p = calculateAmendmentBillingProgress({
    amendmentStatus: "ACCEPTED",
    acceptedAmountHt: 3200,
    invoices: [
      { type: "STANDARD", status: "ISSUED", totalSellHt: 2000 },
      { type: "STANDARD", status: "ISSUED", totalSellHt: 1200 },
    ],
  });
  assert(p.remainingToInvoiceHt === 0, "Test 6 — reste = 0");
  assert(p.isFullyInvoiced === true, "Test 6 — soldé");
  assert(p.isBillable === false, "Test 6 — plus proposé à facturer");
}

{
  const p = calculateAmendmentBillingProgress({
    amendmentStatus: "ACCEPTED",
    acceptedAmountHt: 3200,
    invoices: [
      { type: "STANDARD", status: "ISSUED", totalSellHt: 3200 },
      { type: "CREDIT", status: "ISSUED", totalSellHt: 500 },
    ],
  });
  assert(p.invoicedAmountHt === 2700, "Test 7 — avoir 500 réduit le facturé");
  assert(p.remainingToInvoiceHt === 500, "Test 7 — reste après avoir");
  assert(
    invoiceContributionHtToAmendment({
      type: "CREDIT",
      status: "ISSUED",
      totalSellHt: 500,
    }) === -500,
    "CREDIT contribution négative",
  );
}

{
  const p = calculateAmendmentBillingProgress({
    amendmentStatus: "REFUSED",
    acceptedAmountHt: 3200,
    invoices: [],
  });
  assert(p.remainingToInvoiceHt === 0, "Test 8 — REFUSED non facturable");
  assert(p.isBillable === false, "Test 8 — pas billable");
}

{
  const cancelled = invoiceContributionHtToAmendment({
    type: "STANDARD",
    status: "CANCELLED",
    totalSellHt: 999,
  });
  assert(cancelled === 0, "Facture annulée n’impacte pas");
  const draft = invoiceContributionHtToAmendment({
    type: "STANDARD",
    status: "DRAFT",
    totalSellHt: 999,
  });
  assert(draft === 0, "Brouillon n’impacte pas");
}

{
  const p = calculateAmendmentBillingProgress({
    amendmentStatus: "SENT",
    acceptedAmountHt: 1450,
    invoices: [],
  });
  assert(p.isBillable === false, "SENT pending — pas facturable comme accepté");
}

{
  const p = calculateAmendmentBillingProgress({
    amendmentStatus: "TO_VALIDATE",
    acceptedAmountHt: 1450,
    invoices: [],
  });
  assert(p.isBillable === false, "TO_VALIDATE — pas facturable");
  assert(p.remainingToInvoiceHt === 0, "TO_VALIDATE — reste 0");
  const s = calculateDealFinancialSummary({
    initialMarketHt: 48500,
    acceptedAmendmentsHt: 3200,
    invoicedHt: 0,
    paidTtc: 0,
    invoicedTtc: 0,
  });
  assert(s.updatedMarketHt === 51700, "TO_VALIDATE n’entre pas dans contrat (51 700)");
}

console.log(failed === 0 ? "\nALL PASSED" : `\n${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);
