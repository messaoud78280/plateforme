/**
 * DF-3 — acompte depuis échéancier + PDF facture
 * Run: node --import tsx scripts/test-commercial-df3-invoice.ts
 */
import assert from "node:assert/strict";
import {
  firstScheduleLineOfType,
  PAYMENT_SCHEDULE_PRESETS,
} from "../src/lib/commercial/payment-schedule";
import { resolveDepositTerms } from "../src/lib/commercial/invoices";
import { depositAmountFromPercent, roundMoney } from "../src/lib/commercial/money";
import { generateCommercialInvoicePdf } from "../src/lib/commercial/pdf-invoice";

function testResolveDepositFromSchedule() {
  const schedule = PAYMENT_SCHEDULE_PRESETS["30_40_30"];
  const terms = resolveDepositTerms({
    paymentScheduleJson: schedule,
    depositPercent: 15,
  });
  assert.equal(terms.source, "schedule");
  assert.equal(terms.percent, 30);
  assert.ok(terms.label.toLowerCase().includes("acompte"));
  console.log("✓ acompte depuis échéancier DEPOSIT");
}

function testResolveDepositFallback() {
  const termsPct = resolveDepositTerms({
    paymentScheduleJson: null,
    depositPercent: 40,
  });
  assert.equal(termsPct.source, "depositPercent");
  assert.equal(termsPct.percent, 40);

  const termsDefault = resolveDepositTerms({
    paymentScheduleJson: null,
    depositPercent: null,
  });
  assert.equal(termsDefault.source, "default");
  assert.equal(termsDefault.percent, 30);
  console.log("✓ fallback depositPercent / 30 %");
}

function testProgressLine() {
  const line = firstScheduleLineOfType(
    PAYMENT_SCHEDULE_PRESETS["30_40_30"],
    "PROGRESS",
  );
  assert.ok(line);
  assert.equal(line!.percent, 40);
  const ht = depositAmountFromPercent(10_200, 40);
  assert.equal(ht, 4_080);
  console.log("✓ ligne PROGRESS échéancier");
}

function testInvoicePdf() {
  const buf = generateCommercialInvoicePdf({
    number: "FAC-2026-0001",
    subject: "Acompte — DEV-2026-SMOKE1",
    status: "DRAFT",
    type: "DEPOSIT",
    issueDate: new Date("2026-08-12T12:00:00Z"),
    dueDate: new Date("2026-09-12T12:00:00Z"),
    quoteNumber: "DEV-2026-SMOKE1",
    issuer: {
      name: "SETRIM",
      logoPath: "/brands/setrim/logo.jpg",
      city: "Paris",
      postalCode: "75000",
    },
    client: { name: "Syndic Horizon Copro", city: "Lyon" },
    currency: "EUR",
    depositPercent: 30,
    bankIban: "FR76 0000 0000 0000 0000 0000 000",
    bankBic: "ABCDEFGH",
    invoiceMentions: "Paiement par virement.",
    totals: {
      totalSellHt: 3060,
      totalVat: 612,
      totalTtc: 3672,
      amountPaid: 0,
      amountDue: 3672,
    },
    lines: [
      {
        designation: "Acompte à la commande (30 %) — devis DEV-2026-SMOKE1",
        quantity: 1,
        unit: "U",
        unitSellHt: 3060,
        vatRate: 20,
        lineSellHt: 3060,
      },
    ],
  });
  assert.ok(buf.length > 500);
  assert.equal(buf.subarray(0, 4).toString("latin1"), "%PDF");
  const marketHt = 10_200;
  const depositHt = depositAmountFromPercent(marketHt, 30);
  assert.equal(depositHt, 3_060);
  assert.equal(roundMoney(depositHt * 1.2, 2), 3_672);
  console.log("✓ PDF facture généré");
}

testResolveDepositFromSchedule();
testResolveDepositFallback();
testProgressLine();
testInvoicePdf();
console.log("DF-3 OK");
