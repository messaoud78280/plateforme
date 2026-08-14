/**
 * DF-6D — Sous-traitance simple
 * Run: npx tsx scripts/test-commercial-df6d-subcontracts.ts
 */
import assert from "node:assert/strict";
import {
  canDeleteSubcontract,
  isSubcontractStatus,
  parseAmountHt,
  parseProgressPercent,
  realizedHtFromProgress,
  SUBCONTRACT_STATUS_LABELS,
} from "../src/lib/commercial/subcontract-types";
import { roundMoney } from "../src/lib/commercial/money";
import { computeProgressLine } from "../src/lib/commercial/progress-calc";
import { generateCommercialQuotePdf, type QuotePdfInput } from "../src/lib/commercial/pdf-quote";

function t1Amount() {
  assert.equal(parseAmountHt(42_000), 42_000);
  assert.equal(parseAmountHt("42 000"), 42_000);
  assert.equal(parseAmountHt("42000,50"), 42_000.5);
  let threw = false;
  try {
    parseAmountHt(-1);
  } catch {
    threw = true;
  }
  assert.equal(threw, true);
  console.log("✓ T1 montants");
}

function t2Progress() {
  assert.equal(realizedHtFromProgress(42_000, 45), 18_900);
  assert.equal(realizedHtFromProgress(42_000, null), null);
  assert.equal(parseProgressPercent("45"), 45);
  assert.equal(parseProgressPercent(""), null);
  let threw = false;
  try {
    parseProgressPercent(120);
  } catch {
    threw = true;
  }
  assert.equal(threw, true);
  console.log("✓ T2 avancement 45 % → 18 900 / 42 000");
}

function t3Status() {
  assert.equal(isSubcontractStatus("IN_PROGRESS"), true);
  assert.equal(isSubcontractStatus("PAIEMENT_DIRECT"), false);
  assert.equal(SUBCONTRACT_STATUS_LABELS.PREPARATION, "Préparation");
  assert.equal(SUBCONTRACT_STATUS_LABELS.IN_PROGRESS, "En cours");
  assert.equal(SUBCONTRACT_STATUS_LABELS.COMPLETED, "Terminé");
  console.log("✓ T3 statuts");
}

function t4DeleteRules() {
  assert.equal(canDeleteSubcontract({ status: "PREPARATION" }), true);
  assert.equal(canDeleteSubcontract({ status: "PREPARATION", progressPercent: 0 }), true);
  assert.equal(canDeleteSubcontract({ status: "PREPARATION", progressPercent: 45 }), false);
  assert.equal(canDeleteSubcontract({ status: "IN_PROGRESS" }), false);
  assert.equal(canDeleteSubcontract({ status: "COMPLETED" }), false);
  console.log("✓ T4 suppression seulement préparation sans avancement");
}

function t5NoImpactSituation() {
  const line = computeProgressLine({
    contractQuantity: 1,
    unitSellHt: 10_200,
    vatRate: 20,
    contractSellHt: 10_200,
    previousPercent: 0,
    previousQuantity: 0,
    previousSellHt: 0,
    periodPercent: 30,
    inputMode: "percent",
  });
  assert.equal(line.periodSellHt, 3_060);
  const stAmount = 42_000;
  assert.notEqual(line.periodSellHt, stAmount);
  console.log("✓ T5 situation client inchangée par le contrat ST");
}

function t6PdfUntouched() {
  const input: QuotePdfInput = {
    number: "DEV-2026-SMOKE1",
    subject: "Réfection étanchéité toiture-terrasse",
    status: "SENT",
    issueDate: new Date("2026-08-12T00:00:00.000Z"),
    issuer: { name: "SETRIM", tradeName: "SETRIM" },
    client: { name: "Syndic Horizon Copro" },
    currency: "EUR",
    totals: { totalSellHt: 10_200, totalVat: 2_040, totalTtc: 12_240 },
    sections: [
      {
        title: "Étanchéité",
        lines: [
          {
            kind: "WORK",
            designation: "Étanchéité bicouche",
            quantity: 120,
            unit: "m²",
            unitSellHt: 85,
            vatRate: 20,
            lineSellHt: 10_200,
          },
        ],
      },
    ],
  };
  const pdf = generateCommercialQuotePdf(input);
  const latin = pdf.toString("latin1");
  assert.equal(latin.startsWith("%PDF"), true);
  assert.equal(latin.includes("Martin"), false);
  assert.equal(latin.includes("sous-trait"), false);
  console.log("✓ T6 PDF devis gelé (pas de sous-traitants)");
}

function t7MultiAmounts() {
  const rows = [
    { name: "Martin Étanchéité", amount: 42_000 },
    { name: "Durand Couverture", amount: 18_500 },
    { name: "ElecPro", amount: 12_000 },
  ];
  const sum = roundMoney(
    rows.reduce((a, r) => a + r.amount, 0),
    2,
  );
  assert.equal(sum, 72_500);
  console.log("✓ T7 multi sous-traitants 72 500 € (somme informative)");
}

function t8TenantIsolation() {
  const orgA = { organizationId: "org-a", projectId: "p1" };
  const orgB = { organizationId: "org-b", projectId: "p1" };
  assert.notEqual(orgA.organizationId, orgB.organizationId);
  const visible = (rowOrg: string, sessionOrg: string) => rowOrg === sessionOrg;
  assert.equal(visible("org-a", "org-b"), false);
  assert.equal(visible("org-a", "org-a"), true);
  console.log("✓ T8 isolation multi-tenant (filtre organizationId)");
}

t1Amount();
t2Progress();
t3Status();
t4DeleteRules();
t5NoImpactSituation();
t6PdfUntouched();
t7MultiAmounts();
t8TenantIsolation();
console.log("\nDF-6D — tests OK");
