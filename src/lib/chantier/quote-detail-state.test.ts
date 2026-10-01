/**
 * Cohérence détail devis — projection CTX-03 (sans recalcul métier).
 * npx tsx src/lib/chantier/quote-detail-state.test.ts
 */
import assert from "node:assert/strict";
import {
  buildQuoteDetailState,
  quoteDetailCommercialLabel,
} from "./quote-detail-state";
import { evaluateQuoteCoreState } from "./core-preparation-state";

// --- VALIDATED + A_JOUR ---
{
  const d = buildQuoteDetailState({
    commercialStatus: "VALIDATED",
    hasMetreProvenance: true,
    currentStudyVersion: 4,
    transferStudyVersion: 4,
    hasSignificantQuantityDiffs: false,
  });
  assert.equal(d.commercialStatus, "VALIDATED");
  assert.equal(d.commercialLabel, "Validé");
  assert.equal(d.syncState, "A_JOUR");
  assert.equal(d.syncLabel, "À jour");
  assert.equal(d.needsRevalidation, false);
  assert.equal(d.primaryLabel, "Validé");
  assert.equal(d.secondaryLabel, "À jour");
  assert.equal(d.syncMessage, null);
  console.log("A — VALIDATED + A_JOUR: ok");
}

// --- VALIDATED + stale (MOREL DEV-2026-0153) ---
{
  const d = buildQuoteDetailState({
    commercialStatus: "VALIDATED",
    hasMetreProvenance: true,
    currentStudyVersion: 4,
    transferStudyVersion: 1,
  });
  assert.equal(d.commercialStatus, "VALIDATED");
  assert.equal(d.syncState, "MODIFICATION_DISPONIBLE");
  assert.equal(d.syncLabel, "À revalider");
  assert.equal(d.needsRevalidation, true);
  assert.equal(d.primaryLabel, "À revalider");
  assert.equal(d.secondaryLabel, "Validé");
  assert.ok(d.syncMessage?.includes("métré"));
  assert.notEqual(d.primaryLabel, "Prêt");
  console.log("B — VALIDATED + stale → À revalider: ok");
}

// --- DRAFT + stale (C-01 DEMO-2026-0002) ---
{
  const d = buildQuoteDetailState({
    commercialStatus: "DRAFT",
    hasMetreProvenance: true,
    currentStudyVersion: 4,
    transferStudyVersion: 3,
  });
  assert.equal(d.commercialStatus, "DRAFT");
  assert.equal(d.commercialLabel, "Brouillon");
  assert.equal(d.syncState, "MODIFICATION_DISPONIBLE");
  assert.equal(d.primaryLabel, "À revalider");
  assert.equal(d.secondaryLabel, "Brouillon");
  // Ne transforme pas en VALIDATED
  assert.notEqual(d.commercialStatus, "VALIDATED");
  console.log("C — DRAFT + stale → Brouillon + À revalider: ok");
}

// --- A_VERIFIER ---
{
  const d = buildQuoteDetailState({
    commercialStatus: "VALIDATED",
    hasMetreProvenance: true,
    currentStudyVersion: 4,
    transferStudyVersion: null,
  });
  assert.equal(d.syncState, "A_VERIFIER");
  assert.equal(d.primaryLabel, "À vérifier");
  assert.equal(d.secondaryLabel, "Validé");
  console.log("D — A_VERIFIER: ok");
}

// --- Multi-devis : sync isolé par inputs (pas de partage) ---
{
  const quoteA = buildQuoteDetailState({
    commercialStatus: "VALIDATED",
    hasMetreProvenance: true,
    currentStudyVersion: 4,
    transferStudyVersion: 1,
  });
  const quoteB = buildQuoteDetailState({
    commercialStatus: "DRAFT",
    hasMetreProvenance: true,
    currentStudyVersion: 4,
    transferStudyVersion: 4,
  });
  assert.equal(quoteA.syncState, "MODIFICATION_DISPONIBLE");
  assert.equal(quoteB.syncState, "A_JOUR");
  assert.notEqual(quoteA.syncState, quoteB.syncState);
  console.log("E — multi-devis isolé: ok");
}

// --- ACCEPTED + stale : commercial intact ---
{
  const d = buildQuoteDetailState({
    commercialStatus: "ACCEPTED",
    hasMetreProvenance: true,
    currentStudyVersion: 5,
    transferStudyVersion: 2,
  });
  assert.equal(d.commercialStatus, "ACCEPTED");
  assert.equal(d.commercialLabel, "Accepté");
  assert.equal(d.syncState, "MODIFICATION_DISPONIBLE");
  assert.equal(d.primaryLabel, "À revalider");
  console.log("F — ACCEPTED + stale: commercial intact: ok");
}

// --- Concordance fiche chantier (evaluateQuoteCoreState) ↔ détail ---
{
  const inputs = {
    commercialStatus: "VALIDATED" as const,
    hasMetreProvenance: true,
    currentStudyVersion: 4,
    transferStudyVersion: 1,
    hasSignificantQuantityDiffs: null as boolean | null,
  };
  const core = evaluateQuoteCoreState({
    quote: { status: inputs.commercialStatus },
    hasMetreProvenance: inputs.hasMetreProvenance,
    currentStudyVersion: inputs.currentStudyVersion,
    transferStudyVersion: inputs.transferStudyVersion,
    hasSignificantQuantityDiffs: inputs.hasSignificantQuantityDiffs,
  });
  const detail = buildQuoteDetailState(inputs);
  assert.equal(core.syncState, detail.syncState);
  assert.equal(core.commercialStatus, detail.commercialStatus);
  console.log("G — concordance core ↔ détail syncState: ok");
}

// --- Libellé commercial VALIDATED ≠ Prêt ---
{
  assert.equal(quoteDetailCommercialLabel("VALIDATED"), "Validé");
  assert.notEqual(quoteDetailCommercialLabel("VALIDATED"), "Prêt");
  console.log("H — commercial VALIDATED → Validé (pas Prêt): ok");
}

console.log("\nquote-detail-state: ALL PASS");
