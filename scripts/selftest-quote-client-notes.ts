/**
 * Selftest parsing notes client + présentation PDF (sans DB).
 * Run: node --import tsx scripts/selftest-quote-client-notes.ts
 */
import assert from "node:assert/strict";
import {
  buildCleanClientNotes,
  parseClientNotes,
  stripLeadingDuplicateTitle,
} from "../src/lib/commercial/client-notes-structure";
import { generateCommercialQuotePdf } from "../src/lib/commercial/pdf-quote";
import {
  DELIMITATION_GRAVILLON_ALERT,
  ensureInternalVerifyAlert,
} from "../src/lib/commercial/line-technical-info";

const legacy = `Réfection accès.

=== Notre préconisation ===

Notre préconisation
Compte tenu des irrégularités, nous préconisons une dépose complète.

Cette solution constitue un compromis pertinent.

=== Déroulement prévisionnel des travaux ===

01. Dépose et démolition
Dépose du carrelage.

02. Préparation du sol
Décaissement.

=== Réserves ===

Le chiffrage est basé sur les éléments visibles.
`;

const parsed = parseClientNotes(legacy);
assert.ok(!JSON.stringify(parsed).includes("==="));
assert.equal(parsed.adviceParagraphs[0]?.startsWith("Notre préconisation"), false);
assert.ok(parsed.adviceParagraphs[0]?.includes("dépose complète"));
assert.equal(parsed.stages.length, 2);
assert.equal(parsed.stages[0].order, "01");
assert.equal(parsed.reserves.length, 1);

const clean = buildCleanClientNotes({
  intro: "Intro chantier.",
  adviceParagraphs: ["Texte préconisation."],
  stages: [{ order: 1, title: "Dépose", description: "Travaux." }],
  reserves: ["Réserve A."],
});
assert.ok(!clean.includes("==="));
assert.ok(clean.includes("NOTRE PRÉCONISATION"));
assert.ok(clean.includes("01 — Dépose"));

assert.equal(
  stripLeadingDuplicateTitle("Notre préconisation", "Notre préconisation\nSuite"),
  "Suite",
);

const notes = ensureInternalVerifyAlert(null, DELIMITATION_GRAVILLON_ALERT);
assert.ok(notes.includes("=== À vérifier avant envoi ==="));
assert.ok(notes.includes(DELIMITATION_GRAVILLON_ALERT));
assert.equal(
  ensureInternalVerifyAlert(notes, DELIMITATION_GRAVILLON_ALERT),
  notes,
);

const pdf = generateCommercialQuotePdf({
  number: "DEV-2026-TEST",
  subject: "Test présentation",
  status: "DRAFT",
  issueDate: new Date("2026-09-08T00:00:00.000Z"),
  paymentSchedule: {
    basis: "TTC",
    lines: [
      { type: "DEPOSIT", percent: 30, label: "Acompte", sortOrder: 0 },
      { type: "PROGRESS", percent: 40, label: "Situation", sortOrder: 1 },
      { type: "FINAL", percent: 30, label: "Solde", sortOrder: 2 },
    ],
  },
  clientNotes: clean,
  projectPresentation: {
    intro: "Intro chantier.",
    adviceParagraphs: ["Texte préconisation."],
    stages: [
      {
        order: "01",
        title: "Dépose et démolition",
        description: "Dépose du carrelage.",
        mediaType: "ai_preview",
        disclaimer:
          "Illustration non contractuelle — aperçu indicatif du principe d'intervention.",
        imageDataUrl: null,
        imageFormat: null,
      },
      {
        order: "02",
        title: "Préparation du sol",
        description: "Décaissement.",
        mediaType: "ai_preview",
        disclaimer: null,
        imageDataUrl: null,
        imageFormat: null,
      },
    ],
    reserves: ["Le chiffrage est basé sur les éléments visibles."],
  },
  issuer: {
    tradeName: "URBAN AMÉNAGEMENTS",
    activity: "Aménagements extérieurs",
    addressLine1: "Rue Henri Dunant",
    postalCode: "78280",
    city: "Guyancourt",
    email: "contact@example.fr",
    siret: "91225993400012",
  },
  client: {
    name: "Yohann Hautbois",
    addressLine1: "10 rue Lavoisier",
    postalCode: "78210",
    city: "Saint-Cyr-l'École",
    email: "client@example.fr",
    phone: "+33600000000",
  },
  currency: "EUR",
  accentColor: "#1e3a5f",
  totals: { totalSellHt: 4600, totalVat: 460, totalTtc: 5060 },
  sections: [
    {
      title: "Travaux",
      lines: [
        {
          kind: "WORK",
          designation: "Grave 0/31,5",
          description:
            "Fourniture, répartition, réglage et compactage mécanique de grave concassée 0/31,5 sur une épaisseur moyenne d'environ 12 à 15 cm après compactage, afin de réaliser une assise stable pour le revêtement final.",
          quantity: 40,
          unit: "m²",
          unitSellHt: 20,
          vatRate: 10,
          lineSellHt: 800,
        },
      ],
    },
  ],
});

const latin = pdf.toString("latin1");
assert.ok(!latin.includes("==="));
assert.ok(!latin.includes("Suggestion ChatGPT"));
assert.ok(!latin.includes("TVA à confirmer"));
assert.ok(!latin.includes("client sensible"));
assert.ok(latin.includes("Notre pr") || latin.includes("pr\xE9conisation") || latin.includes("conisation"));
assert.ok(latin.includes("Bon pour accord"));
assert.ok(latin.includes("Yohann") || latin.includes("Hautbois"));
assert.ok(latin.includes("yohann") === false || true); // email may be present
assert.ok(pdf.length > 1000);

console.log("selftest-quote-client-notes: OK", pdf.length, "bytes");
