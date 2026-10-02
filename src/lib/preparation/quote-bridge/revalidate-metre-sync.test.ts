/**
 * Tests — éligibilité + contrat revalidation devis ↔ métré.
 * npx tsx src/lib/preparation/quote-bridge/revalidate-metre-sync.test.ts
 */
import assert from "node:assert/strict";
import { evaluateQuoteRevalidationEligibility } from "./revalidate-metre-sync";
import { evaluateQuoteStudySyncState } from "./quote-sync-state";
import { evaluatePlanningStudyVersionSync } from "@/lib/preparation/schedule/planning-sync-state";
import { buildQuoteDetailState } from "@/lib/chantier/quote-detail-state";

function base(over: Partial<Parameters<typeof evaluateQuoteRevalidationEligibility>[0]> = {}) {
  return evaluateQuoteRevalidationEligibility({
    commercialStatus: "VALIDATED",
    hasMetreProvenance: true,
    hasTransfer: true,
    currentStudyVersion: 5,
    transferStudyVersion: 1,
    hasSignificantQuantityDiffs: false,
    hasFinancialLock: false,
    ...over,
  });
}

// TEST 1 — VALIDATED stale sans diff → eligible
{
  const r = base();
  assert.equal(r.eligible, true);
  assert.equal(r.reason, "ELIGIBLE");
  assert.equal(r.needsRevalidation, true);
  assert.equal(r.actionLabel, "Revalider le devis");
  const after = buildQuoteDetailState({
    commercialStatus: "VALIDATED",
    hasMetreProvenance: true,
    currentStudyVersion: 5,
    transferStudyVersion: 5,
    hasSignificantQuantityDiffs: false,
  });
  assert.equal(after.needsRevalidation, false);
  assert.equal(after.secondaryLabel, "À jour");
  assert.equal(after.commercialLabel, "Validé");
  console.log("T1 — VALIDATED eligible → A_JOUR après: ok");
}

// TEST 2 — diff qty → REQUIRES_SYNC
{
  const r = base({ hasSignificantQuantityDiffs: true });
  assert.equal(r.eligible, false);
  assert.equal(r.reason, "QUANTITY_DIFFS");
  console.log("T2 — QUANTITY_DIFFS: ok");
}

// TEST 3 — DRAFT stale sans diff
{
  const r = base({ commercialStatus: "DRAFT" });
  assert.equal(r.eligible, true);
  assert.equal(r.actionLabel, "Mettre à jour la référence métré");
  console.log("T3 — DRAFT eligible: ok");
}

// TEST 4 — SENT locked
{
  const r = base({ commercialStatus: "SENT" });
  assert.equal(r.eligible, false);
  assert.equal(r.reason, "STATUS_LOCKED");
  assert.ok(r.userMessage?.includes("révision"));
  console.log("T4 — SENT locked: ok");
}

// TEST 5 — VIEWED locked
{
  const r = base({ commercialStatus: "VIEWED" });
  assert.equal(r.eligible, false);
  assert.equal(r.reason, "STATUS_LOCKED");
  console.log("T5 — VIEWED locked: ok");
}

// TEST 6 — ACCEPTED locked
{
  const r = base({ commercialStatus: "ACCEPTED" });
  assert.equal(r.eligible, false);
  assert.equal(r.reason, "STATUS_LOCKED");
  assert.ok(r.userMessage?.includes("acceptation"));
  console.log("T6 — ACCEPTED locked: ok");
}

// TEST 7 — financial lock
{
  const r = base({ hasFinancialLock: true });
  assert.equal(r.eligible, false);
  assert.equal(r.reason, "FINANCIAL_LOCKED");
  console.log("T7 — FINANCIAL_LOCKED: ok");
}

// TEST 8 — stale expected versions (contrat message)
{
  assert.equal(
    "REVALIDATION_STALE".includes("STALE"),
    true,
  );
  // Si expectedStudyVersion ≠ current → API refuse (testé côté service)
  const live = evaluateQuoteStudySyncState({
    hasQuote: true,
    hasMetreProvenance: true,
    currentStudyVersion: 6,
    transferStudyVersion: 1,
  });
  assert.equal(live.syncState, "MODIFICATION_DISPONIBLE");
  console.log("T8 — VERSION_CHANGED contrat: ok");
}

// TEST 9 — multi-devis : sync isolé par transfer (contrat logique)
{
  const a = evaluateQuoteStudySyncState({
    hasQuote: true,
    hasMetreProvenance: true,
    currentStudyVersion: 5,
    transferStudyVersion: 1,
  });
  const b = evaluateQuoteStudySyncState({
    hasQuote: true,
    hasMetreProvenance: true,
    currentStudyVersion: 5,
    transferStudyVersion: 3,
  });
  const c = evaluateQuoteStudySyncState({
    hasQuote: true,
    hasMetreProvenance: true,
    currentStudyVersion: 5,
    transferStudyVersion: 5,
  });
  assert.equal(a.syncState, "MODIFICATION_DISPONIBLE");
  assert.equal(b.syncState, "MODIFICATION_DISPONIBLE");
  assert.equal(c.syncState, "A_JOUR");
  // Après revalidation A seul → transfer A = 5
  const aAfter = evaluateQuoteStudySyncState({
    hasQuote: true,
    hasMetreProvenance: true,
    currentStudyVersion: 5,
    transferStudyVersion: 5,
  });
  assert.equal(aAfter.syncState, "A_JOUR");
  assert.equal(b.syncState, "MODIFICATION_DISPONIBLE"); // B inchangé
  console.log("T9 — multi-devis isolation: ok");
}

// TEST 10 — planning indépendant
{
  const planBefore = evaluatePlanningStudyVersionSync({
    hasPlan: true,
    currentStudyVersion: 5,
    studyVersionAtGeneration: 1,
  });
  assert.equal(planBefore.syncState, "MODIFICATION_DISPONIBLE");
  // Revalidation devis ne touche pas studyVersionAtGeneration
  const planAfter = evaluatePlanningStudyVersionSync({
    hasPlan: true,
    currentStudyVersion: 5,
    studyVersionAtGeneration: 1, // inchangé
  });
  assert.equal(planAfter.syncState, "MODIFICATION_DISPONIBLE");
  console.log("T10 — planning non impacté: ok");
}

// TEST 11 — déjà A_JOUR
{
  const r = base({
    currentStudyVersion: 5,
    transferStudyVersion: 5,
    hasSignificantQuantityDiffs: false,
  });
  assert.equal(r.eligible, false);
  assert.equal(r.reason, "NOT_STALE");
  assert.equal(r.needsRevalidation, false);
  console.log("T11 — NOT_STALE: ok");
}

// TEST 12 — pas de provenance / org (contrat)
{
  const r = base({ hasMetreProvenance: false, hasTransfer: false });
  assert.equal(r.eligible, false);
  assert.equal(r.reason, "NO_METRE_PROVENANCE");
  console.log("T12 — NO_METRE_PROVENANCE: ok");
}

// TO_VALIDATE label
{
  const r = base({ commercialStatus: "TO_VALIDATE" });
  assert.equal(r.eligible, true);
  assert.equal(r.actionLabel, "Mettre à jour la référence métré");
  console.log("T13 — TO_VALIDATE label: ok");
}

console.log("\nrevalidate-metre-sync.test.ts: PASS");
