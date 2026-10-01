/**
 * Tests CTX-02C — commit universel FOLLOW_UP (update_follow_up title/notes).
 * Fixtures locales — aucune écriture BDD.
 */
import assert from "node:assert/strict";
import { getSectionCapability } from "@/lib/bework-patch/capability";
import { evaluateCommitEligibility } from "@/lib/bework-patch/commit/eligibility";
import {
  FOLLOW_UP_COMMIT_SUPPORTED_OPS,
  FOLLOW_UP_COMMIT_UNSUPPORTED_OPS,
  isFollowUpCommitSupportedOp,
  sheetToVersionInput,
} from "@/lib/bework-patch/commit/follow-up-ops";
import {
  buildFingerprintPayload,
  collectVersionSnapshot,
  computePreviewFingerprint,
} from "@/lib/bework-patch/commit/fingerprint";
import { analyzePatchImpact } from "@/lib/bework-patch/impact/analyze-impact";
import { buildFixtureSubgraph54 } from "@/lib/bework-patch/impact/fixtures";
import type { ImpactSubgraph } from "@/lib/bework-patch/impact/types";
import type { BeworkPatchV1 } from "@/lib/bework-patch/types";
import { validatePatchContext } from "@/lib/bework-patch/validate-context";
import {
  computeFollowUpContextVersion,
} from "@/lib/bework-context/follow-up-context-version";
import { parseBeworkPatch } from "@/lib/bework-patch/parse";

const SHEET_ID = "fu_ctx02c";
const PROJECT_ID = "proj_1";

function sheetVersion(input?: {
  title?: string;
  notes?: string | null;
  status?: string;
}): number {
  return computeFollowUpContextVersion(
    sheetToVersionInput({
      id: SHEET_ID,
      title: input?.title ?? "Suivi démo",
      status: input?.status ?? "NOUVEAU",
      notes: input?.notes ?? "Note A",
      prepSchedulePlanId: null,
    }),
  );
}

function followUpSubgraph(opts?: {
  title?: string;
  notes?: string | null;
  otherSheet?: boolean;
}): ImpactSubgraph {
  const base = buildFixtureSubgraph54();
  const title = opts?.title ?? "Suivi démo";
  const notes = opts?.notes ?? "Note A";
  const id = opts?.otherSheet ? "fu_other" : SHEET_ID;
  const contextVersion = computeFollowUpContextVersion(
    sheetToVersionInput({
      id,
      title,
      status: "NOUVEAU",
      notes,
      prepSchedulePlanId: null,
    }),
  );
  return {
    ...base,
    projectId: PROJECT_ID,
    followUp: {
      id,
      projectId: PROJECT_ID,
      title,
      status: "NOUVEAU",
      notes,
      prepSchedulePlanId: null,
      contextVersion,
    },
  };
}

function followUpPatch(overrides?: {
  base_version?: number;
  patch_id?: string;
  ops?: BeworkPatchV1["operations"];
  entity_id?: string;
}): BeworkPatchV1 {
  const version = overrides?.base_version ?? sheetVersion();
  return {
    type: "bework_patch_v1",
    schema_version: 1,
    patch_id: overrides?.patch_id ?? "patch-fu-ctx02c",
    origin: {
      section: "FOLLOW_UP",
      project_id: PROJECT_ID,
      entity_id: overrides?.entity_id ?? SHEET_ID,
      base_version: version,
    },
    change_intent: "ADMINISTRATIVE_UPDATE",
    reason: "Ajustement démo CTX-02C",
    operations: overrides?.ops ?? [
      {
        op: "update_follow_up",
        target: { entity_type: "FOLLOW_UP_SHEET", sheet_id: SHEET_ID },
        changes: { notes: "Note B" },
      },
    ],
  };
}

// --- A capability ---
{
  assert.equal(getSectionCapability("FOLLOW_UP").mode, "AVAILABLE");
  assert.equal(getSectionCapability("VISIT").mode, "AVAILABLE");
  assert.equal(getSectionCapability("PLANNING").mode, "AVAILABLE");
  assert.equal(getSectionCapability("REPORT").mode, "AVAILABLE");
  assert.equal(getSectionCapability("NOTICE").mode, "AVAILABLE");
  console.log("  A capability: ok");
}

// --- B déterminisme ---
{
  const v1 = sheetVersion();
  const v2 = sheetVersion();
  assert.equal(v1, v2);
  console.log("  B déterminisme: ok");
}

// --- catalog ---
{
  assert.ok(isFollowUpCommitSupportedOp("update_follow_up"));
  assert.deepEqual([...FOLLOW_UP_COMMIT_SUPPORTED_OPS], ["update_follow_up"]);
  for (const op of FOLLOW_UP_COMMIT_UNSUPPORTED_OPS) {
    assert.equal(isFollowUpCommitSupportedOp(op), false);
  }
  console.log("  catalog SUPPORTED/UNSUPPORTED: ok");
}

// --- C eligibility ---
{
  const subgraph = followUpSubgraph();
  const patch = followUpPatch({
    base_version: subgraph.followUp!.contextVersion,
  });
  const impact = analyzePatchImpact({ patch, subgraph });
  assert.equal(impact.errors.length, 0);
  const elig = evaluateCommitEligibility({ patch, impact });
  assert.equal(elig.ok, true);
  if (elig.ok) {
    assert.equal(elig.mode, "FOLLOW_UP_ONLY");
    assert.ok(elig.buttonLabel.toLowerCase().includes("suivi"));
  }
  console.log("  C eligibility update_follow_up: ok");
}

// --- D multi fields ---
{
  const subgraph = followUpSubgraph();
  const patch = followUpPatch({
    base_version: subgraph.followUp!.contextVersion,
    ops: [
      {
        op: "update_follow_up",
        target: { entity_type: "FOLLOW_UP_SHEET", sheet_id: SHEET_ID },
        changes: { title: "Nouveau titre", notes: "Nouvelle note" },
      },
    ],
  });
  const impact = analyzePatchImpact({ patch, subgraph });
  assert.equal(impact.errors.length, 0);
  assert.equal(evaluateCommitEligibility({ patch, impact }).ok, true);
  console.log("  D multi-fields: ok");
}

// --- E stale version ---
{
  const patch = followUpPatch({ base_version: 111 });
  const stale = validatePatchContext(patch, {
    organizationId: "org",
    projectId: PROJECT_ID,
    currentVersion: 222,
  });
  assert.equal(stale.ok, false);
  assert.equal(stale.code, "VERSION_CONFLICT");
  console.log("  E stale version: ok");
}

// --- F fingerprint ---
{
  const subgraph = followUpSubgraph();
  const patch = followUpPatch({
    base_version: subgraph.followUp!.contextVersion,
  });
  const impact = analyzePatchImpact({ patch, subgraph });
  const versions = collectVersionSnapshot(subgraph);
  assert.equal(versions.followUpVersion, subgraph.followUp!.contextVersion);
  const fp1 = computePreviewFingerprint(
    buildFingerprintPayload({ patch, versions, impact, subgraph }),
  );
  const fp2 = computePreviewFingerprint(
    buildFingerprintPayload({
      patch,
      versions: {
        ...versions,
        followUpVersion: versions.followUpVersion! + 1,
      },
      impact,
      subgraph,
    }),
  );
  assert.notEqual(fp1, fp2);
  console.log("  F stale fingerprint: ok");
}

// --- G update_progress UNSUPPORTED ---
{
  const subgraph = followUpSubgraph();
  const patch = followUpPatch({
    base_version: subgraph.followUp!.contextVersion,
    ops: [
      {
        op: "update_progress",
        target: { entity_type: "FOLLOW_UP_SHEET", id: SHEET_ID },
        changes: { progress_percent: 50 },
      },
    ],
  });
  const impact = analyzePatchImpact({ patch, subgraph });
  assert.ok(impact.errors.length > 0);
  assert.equal(evaluateCommitEligibility({ patch, impact }).ok, false);
  console.log("  G update_progress UNSUPPORTED: ok");
}

// --- H champ interdit ---
{
  const parsed = parseBeworkPatch({
    type: "bework_patch_v1",
    schema_version: 1,
    patch_id: "bad-field",
    origin: {
      section: "FOLLOW_UP",
      project_id: PROJECT_ID,
      entity_id: SHEET_ID,
      base_version: 1,
    },
    change_intent: "ADMINISTRATIVE_UPDATE",
    reason: "x",
    operations: [
      {
        op: "update_follow_up",
        target: { entity_type: "FOLLOW_UP_SHEET", sheet_id: SHEET_ID },
        changes: { organizationId: "hack" },
      },
    ],
  });
  assert.equal(parsed.ok, false);
  console.log("  H champ interdit: ok");
}

// --- I cross-follow-up ---
{
  const subgraph = followUpSubgraph();
  const patch = followUpPatch({
    base_version: subgraph.followUp!.contextVersion,
    ops: [
      {
        op: "update_follow_up",
        target: { entity_type: "FOLLOW_UP_SHEET", sheet_id: "fu_other" },
        changes: { notes: "hack" },
      },
    ],
  });
  const impact = analyzePatchImpact({ patch, subgraph });
  assert.ok(impact.errors.some((e) => e.code === "PROJECT_MISMATCH"));
  assert.equal(evaluateCommitEligibility({ patch, impact }).ok, false);
  console.log("  I cross-follow-up: ok");
}

// --- J NOTICE AVAILABLE (empty → EMPTY_OPERATIONS) ---
{
  const patch: BeworkPatchV1 = {
    type: "bework_patch_v1",
    schema_version: 1,
    patch_id: "notice-x",
    origin: {
      section: "NOTICE",
      project_id: PROJECT_ID,
      entity_id: "doc_1",
      base_version: 1,
    },
    change_intent: "DOCUMENT_EDIT",
    reason: "x",
    operations: [],
  };
  const elig = evaluateCommitEligibility({
    patch,
    impact: analyzePatchImpact({
      patch,
      subgraph: followUpSubgraph(),
    }),
  });
  assert.equal(elig.ok, false);
  if (!elig.ok) assert.equal(elig.code, "TARGET_NOT_FOUND");
  console.log("  J NOTICE TARGET_NOT_FOUND: ok");
}

// --- K version change ---
{
  const x = sheetVersion({ notes: "A" });
  const y = sheetVersion({ notes: "B" });
  assert.notEqual(x, y);
  console.log("  K versionBefore != versionAfter: ok");
}

// --- L parse ---
{
  const parsed = parseBeworkPatch({
    type: "bework_patch_v1",
    schema_version: 1,
    patch_id: "parse-ok",
    origin: {
      section: "FOLLOW_UP",
      project_id: PROJECT_ID,
      entity_id: SHEET_ID,
      base_version: 1,
    },
    change_intent: "ADMINISTRATIVE_UPDATE",
    reason: "ok",
    operations: [
      {
        op: "update_follow_up",
        target: { entity_type: "FOLLOW_UP_SHEET", sheet_id: SHEET_ID },
        changes: { title: "Titre" },
      },
    ],
  });
  assert.equal(parsed.ok, true);
  console.log("  L parse update_follow_up: ok");
}

// --- M non-régression VISIT/PLANNING ---
{
  assert.equal(getSectionCapability("VISIT").mode, "AVAILABLE");
  assert.equal(getSectionCapability("PLANNING").mode, "AVAILABLE");
  console.log("  M VISIT/PLANNING AVAILABLE: ok");
}

console.log("ctx02c-follow-up-commit.test.ts: ok");
