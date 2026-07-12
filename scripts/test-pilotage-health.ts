/**
 * Tests unitaires — santé chantier Pilotage travaux.
 * Exécution : npx tsx scripts/test-pilotage-health.ts
 */
import assert from "node:assert/strict";
import { computeHealth } from "../src/lib/pilotage/health";

function run() {
  const ok = computeHealth({
    status: "EN_COURS",
    overdueActions: 0,
    criticalObligationsOverdue: 0,
    missingDocs: 0,
    visasOverdue: 0,
    openBlockersCritical: 0,
    openBlockers: 0,
    tsWithoutValidation: 0,
    doeMissing: 0,
    blockedMilestones: 0,
  });
  assert.equal(ok.label, "CONFORME");
  assert.equal(ok.score, 100);

  const critique = computeHealth({
    status: "BLOQUE",
    overdueActions: 3,
    criticalObligationsOverdue: 1,
    missingDocs: 2,
    visasOverdue: 2,
    openBlockersCritical: 1,
    openBlockers: 2,
    tsWithoutValidation: 1,
    doeMissing: 6,
    blockedMilestones: 1,
  });
  assert.equal(critique.label, "CRITIQUE");
  assert.ok(critique.score <= 25);

  const termine = computeHealth({
    status: "TERMINE",
    overdueActions: 5,
    criticalObligationsOverdue: 0,
    missingDocs: 0,
    visasOverdue: 0,
    openBlockersCritical: 0,
    openBlockers: 0,
    tsWithoutValidation: 0,
    doeMissing: 0,
    blockedMilestones: 0,
  });
  assert.equal(termine.label, "TERMINE");

  console.log("OK — tests santé pilotage");
}

run();
