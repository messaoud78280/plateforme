/**
 * Tests CTX-02A — commit universel PLANNING (sous-ensemble sûr).
 * Fixtures locales — aucune écriture BDD.
 */
import assert from "node:assert/strict";
import { getSectionCapability } from "@/lib/bework-patch/capability";
import { evaluateCommitEligibility } from "@/lib/bework-patch/commit/eligibility";
import {
  PLANNING_COMMIT_SUPPORTED_OPS,
  PLANNING_COMMIT_UNSUPPORTED_OPS,
  isPlanningCommitSupportedOp,
} from "@/lib/bework-patch/commit/planning-ops";
import {
  buildFingerprintPayload,
  collectVersionSnapshot,
  computePreviewFingerprint,
} from "@/lib/bework-patch/commit/fingerprint";
import { analyzePatchImpact } from "@/lib/bework-patch/impact/analyze-impact";
import {
  buildFixtureSubgraph54,
  FIXTURE_PLAN_ID,
  FIXTURE_TASK_TERR04_ID,
} from "@/lib/bework-patch/impact/fixtures";
import type { BeworkPatchV1 } from "@/lib/bework-patch/types";
import { validatePatchContext } from "@/lib/bework-patch/validate-context";

function planningPatch(overrides?: {
  base_version?: number;
  patch_id?: string;
  ops?: BeworkPatchV1["operations"];
}): BeworkPatchV1 {
  return {
    type: "bework_patch_v1",
    schema_version: 1,
    patch_id: overrides?.patch_id ?? "patch-plan-ctx02a",
    origin: {
      section: "PLANNING",
      project_id: "proj_1",
      entity_id: FIXTURE_PLAN_ID,
      base_version: overrides?.base_version ?? 1,
    },
    change_intent: "PLANNING_ADJUSTMENT",
    reason: "Ajustement démo CTX-02A",
    operations: overrides?.ops ?? [
      {
        op: "update_task",
        target: {
          entity_type: "PREP_SCHEDULE_TASK",
          plan_id: FIXTURE_PLAN_ID,
          task_id: FIXTURE_TASK_TERR04_ID,
          step_code: "TERR-04",
        },
        changes: { name: "Excavation (ajustée)" },
      },
    ],
  };
}

// --- A capability ---
{
  assert.equal(getSectionCapability("PLANNING").mode, "AVAILABLE");
  assert.equal(getSectionCapability("VISIT").mode, "AVAILABLE");
  assert.equal(getSectionCapability("FOLLOW_UP").mode, "AVAILABLE");
  assert.equal(getSectionCapability("REPORT").mode, "AVAILABLE");
  assert.equal(getSectionCapability("NOTICE").mode, "AVAILABLE");
  console.log("  A capability: ok");
}

// --- Supported / unsupported catalog ---
{
  assert.ok(isPlanningCommitSupportedOp("update_task"));
  assert.ok(isPlanningCommitSupportedOp("update_duration"));
  assert.ok(isPlanningCommitSupportedOp("update_crew"));
  assert.ok(isPlanningCommitSupportedOp("update_productivity"));
  assert.ok(isPlanningCommitSupportedOp("update_workload"));
  assert.ok(isPlanningCommitSupportedOp("update_dependency"));
  assert.ok(isPlanningCommitSupportedOp("update_start_date"));
  assert.ok(isPlanningCommitSupportedOp("add_task"));
  for (const op of PLANNING_COMMIT_UNSUPPORTED_OPS) {
    assert.equal(isPlanningCommitSupportedOp(op), false);
  }
  assert.deepEqual([...PLANNING_COMMIT_SUPPORTED_OPS], [
    "update_task",
    "update_duration",
    "update_crew",
    "update_productivity",
    "update_workload",
    "update_dependency",
    "update_start_date",
    "add_task",
  ]);
  console.log("  catalog SUPPORTED/UNSUPPORTED: ok");
}

// --- B eligibility update_task ---
{
  const patch = planningPatch();
  const subgraph = buildFixtureSubgraph54();
  const impact = analyzePatchImpact({ patch, subgraph });
  assert.equal(impact.errors.length, 0);
  const elig = evaluateCommitEligibility({ patch, impact });
  assert.equal(elig.ok, true);
  if (elig.ok) {
    assert.equal(elig.mode, "PLANNING_ONLY");
    assert.ok(elig.buttonLabel.includes("planning"));
  }
  console.log("  B eligibility update_task: ok");
}

// --- C multi-ops eligibility (revision +1 conceptuel) ---
{
  const patch = planningPatch({
    ops: [
      {
        op: "update_task",
        target: {
          entity_type: "PREP_SCHEDULE_TASK",
          plan_id: FIXTURE_PLAN_ID,
          task_id: FIXTURE_TASK_TERR04_ID,
        },
        changes: { name: "A", lot: "Terrassement" },
      },
      {
        op: "update_duration",
        target: {
          entity_type: "PREP_SCHEDULE_TASK",
          plan_id: FIXTURE_PLAN_ID,
          task_id: FIXTURE_TASK_TERR04_ID,
          step_code: "TERR-04",
        },
        changes: { duration_days: 2 },
      },
    ],
  });
  const subgraph = buildFixtureSubgraph54();
  const impact = analyzePatchImpact({ patch, subgraph });
  assert.equal(impact.errors.length, 0);
  const elig = evaluateCommitEligibility({ patch, impact });
  assert.equal(elig.ok, true);
  if (elig.ok) assert.equal(elig.mode, "PLANNING_ONLY");
  // Une seule syncMode PLANNING_ONLY → un seul +1 revision au commit
  console.log("  C multi-ops → PLANNING_ONLY (revision +1): ok");
}

// --- D stale revision (validatePatchContext) ---
{
  const patch = planningPatch({ base_version: 1 });
  const stale = validatePatchContext(patch, {
    organizationId: "org",
    projectId: "proj_1",
    currentVersion: 2,
  });
  assert.equal(stale.ok, false);
  assert.equal(stale.code, "VERSION_CONFLICT");
  console.log("  D stale revision: ok");
}

// --- E stale fingerprint ---
{
  const patch = planningPatch();
  const subgraph = buildFixtureSubgraph54();
  const impact = analyzePatchImpact({ patch, subgraph });
  const versions = collectVersionSnapshot(subgraph);
  assert.equal(versions.planRevision, 1);
  assert.equal(versions.studyVersionAtGeneration, 3);
  const fp1 = computePreviewFingerprint(
    buildFingerprintPayload({ patch, versions, impact, subgraph }),
  );
  const versions2 = { ...versions, planRevision: 2 };
  const fp2 = computePreviewFingerprint(
    buildFingerprintPayload({
      patch,
      versions: versions2,
      impact,
      subgraph,
    }),
  );
  assert.notEqual(fp1, fp2);
  console.log("  E stale fingerprint: ok");
}

// --- F unsupported op refused ---
{
  const patch = planningPatch({
    ops: [
      {
        op: "remove_task",
        target: {
          entity_type: "PREP_SCHEDULE_TASK",
          plan_id: FIXTURE_PLAN_ID,
          task_id: FIXTURE_TASK_TERR04_ID,
        },
      },
    ],
  });
  const subgraph = buildFixtureSubgraph54();
  const impact = analyzePatchImpact({ patch, subgraph });
  assert.ok(impact.errors.length > 0);
  const elig = evaluateCommitEligibility({ patch, impact });
  assert.equal(elig.ok, false);
  console.log("  F remove_task UNSUPPORTED: ok");
}

// --- G cross-plan refused ---
{
  const patch = planningPatch({
    ops: [
      {
        op: "update_task",
        target: {
          entity_type: "PREP_SCHEDULE_TASK",
          plan_id: "other-plan",
          task_id: FIXTURE_TASK_TERR04_ID,
        },
        changes: { name: "Hack" },
      },
    ],
  });
  const subgraph = buildFixtureSubgraph54();
  const impact = analyzePatchImpact({ patch, subgraph });
  assert.ok(impact.errors.some((e) => e.code === "PROJECT_MISMATCH" || e.code === "TARGET_NOT_FOUND"));
  const elig = evaluateCommitEligibility({ patch, impact });
  assert.equal(elig.ok, false);
  console.log("  G cross-plan: ok");
}

// --- H CTX-04 : studyVersionAtGeneration dans snapshot, distinct de revision ---
{
  const subgraph = buildFixtureSubgraph54();
  const v = collectVersionSnapshot(subgraph);
  assert.equal(v.planRevision, 1);
  assert.equal(v.studyVersionAtGeneration, 3);
  console.log("  H CTX-04 snapshot fields: ok");
}

// --- I NOTICE AVAILABLE (empty ops → EMPTY_OPERATIONS) ---
{
  const patch: BeworkPatchV1 = {
    type: "bework_patch_v1",
    schema_version: 1,
    patch_id: "notice-x",
    origin: {
      section: "NOTICE",
      project_id: "proj_1",
      entity_id: "doc_1",
      base_version: 1,
    },
    change_intent: "DOCUMENT_EDIT",
    reason: "x",
    operations: [],
  };
  const impact = analyzePatchImpact({
    patch,
    subgraph: buildFixtureSubgraph54(),
  });
  const elig = evaluateCommitEligibility({ patch, impact });
  assert.equal(elig.ok, false);
  if (!elig.ok) assert.equal(elig.code, "TARGET_NOT_FOUND");
  console.log("  I NOTICE TARGET_NOT_FOUND: ok");
}

// --- J update_duration preview ---
{
  const patch = planningPatch({
    ops: [
      {
        op: "update_duration",
        target: {
          entity_type: "PREP_SCHEDULE_TASK",
          plan_id: FIXTURE_PLAN_ID,
          task_id: FIXTURE_TASK_TERR04_ID,
          step_code: "TERR-04",
        },
        changes: { duration_days: 2 },
      },
    ],
  });
  const subgraph = buildFixtureSubgraph54();
  const impact = analyzePatchImpact({ patch, subgraph });
  assert.equal(impact.errors.length, 0);
  assert.ok(
    impact.derivedChanges.some(
      (d) => d.field === "duration_days" && d.after === 2,
    ),
  );
  const elig = evaluateCommitEligibility({ patch, impact });
  assert.equal(elig.ok, true);
  console.log("  J update_duration preview: ok");
}

console.log("ctx02a-planning-commit.test.ts: ok");
