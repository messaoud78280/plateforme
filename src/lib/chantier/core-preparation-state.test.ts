/**
 * Phase 1 — source unique MÉTRÉ / DEVIS / PLANNING.
 */
import assert from "node:assert/strict";
import {
  evaluateCorePreparationTriple,
  evaluateMetreCoreState,
  evaluatePlanningCoreState,
  evaluateQuoteCoreState,
} from "./core-preparation-state";

console.log("core-preparation-state Phase 1");

// --- Métré A absent ---
{
  const m = evaluateMetreCoreState({ study: null });
  assert.equal(m.kind, "ABSENT");
  assert.equal(m.displayLabel, "À préparer");
  assert.equal(m.progressBucket, "todo");
  assert.equal(m.workflowReady, false);
}
console.log("  A métré absent: ok");

// --- Métré B PRO_A_VALIDER ---
{
  const m = evaluateMetreCoreState({
    study: { dossierStatus: "PRO_A_VALIDER", lineCount: 32 },
  });
  assert.equal(m.kind, "NEEDS_VALIDATION");
  assert.equal(m.displayLabel, "À valider · 32 postes");
  assert.equal(m.progressBucket, "progress");
  assert.equal(m.workflowReady, false);
}
console.log("  B métré PRO_A_VALIDER: ok");

// --- Métré C PRO_VALIDE ---
{
  const m = evaluateMetreCoreState({
    study: { dossierStatus: "PRO_VALIDE", lineCount: 10 },
  });
  assert.equal(m.kind, "VALIDATED");
  assert.equal(m.displayLabel, "Validé · 10 postes");
  assert.equal(m.progressBucket, "done");
  assert.equal(m.workflowReady, true);
}
console.log("  C métré PRO_VALIDE: ok");

// --- Métré D DEMONSTRATION ---
{
  const m = evaluateMetreCoreState({
    study: { dossierStatus: "DEMONSTRATION", lineCount: 32 },
  });
  assert.equal(m.kind, "VALIDATED");
  assert.equal(m.progressBucket, "done");
}
console.log("  D métré DEMONSTRATION → VALIDATED: ok");

// --- Devis A absent ---
{
  const q = evaluateQuoteCoreState({
    quote: null,
    hasMetreProvenance: false,
    currentStudyVersion: null,
    transferStudyVersion: null,
  });
  assert.equal(q.exists, false);
  assert.equal(q.displayLabel, "À préparer");
}
console.log("  A devis absent: ok");

// --- Devis B DRAFT aligné ---
{
  const q = evaluateQuoteCoreState({
    quote: { status: "DRAFT" },
    hasMetreProvenance: true,
    currentStudyVersion: 3,
    transferStudyVersion: 3,
  });
  assert.equal(q.displayLabel, "Brouillon");
  assert.equal(q.syncState, "A_JOUR");
  assert.equal(q.needsRevalidation, false);
  assert.equal(q.progressBucket, "progress");
}
console.log("  B devis DRAFT aligné: ok");

// --- Devis C VALIDATED aligné ---
{
  const q = evaluateQuoteCoreState({
    quote: { status: "VALIDATED" },
    hasMetreProvenance: true,
    currentStudyVersion: 2,
    transferStudyVersion: 2,
  });
  assert.equal(q.displayLabel, "Prêt");
  assert.equal(q.syncState, "A_JOUR");
  assert.equal(q.progressBucket, "done");
  assert.equal(q.workflowReady, true);
}
console.log("  C devis VALIDATED aligné → Prêt: ok");

// --- Devis D VALIDATED + study plus récente (MOREL) ---
{
  const q = evaluateQuoteCoreState({
    quote: { status: "VALIDATED" },
    hasMetreProvenance: true,
    currentStudyVersion: 4,
    transferStudyVersion: 1,
  });
  assert.equal(q.displayLabel, "À revalider");
  assert.equal(q.syncState, "MODIFICATION_DISPONIBLE");
  assert.equal(q.needsRevalidation, true);
  // Progression Phase 1 : bucket commercial conservé
  assert.equal(q.progressBucket, "done");
  assert.equal(q.workflowReady, true);
}
console.log("  D devis VALIDATED stale → À revalider: ok");

// --- Planning A absent ---
{
  const p = evaluatePlanningCoreState({
    plan: null,
    currentStudyVersion: null,
  });
  assert.equal(p.syncState, "ABSENT");
  assert.equal(p.displayLabel, "À préparer");
}
console.log("  A planning absent: ok");

// --- Planning B CURRENT aligné ---
{
  const p = evaluatePlanningCoreState({
    plan: {
      status: "CURRENT",
      studyVersionAtGeneration: 4,
      startDateLabel: "12 oct.",
    },
    currentStudyVersion: 4,
  });
  assert.equal(p.syncState, "A_JOUR");
  assert.equal(p.displayLabel, "Prêt");
  assert.equal(p.secondaryLabel, "12 oct.");
  assert.equal(p.progressBucket, "done");
}
console.log("  B planning CURRENT aligné → Prêt: ok");

// --- Planning C CURRENT stale ---
{
  const p = evaluatePlanningCoreState({
    plan: {
      status: "CURRENT",
      studyVersionAtGeneration: 1,
      startDateLabel: "12 oct.",
    },
    currentStudyVersion: 4,
  });
  assert.equal(p.syncState, "MODIFICATION_DISPONIBLE");
  assert.equal(p.displayLabel, "Modification disponible");
  assert.equal(p.needsUpdate, true);
  assert.equal(p.progressBucket, "done"); // Phase 1 conserve bucket
}
console.log("  C planning stale → Modification disponible: ok");

// --- Planning D studyVersionAtGeneration null ---
{
  const p = evaluatePlanningCoreState({
    plan: { status: "CURRENT", studyVersionAtGeneration: null },
    currentStudyVersion: 4,
  });
  assert.equal(p.syncState, "A_VERIFIER");
  assert.equal(p.displayLabel, "À vérifier");
}
console.log("  D planning source null → À vérifier: ok");

// --- Triple MOREL-like ---
{
  const t = evaluateCorePreparationTriple({
    study: {
      id: "s",
      dossierStatus: "PRO_A_VALIDER",
      lineCount: 32,
      version: 4,
    },
    quote: { id: "q", status: "VALIDATED" },
    quoteSync: {
      hasMetreProvenance: true,
      currentStudyVersion: 4,
      transferStudyVersion: 1,
    },
    plan: {
      id: "p",
      status: "CURRENT",
      studyVersionAtGeneration: 1,
      startDateLabel: "12 oct.",
    },
    planStudyVersion: 4,
  });
  assert.equal(t.metre.kind, "NEEDS_VALIDATION");
  assert.equal(t.devis.syncState, "MODIFICATION_DISPONIBLE");
  assert.equal(t.devis.displayLabel, "À revalider");
  assert.equal(t.planning.syncState, "MODIFICATION_DISPONIBLE");
  assert.equal(t.planning.displayLabel, "Modification disponible");
}
console.log("  triple MOREL: ok");

console.log("core-preparation-state Phase 1: PASS");
