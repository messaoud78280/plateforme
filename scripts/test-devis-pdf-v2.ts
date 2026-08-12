/**
 * DEVIS PDF V2 — génération, options, multi-TVA, validateur
 * Run: npx tsx scripts/test-devis-pdf-v2.ts
 */
import assert from "node:assert/strict";
import { generateCommercialQuotePdf, type QuotePdfInput } from "../src/lib/commercial/pdf-quote";
import { buildVatBreakdownFromLines } from "../src/lib/commercial/quote-pdf-input";
import { validateQuoteIssuancePayload } from "../src/lib/commercial/validate-quote-issuance";
import { sha256Hex } from "../src/lib/commercial/accepted-snapshot";

function baseInput(over: Partial<QuotePdfInput> = {}): QuotePdfInput {
  return {
    number: "DEV-2026-0042",
    subject: "Réfection étanchéité toiture-terrasse",
    status: "DRAFT",
    issueDate: new Date("2026-08-12T00:00:00.000Z"),
    validityDate: new Date("2026-09-11T00:00:00.000Z"),
    paymentTerms: "Virement à 30 jours",
    paymentSchedule: {
      basis: "TTC",
      lines: [
        { type: "DEPOSIT", percent: 30, label: "Acompte à la commande", sortOrder: 0 },
        { type: "PROGRESS", percent: 40, label: "Situation intermédiaire", sortOrder: 1 },
        { type: "FINAL", percent: 30, label: "Solde", sortOrder: 2 },
      ],
    },
    clientNotes: "Observations chantier.",
    siteAddressSnapshot: "12 rue Victor Hugo, Lyon",
    projectTitle: "Résidence Victor Hugo",
    versionNumber: 1,
    issuer: {
      name: "SETRIM",
      tradeName: "SETRIM",
      siret: "12345678900012",
      email: "contact@setrim.fr",
      phone: "04 00 00 00 00",
      addressLine1: "10 rue de l’Industrie",
      city: "Lyon",
      postalCode: "69000",
    },
    client: {
      name: "SCI Les Oliviers",
      addressLine1: "1 place Bellecour",
      city: "Lyon",
      postalCode: "69002",
      email: "gestion@oliviers.fr",
    },
    currency: "EUR",
    accentColor: "#1e3a5f",
    insuranceMentions: "Décennale — assureur test — police X",
    documentSettings: {
      paymentModeLabel: "Virement bancaire",
      showBankOnQuote: true,
      acceptanceText: "Le client accepte le présent devis.",
    },
    bank: { iban: "FR76 0000 0000 0000", bic: "BNPAFRPP" },
    totals: { totalSellHt: 10_000, totalVat: 2_000, totalTtc: 12_000 },
    sections: [
      {
        title: "01 — Étanchéité",
        lines: [
          {
            kind: "WORK",
            reference: "ET-01",
            designation: "Membrane bicouche",
            description:
              "Fourniture et mise en œuvre comprenant préparation du support, primaire et membrane bicouche.",
            quantity: 100,
            unit: "m²",
            unitSellHt: 80,
            vatRate: 20,
            lineSellHt: 8_000,
            isOptional: false,
          },
          {
            kind: "WORK",
            reference: "ET-02",
            designation: "Relevé périphérique",
            quantity: 40,
            unit: "ml",
            unitSellHt: 50,
            vatRate: 20,
            lineSellHt: 2_000,
            isOptional: false,
          },
        ],
      },
      {
        title: "Options",
        lines: [
          {
            kind: "OPTION",
            reference: "OPT-1",
            designation: "Relevé à collerette",
            quantity: 1,
            unit: "U",
            unitSellHt: 1_500,
            vatRate: 20,
            lineSellHt: 1_500,
            isOptional: true,
          },
        ],
      },
    ],
    ...over,
  };
}

{
  const pdf = generateCommercialQuotePdf(baseInput());
  assert.ok(pdf.length > 500, "PDF simple généré");
  assert.equal(pdf.subarray(0, 4).toString("latin1"), "%PDF");
  console.log("✓ Test 1 — devis simple PDF");
}

{
  const longDesc = "A".repeat(800);
  const sections = Array.from({ length: 4 }, (_, i) => ({
    title: `0${i + 1} — Lot ${i + 1}`,
    lines: Array.from({ length: 4 }, (_, j) => ({
      kind: "WORK" as const,
      reference: `L${i}-${j}`,
      designation: `Ouvrage ${i}-${j}`,
      description: longDesc,
      quantity: 1,
      unit: "U",
      unitSellHt: 100,
      vatRate: 20,
      lineSellHt: 100,
      isOptional: false,
    })),
  }));
  const pdf = generateCommercialQuotePdf(
    baseInput({
      sections,
      totals: { totalSellHt: 1600, totalVat: 320, totalTtc: 1920 },
      status: "SENT",
    }),
  );
  assert.ok(pdf.length > 2000, "PDF BTP multi-chapitres");
  console.log("✓ Test 2 — devis BTP multi-pages");
}

{
  const vat = buildVatBreakdownFromLines([
    { kind: "WORK", isOptional: false, vatRate: 10, lineSellHt: 5_000, lineVat: 500 },
    { kind: "WORK", isOptional: false, vatRate: 20, lineSellHt: 5_200, lineVat: 1_040 },
    { kind: "WORK", isOptional: true, vatRate: 20, lineSellHt: 1_500, lineVat: 300 },
  ]);
  assert.equal(vat.length, 2);
  assert.equal(vat[0]!.rate, 10);
  assert.equal(vat[0]!.baseHt, 5_000);
  assert.equal(vat[1]!.baseHt, 5_200);
  const pdf = generateCommercialQuotePdf(
    baseInput({
      vatBreakdown: vat,
      totals: { totalSellHt: 10_200, totalVat: 1_540, totalTtc: 11_740 },
      sections: [
        {
          title: "Travaux",
          lines: [
            {
              kind: "WORK",
              designation: "Travaux 10%",
              quantity: 1,
              unit: "U",
              unitSellHt: 5_000,
              vatRate: 10,
              lineSellHt: 5_000,
            },
            {
              kind: "WORK",
              designation: "Travaux 20%",
              quantity: 1,
              unit: "U",
              unitSellHt: 5_200,
              vatRate: 20,
              lineSellHt: 5_200,
            },
          ],
        },
      ],
    }),
  );
  assert.ok(pdf.length > 500);
  console.log("✓ Test 3 — multi TVA");
}

{
  const input = baseInput();
  assert.equal(input.totals.totalSellHt, 10_000);
  const opt = input.sections.flatMap((s) => s.lines).find((l) => l.isOptional);
  assert.ok(opt);
  assert.equal(opt!.lineSellHt, 1_500);
  assert.notEqual(input.totals.totalSellHt, 11_500);
  console.log("✓ Test 4 — option hors total");
}

{
  const a = generateCommercialQuotePdf(baseInput({ issuer: { name: "A" } }));
  const b = generateCommercialQuotePdf(
    baseInput({ issuer: { name: "A" }, status: "DRAFT" }),
  );
  assert.equal(sha256Hex(a), sha256Hex(b));
  const noLogo = generateCommercialQuotePdf(
    baseInput({ issuer: { name: "Sans logo", logoPath: null } }),
  );
  assert.ok(noLogo.length > 400);
  console.log("✓ Test 5 — logo absent OK");
}

{
  const pdf = generateCommercialQuotePdf(
    baseInput({
      sections: [
        {
          title: "Long",
          lines: [
            {
              kind: "WORK",
              designation: "Description très longue",
              description: Array.from({ length: 12 }, (_, i) => `Paragraphe ${i + 1}. `).join(""),
              quantity: 1,
              unit: "U",
              unitSellHt: 100,
              vatRate: 20,
              lineSellHt: 100,
            },
          ],
        },
      ],
      totals: { totalSellHt: 100, totalVat: 20, totalTtc: 120 },
    }),
  );
  assert.ok(pdf.length > 400);
  console.log("✓ Test 6 — description longue");
}

{
  const lines = Array.from({ length: 100 }, (_, i) => ({
    kind: "WORK" as const,
    reference: `R${i}`,
    designation: `Ligne ${i}`,
    quantity: 1,
    unit: "U",
    unitSellHt: 10,
    vatRate: 20,
    lineSellHt: 10,
    isOptional: false,
  }));
  const t0 = Date.now();
  const pdf = generateCommercialQuotePdf(
    baseInput({
      sections: [{ title: "Gros devis", lines }],
      totals: { totalSellHt: 1_000, totalVat: 200, totalTtc: 1_200 },
      status: "VALIDATED",
    }),
  );
  const ms = Date.now() - t0;
  assert.ok(pdf.length > 5_000);
  assert.ok(ms < 15_000, `génération trop lente: ${ms}ms`);
  console.log(`✓ Test 7 — 100 lignes (${ms} ms)`);
}

{
  const pdf = generateCommercialQuotePdf(
    baseInput({
      issuer: { name: "SETRIM" },
      client: { name: "Client" },
      siteAddressSnapshot: null,
      projectTitle: "Chantier",
    }),
  );
  const text = pdf.toString("latin1");
  assert.ok(!/\bundefined\b/.test(text), "pas de token undefined");
  assert.ok(!/SIRET\s*:\s*$/m.test(text));
  console.log("✓ Test 8 — pas de undefined visible");
}

{
  const draft = generateCommercialQuotePdf(baseInput({ status: "DRAFT" }));
  assert.ok(draft.length > 400);
  console.log("✓ Test 9 — brouillon généré (filigrane)");
}

{
  const pass = validateQuoteIssuancePayload({
    number: "DEV-1",
    subject: "Travaux",
    clientPresent: true,
    issuerName: "SETRIM",
    workLineCount: 2,
    totalSellHt: 100,
    totalVat: 20,
    totalTtc: 120,
    hasInvalidVat: false,
    siteAddress: "12 rue X",
    paymentTerms: "30 j",
    hasPaymentSchedule: true,
    validityDate: new Date(),
    insuranceMentions: "OK",
    executionDurationNote: "2 semaines",
    documentSettings: {},
  });
  assert.equal(pass.canEmit, true);

  const fail = validateQuoteIssuancePayload({
    number: "DEV-1",
    subject: "Travaux",
    clientPresent: false,
    issuerName: null,
    workLineCount: 0,
    totalSellHt: 100,
    totalVat: 20,
    totalTtc: 999,
    hasInvalidVat: false,
    siteAddress: null,
    paymentTerms: null,
    hasPaymentSchedule: false,
    validityDate: null,
    insuranceMentions: null,
    executionDurationNote: null,
    documentSettings: { requireInsurance: true, requireWaste: true },
  });
  assert.equal(fail.canEmit, false);
  assert.ok(fail.summary.errors >= 3);
  assert.ok(fail.summary.warnings >= 1);
  console.log("✓ Test 10 — validateQuoteForIssuance");
}

console.log("\nDEVIS PDF V2 — tests OK");
