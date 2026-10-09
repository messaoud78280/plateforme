import assert from "node:assert/strict";
import {
  computeSourceFingerprint,
  evaluateMetreDrift,
  buildDriftDecisionPayload,
} from "@/lib/supply/drift";

/**
 * Contrat P0 — propagation métré → appro :
 * marquage drift sans auto-écriture qty/BC ; décision humaine obligatoire.
 */
const fpA = computeSourceFingerprint({
  takeoffCodes: ["A-01"],
  sourceQuantities: [{ code: "A-01", qty: 10, unit: "m2" }],
  studyVersion: 1,
});
const fpB = computeSourceFingerprint({
  takeoffCodes: ["A-01"],
  sourceQuantities: [{ code: "A-01", qty: 12, unit: "m2" }],
  studyVersion: 2,
});

assert.notEqual(fpA, fpB);

const soft = evaluateMetreDrift({
  previousFingerprint: fpA,
  nextFingerprint: fpB,
  hasActiveOrderLinks: false,
});
assert.equal(soft.drift, "METRE_CHANGED");
assert.equal(soft.requiresHumanDecision, true);

const hard = evaluateMetreDrift({
  previousFingerprint: fpA,
  nextFingerprint: fpB,
  hasActiveOrderLinks: true,
});
assert.equal(hard.drift, "METRE_CHANGED_AFTER_ORDER");

// Commit répété même état : fingerprint inchangé → pas de nouveau drift
const repeat = evaluateMetreDrift({
  previousFingerprint: fpB,
  nextFingerprint: fpB,
  hasActiveOrderLinks: false,
});
assert.equal(repeat.changed, false);
assert.equal(repeat.drift, "NONE");

const decision = buildDriftDecisionPayload({
  drift: "METRE_CHANGED",
  orderedQty: 10,
  newRequiredQty: 12,
});
assert.ok(decision.allowedActions.includes("RECALCULATE"));
assert.ok(decision.allowedActions.includes("KEEP"));

const afterOrder = buildDriftDecisionPayload({
  drift: "METRE_CHANGED_AFTER_ORDER",
  orderedQty: 10,
  newRequiredQty: 12,
});
assert.ok(afterOrder.allowedActions.includes("CREATE_COMPLEMENT"));
assert.ok(!afterOrder.allowedActions.includes("RECALCULATE"));

console.log("sync-metre-drift contract tests OK");
