/**
 * Cohérence détail planning — projection CTX-04 (sans recalcul métier).
 * npx tsx src/lib/chantier/planning-detail-state.test.ts
 */
import assert from "node:assert/strict";
import { buildPlanningDetailState } from "./planning-detail-state";
import { evaluatePlanningCoreState } from "./core-preparation-state";

// --- CURRENT + A_JOUR ---
{
  const d = buildPlanningDetailState({
    status: "CURRENT",
    revisionNumber: 1,
    studyVersionAtGeneration: 4,
    currentStudyVersion: 4,
    startDateLabel: "12 oct. 2026",
  });
  assert.equal(d.status, "CURRENT");
  assert.equal(d.syncState, "A_JOUR");
  assert.equal(d.syncLabel, "À jour");
  assert.equal(d.needsUpdate, false);
  assert.equal(d.primaryLabel, "À jour");
  assert.equal(d.secondaryLabel, "12 oct. 2026");
  assert.equal(d.syncMessage, null);
  console.log("A — CURRENT + A_JOUR: ok");
}

// --- CURRENT + stale (MOREL) ---
{
  const d = buildPlanningDetailState({
    status: "CURRENT",
    revisionNumber: 1,
    studyVersionAtGeneration: 1,
    currentStudyVersion: 4,
    startDateLabel: "12 oct. 2026",
  });
  assert.equal(d.status, "CURRENT");
  assert.equal(d.syncState, "MODIFICATION_DISPONIBLE");
  assert.equal(d.syncLabel, "Modification disponible");
  assert.equal(d.needsUpdate, true);
  assert.equal(d.primaryLabel, "Modification disponible");
  assert.equal(d.secondaryLabel, "12 oct. 2026");
  assert.ok(d.syncMessage?.includes("métré"));
  assert.notEqual(d.primaryLabel, "Prêt");
  console.log("B — CURRENT + stale → Modification disponible: ok");
}

// --- studyVersionAtGeneration null → A_VERIFIER ---
{
  const d = buildPlanningDetailState({
    status: "CURRENT",
    revisionNumber: 1,
    studyVersionAtGeneration: null,
    currentStudyVersion: 4,
    startDateLabel: "1 janv. 2026",
  });
  assert.equal(d.syncState, "A_VERIFIER");
  assert.equal(d.primaryLabel, "À vérifier");
  assert.equal(d.secondaryLabel, "1 janv. 2026");
  console.log("C — studyVersionAtGeneration null → À vérifier: ok");
}

// --- study plus ancienne que source (incohérence) ---
{
  const d = buildPlanningDetailState({
    status: "CURRENT",
    revisionNumber: 2,
    studyVersionAtGeneration: 5,
    currentStudyVersion: 3,
  });
  assert.equal(d.syncState, "A_VERIFIER");
  assert.equal(d.primaryLabel, "À vérifier");
  console.log("D — current < source → À vérifier: ok");
}

// --- C-01 stale ---
{
  const d = buildPlanningDetailState({
    status: "CURRENT",
    revisionNumber: 1,
    studyVersionAtGeneration: 3,
    currentStudyVersion: 4,
  });
  assert.equal(d.syncState, "MODIFICATION_DISPONIBLE");
  assert.equal(d.primaryLabel, "Modification disponible");
  console.log("E — C-01 stale: ok");
}

// --- Concordance fiche chantier ↔ détail ---
{
  const inputs = {
    status: "CURRENT",
    studyVersionAtGeneration: 1 as number | null,
    currentStudyVersion: 4 as number | null,
    startDateLabel: "12 oct. 2026",
  };
  const core = evaluatePlanningCoreState({
    plan: {
      status: inputs.status,
      studyVersionAtGeneration: inputs.studyVersionAtGeneration,
      startDateLabel: inputs.startDateLabel,
    },
    currentStudyVersion: inputs.currentStudyVersion,
  });
  const detail = buildPlanningDetailState({
    status: inputs.status,
    studyVersionAtGeneration: inputs.studyVersionAtGeneration,
    currentStudyVersion: inputs.currentStudyVersion,
    startDateLabel: inputs.startDateLabel,
  });
  assert.equal(core.syncState, detail.syncState);
  assert.equal(core.syncState, "MODIFICATION_DISPONIBLE");
  console.log("F — concordance core ↔ détail syncState: ok");
}

// --- Date jamais prioritaire sur stale ---
{
  const d = buildPlanningDetailState({
    status: "CURRENT",
    studyVersionAtGeneration: 1,
    currentStudyVersion: 4,
    startDateLabel: "12 oct. 2026",
  });
  assert.equal(d.primaryLabel, "Modification disponible");
  assert.notEqual(d.primaryLabel, d.startDateLabel);
  console.log("G — date secondaire face au stale: ok");
}

console.log("\nplanning-detail-state: ALL PASS");
