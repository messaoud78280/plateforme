/**
 * DF-1B — échéancier + PDF helpers
 * Run: node --import tsx scripts/test-commercial-df1b-payment-schedule.ts
 */
import assert from "node:assert/strict";
import {
  PAYMENT_SCHEDULE_PRESETS,
  computePaymentScheduleAmounts,
  normalizeScheduleForStorage,
  parsePaymentSchedule,
  scheduleFromDepositPercent,
  sumSchedulePercent,
  validatePaymentSchedule,
} from "../src/lib/commercial/payment-schedule";
import { buildQuotePdfInputFromVersion } from "../src/lib/commercial/quote-pdf-input";
import { generateCommercialQuotePdf } from "../src/lib/commercial/pdf-quote";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function testPresetsAndValidation() {
  const s = PAYMENT_SCHEDULE_PRESETS["30_40_30"];
  assert.equal(s.basis, "TTC");
  assert.equal(sumSchedulePercent(s.lines), 100);
  const v = validatePaymentSchedule(s, { finalizeStrict: true });
  assert.equal(v.ok, true);
  if (v.ok) assert.equal(v.level, "ok");

  const incomplete = {
    basis: "TTC" as const,
    lines: [
      { type: "DEPOSIT" as const, percent: 30, label: "Acompte", sortOrder: 0 },
    ],
  };
  const warn = validatePaymentSchedule(incomplete);
  assert.equal(warn.ok, true);
  if (warn.ok) assert.equal(warn.level, "warn");
  const strict = validatePaymentSchedule(incomplete, { finalizeStrict: true });
  assert.equal(strict.ok, false);

  const over = {
    basis: "TTC" as const,
    lines: [
      { type: "DEPOSIT" as const, percent: 60, label: "A", sortOrder: 0 },
      { type: "FINAL" as const, percent: 50, label: "B", sortOrder: 1 },
    ],
  };
  const bad = validatePaymentSchedule(over);
  assert.equal(bad.ok, false);
  console.log("✓ presets + validation");
}

function testAmountsNoFloatDrift() {
  const s = PAYMENT_SCHEDULE_PRESETS["30_40_30"];
  const amounts = computePaymentScheduleAmounts(s, 100_000);
  assert.equal(amounts[0].amountTtc, 30_000);
  assert.equal(amounts[1].amountTtc, 40_000);
  assert.equal(amounts[2].amountTtc, 30_000);
  const sum = amounts.reduce((a, b) => a + b.amountTtc, 0);
  assert.equal(sum, 100_000);

  // Rest adjustment on awkward total
  const awkward = computePaymentScheduleAmounts(s, 100.01);
  const sumCents = awkward.reduce((a, b) => a + Math.round(b.amountTtc * 100), 0);
  assert.equal(sumCents, 10001);
  console.log("✓ montants TTC (centimes)");
}

function testParseAndDepositInit() {
  const raw = {
    basis: "TTC",
    lines: [
      { type: "DEPOSIT", percent: 30, label: "Acompte à la commande", sortOrder: 0 },
      { type: "PROGRESS", percent: 40, label: "Situation", sortOrder: 1 },
      { type: "FINAL", percent: 30, label: "Solde", sortOrder: 2 },
    ],
  };
  const parsed = parsePaymentSchedule(raw);
  assert.ok(parsed);
  assert.equal(parsed!.lines[1].type, "PROGRESS");

  const fromDep = scheduleFromDepositPercent(30);
  assert.equal(fromDep.lines[0].type, "DEPOSIT");
  assert.equal(fromDep.lines[1].type, "FINAL");
  assert.equal(sumSchedulePercent(fromDep.lines), 100);

  assert.equal(normalizeScheduleForStorage({ basis: "TTC", lines: [] }), null);
  console.log("✓ parse + deposit init");
}

function testPdfIncludesScheduleAndBonPourAccord() {
  const schedule = PAYMENT_SCHEDULE_PRESETS["30_40_30"];
  const input = buildQuotePdfInputFromVersion({
    quote: {
      number: "DEV-2026-0042",
      subject: "Réfection étanchéité toiture-terrasse",
      status: "DRAFT",
      issueDate: new Date("2026-03-01"),
      validityDate: new Date("2026-04-01"),
      paymentTerms: "Règlement par virement.",
      paymentScheduleJson: schedule,
      clientNotes: "Accès chantier à confirmer",
      siteAddressSnapshot: "Versailles",
      projectTitle: "Résidence Les Jardins",
      currency: "EUR",
      issuerSnapshotJson: {
        name: "SETRIM",
        siret: "123",
        addressLine1: "1 rue Test",
        logoPath: "/brands/setrim/logo.jpg",
      },
      clientSnapshotJson: {
        name: "Syndic Horizon Copro",
        address: "10 av. République",
      },
    },
    version: {
      id: "v1",
      versionNumber: 2,
      clientSnapshotJson: null,
      issuerSnapshotJson: null,
      paymentTerms: null,
      paymentScheduleJson: schedule,
      clientNotes: null,
      totalSellHt: 83333.33,
      totalVat: 16666.67,
      totalTtc: 100000,
      sections: [{ id: "s1", title: "Étanchéité", sortOrder: 0 }],
      lines: [
        {
          sectionId: "s1",
          kind: "WORK",
          reference: "ET-01",
          designation: "Étanchéité bicouche",
          description: "Fourniture et mise en œuvre comprenant préparation du support",
          quantity: 1,
          unit: "m²",
          unitSellHt: 83333.33,
          vatRate: 20,
          lineSellHt: 83333.33,
          isOptional: false,
          sortOrder: 0,
        },
      ],
    },
    quoteMentions: "Devis valable 30 jours.",
    legalMentions: "Pénalités de retard selon taux légal.",
  });

  assert.equal(input.paymentSchedule?.lines.length, 3);
  assert.ok(input.sections[0].lines[0].description);

  const pdf = generateCommercialQuotePdf(input);
  assert.ok(pdf.length > 500);
  const latin = pdf.toString("latin1");
  assert.ok(latin.includes("Bon pour accord") || latin.includes("Bon pour"), "BPA manquant");
  assert.ok(latin.includes("Conditions de paiement") || latin.includes("Acompte"));
  console.log("✓ PDF échéancier + description + BPA + mentions");
}

function testHubFilesExist() {
  const root = process.cwd();
  for (const f of [
    "src/lib/commercial/payment-schedule.ts",
    "src/components/commercial/QuotePaymentScheduleBlock.tsx",
    "src/components/commercial/QuoteEditor.tsx",
    "prisma/migrations/add-commercial-payment-schedule-df1b.sql",
  ]) {
    assert.ok(readFileSync(join(root, f), "utf8").length > 50, f);
  }
  const editor = readFileSync(join(root, "src/components/commercial/QuoteEditor.tsx"), "utf8");
  assert.match(editor, /QuotePaymentScheduleBlock/);
  assert.match(editor, /Analyse marge/);
  assert.match(editor, /Bon pour accord/);
  assert.doesNotMatch(editor, /window\.location\.reload/);
  console.log("✓ fichiers DF-1B présents");
}

testPresetsAndValidation();
testAmountsNoFloatDrift();
testParseAndDepositInit();
testPdfIncludesScheduleAndBonPourAccord();
testHubFilesExist();
console.log("\n✅ test-commercial-df1b-payment-schedule OK");
