/**
 * Phase 1 planning exécution — fixtures locales, aucune BDD.
 */
import assert from "node:assert/strict";
import {
  applyCrewPatch,
  applyWorkloadPatch,
  getTaskCrewSize,
  parseCrewJson,
  resolveWorkloadPersonDays,
  serializeCrewJson,
} from "./crew";
import { resolveTaskDurationDays } from "./duration-resolve";
import { ceilHalfDay } from "./duration-math";
import {
  PLANNING_COMMIT_SUPPORTED_OPS,
  PLANNING_COMMIT_UNSUPPORTED_OPS,
  isPlanningCommitSupportedOp,
} from "@/lib/bework-patch/commit/planning-capability";
import { supportedOperationsForSection } from "@/lib/bework-patch/operations-catalog";

// --- crew ---
const crewObj = serializeCrewJson({
  crewId: "ELEC-A",
  crewSize: 2,
  members: [{ labor_id: "lab_elec", count: 2, label: "Électricien" }],
});
assert.equal(getTaskCrewSize(crewObj), 2);
assert.equal(parseCrewJson(crewObj).crewId, "ELEC-A");

const patched = applyCrewPatch([], { crew_size: 3, crew_id: "ELEC-B" });
assert.equal(getTaskCrewSize(patched), 3);
assert.equal(patched.crew_id, "ELEC-B");

// Fixed + crew : durée inchangée
const fixed = resolveTaskDurationDays({
  durationMode: "fixed",
  durationDays: 0.5,
  crewSize: 3,
});
assert.equal(fixed.durationDays, 0.5);

// Productivity : 60 / 30 = 2
const prod = resolveTaskDurationDays({
  durationMode: "computed",
  durationDays: 1,
  quantitySnapshot: 60,
  rateValue: 30,
  parallelUnits: 1,
});
assert.equal(prod.durationDays, 2);
assert.equal(prod.modeUsed, "computed");

// Arrondi demi-journée : 65/30 → 2.166 → 2.5
const half = resolveTaskDurationDays({
  durationMode: "computed",
  durationDays: 1,
  quantitySnapshot: 65,
  rateValue: 30,
  parallelUnits: 1,
});
assert.equal(half.durationDays, ceilHalfDay(65 / 30));
assert.equal(half.durationDays, 2.5);

// Workload : 4 h.j / 2 = 2 j
const wl = resolveTaskDurationDays({
  durationMode: "computed_workload",
  durationDays: 1,
  workloadPersonDays: 4,
  crewSize: 2,
});
assert.equal(wl.durationDays, 2);
assert.equal(wl.modeUsed, "computed_workload");

const wlJson = applyWorkloadPatch({ crew_size: 2, members: [] }, 4);
assert.equal(wlJson.workload_person_days, 4);
assert.equal(wlJson.workload_source, "PROVIDED");

const derived = resolveWorkloadPersonDays({
  crewJson: { crew_size: 2, members: [] },
  durationDays: 1.5,
});
assert.equal(derived.value, 3);
assert.equal(derived.source, "DERIVED");

// Contrat ChatGPT honnête
const exposed = supportedOperationsForSection("PLANNING").map((o) => o.op);
for (const op of PLANNING_COMMIT_SUPPORTED_OPS) {
  assert.ok(exposed.includes(op), `exposée: ${op}`);
  assert.ok(isPlanningCommitSupportedOp(op));
}
for (const op of PLANNING_COMMIT_UNSUPPORTED_OPS) {
  assert.ok(!exposed.includes(op), `non exposée: ${op}`);
  assert.equal(isPlanningCommitSupportedOp(op), false);
}

console.log("schedule-execution-phase1.test.ts OK");
