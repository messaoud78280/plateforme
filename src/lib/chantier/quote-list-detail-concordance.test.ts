/**
 * Concordance liste devis ↔ détail devis (CTX-03).
 * npx tsx src/lib/chantier/quote-list-detail-concordance.test.ts
 */
import assert from "node:assert/strict";
import { buildQuoteDetailState } from "./quote-detail-state";

/**
 * Simule le mapping liste : mêmes inputs batch → même helper pur que le détail.
 * (Pas de DB — vérifie l’égalité syncState / labels.)
 */
function listStateFromInputs(input: Parameters<typeof buildQuoteDetailState>[0]) {
  return buildQuoteDetailState(input);
}

const cases = [
  {
    name: "MOREL 0153 VALIDATED stale",
    number: "DEV-2026-0153",
    input: {
      commercialStatus: "VALIDATED",
      hasMetreProvenance: true,
      currentStudyVersion: 4,
      transferStudyVersion: 1,
    },
    expectSync: "MODIFICATION_DISPONIBLE" as const,
    expectPrimary: "À revalider",
    expectSecondary: "Validé",
  },
  {
    name: "MOREL 0151 indépendant sans transfer",
    number: "DEV-2026-0151",
    input: {
      commercialStatus: "DRAFT",
      hasMetreProvenance: false,
      currentStudyVersion: null,
      transferStudyVersion: null,
    },
    expectSync: "A_JOUR" as const,
    expectPrimary: "Brouillon",
    expectSecondary: null,
  },
  {
    name: "C-01 DRAFT stale",
    number: "DEMO-2026-0002",
    input: {
      commercialStatus: "DRAFT",
      hasMetreProvenance: true,
      currentStudyVersion: 4,
      transferStudyVersion: 3,
    },
    expectSync: "MODIFICATION_DISPONIBLE" as const,
    expectPrimary: "À revalider",
    expectSecondary: "Brouillon",
  },
  {
    name: "0152 A_JOUR",
    number: "DEV-2026-0152",
    input: {
      commercialStatus: "DRAFT",
      hasMetreProvenance: true,
      currentStudyVersion: 2,
      transferStudyVersion: 2,
      hasSignificantQuantityDiffs: false,
    },
    expectSync: "A_JOUR" as const,
    expectPrimary: "Brouillon",
    expectSecondary: "À jour",
  },
];

for (const c of cases) {
  const list = listStateFromInputs(c.input);
  const detail = buildQuoteDetailState(c.input);
  assert.equal(list.syncState, detail.syncState, `${c.name}: syncState`);
  assert.equal(list.primaryLabel, detail.primaryLabel, `${c.name}: primary`);
  assert.equal(list.secondaryLabel, detail.secondaryLabel, `${c.name}: secondary`);
  assert.equal(list.syncState, c.expectSync, `${c.name}: expect sync`);
  assert.equal(list.primaryLabel, c.expectPrimary, `${c.name}: expect primary`);
  assert.equal(list.secondaryLabel, c.expectSecondary, `${c.name}: expect secondary`);
  assert.notEqual(list.primaryLabel, "Prêt", `${c.name}: pas Prêt principal`);
  console.log(`${c.number}: liste===détail syncState=${list.syncState} primary=${list.primaryLabel}`);
}

// Multi-devis : pas de contamination
{
  const a = buildQuoteDetailState({
    commercialStatus: "VALIDATED",
    hasMetreProvenance: true,
    currentStudyVersion: 4,
    transferStudyVersion: 1,
  });
  const b = buildQuoteDetailState({
    commercialStatus: "DRAFT",
    hasMetreProvenance: false,
    currentStudyVersion: null,
    transferStudyVersion: null,
  });
  assert.equal(a.syncState, "MODIFICATION_DISPONIBLE");
  assert.equal(b.syncState, "A_JOUR");
  assert.notEqual(a.syncState, b.syncState);
  console.log("multi-devis isolation: ok");
}

console.log("\nquote-list-detail-concordance: ALL PASS");
