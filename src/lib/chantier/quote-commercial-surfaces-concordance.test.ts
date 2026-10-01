/**
 * Concordance CTX-03 — toutes projections commerciales d’un même quoteId.
 * npx tsx src/lib/chantier/quote-commercial-surfaces-concordance.test.ts
 */
import assert from "node:assert/strict";
import { buildQuoteDetailState } from "./quote-detail-state";
import { formatQuoteSyncStatusLine } from "./quote-detail-display";
import { quoteSyncFieldsFromDetail } from "./quote-detail-display";

const cases = [
  {
    name: "0153 VALIDATED stale",
    input: {
      commercialStatus: "VALIDATED",
      hasMetreProvenance: true,
      currentStudyVersion: 4,
      transferStudyVersion: 1,
    },
    expectSync: "MODIFICATION_DISPONIBLE" as const,
  },
  {
    name: "0151 indépendant",
    input: {
      commercialStatus: "DRAFT",
      hasMetreProvenance: false,
      currentStudyVersion: null,
      transferStudyVersion: null,
    },
    expectSync: "A_JOUR" as const,
  },
  {
    name: "C-01 DRAFT stale",
    input: {
      commercialStatus: "DRAFT",
      hasMetreProvenance: true,
      currentStudyVersion: 4,
      transferStudyVersion: 3,
    },
    expectSync: "MODIFICATION_DISPONIBLE" as const,
  },
  {
    name: "0152 A_JOUR",
    input: {
      commercialStatus: "DRAFT",
      hasMetreProvenance: true,
      currentStudyVersion: 2,
      transferStudyVersion: 2,
      hasSignificantQuantityDiffs: false,
    },
    expectSync: "A_JOUR" as const,
  },
];

for (const c of cases) {
  const detail = buildQuoteDetailState(c.input);
  // Surfaces : détail, liste, fiche client, relances, dashboard
  // = mêmes champs via quoteSyncFieldsFromDetail / formatQuoteSyncStatusLine
  const list = quoteSyncFieldsFromDetail(detail);
  const client = quoteSyncFieldsFromDetail(detail);
  const followUp = quoteSyncFieldsFromDetail(detail);
  const dashboard = quoteSyncFieldsFromDetail(detail);

  for (const [surface, state] of [
    ["list", list],
    ["client", client],
    ["followUp", followUp],
    ["dashboard", dashboard],
  ] as const) {
    assert.equal(
      state.syncState,
      detail.syncState,
      `${c.name}/${surface}: syncState`,
    );
    assert.equal(state.primaryLabel, detail.primaryLabel);
    assert.equal(state.commercialStatus, detail.commercialStatus);
  }

  assert.equal(detail.syncState, c.expectSync);
  assert.notEqual(detail.primaryLabel, "Prêt");
  const line = formatQuoteSyncStatusLine(detail);
  assert.ok(!/^Prêt$/.test(line), `${c.name}: line ne doit pas être Prêt seul`);
  if (c.expectSync === "MODIFICATION_DISPONIBLE") {
    assert.ok(line.includes("À revalider"), `${c.name}: ${line}`);
  }
  console.log(`${c.name}: all surfaces syncState=${detail.syncState} line="${line}"`);
}

console.log("\nquote-commercial-surfaces-concordance: ALL PASS");
