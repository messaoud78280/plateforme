/**
 * Tests CTX-02B — commit universel VISIT (sous-ensemble sûr update_visit).
 * Fixtures locales — aucune écriture BDD.
 */
import assert from "node:assert/strict";
import { getSectionCapability } from "@/lib/bework-patch/capability";
import { evaluateCommitEligibility } from "@/lib/bework-patch/commit/eligibility";
import {
  VISIT_COMMIT_SUPPORTED_OPS,
  VISIT_COMMIT_UNSUPPORTED_OPS,
  isVisitCommitSupportedOp,
} from "@/lib/bework-patch/commit/visit-ops";
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
import { computeVisitContextVersion } from "@/lib/bework-context/visit-context-version";
import { parseBeworkPatch } from "@/lib/bework-patch/parse";

const FIXTURE_VISIT_ID = "visit_ctx02b";
const FIXTURE_PROJECT_ID = "proj_1";

function visitVersion(input?: {
  subject?: string;
  comments?: string | null;
}): number {
  return computeVisitContextVersion({
    id: FIXTURE_VISIT_ID,
    subject: input?.subject ?? "Visite démo",
    status: "TO_PLAN",
    clientName: "Client URBAN",
    siteAddress: "1 rue Test",
    clientNeed: "Besoin initial",
    comments: input?.comments ?? "Commentaire A",
    measurements: [],
    mediaRefs: [],
  });
}

function visitSubgraph(opts?: {
  subject?: string;
  comments?: string | null;
  otherVisit?: boolean;
}): ImpactSubgraph {
  const base = buildFixtureSubgraph54();
  const subject = opts?.subject ?? "Visite démo";
  const comments = opts?.comments ?? "Commentaire A";
  const contextVersion = visitVersion({ subject, comments });
  return {
    ...base,
    projectId: FIXTURE_PROJECT_ID,
    visit: {
      id: opts?.otherVisit ? "visit_other" : FIXTURE_VISIT_ID,
      projectId: FIXTURE_PROJECT_ID,
      subject,
      status: "TO_PLAN",
      clientName: "Client URBAN",
      siteAddress: "1 rue Test",
      clientNeed: "Besoin initial",
      comments,
      contextVersion,
    },
  };
}

function visitPatch(overrides?: {
  base_version?: number;
  patch_id?: string;
  ops?: BeworkPatchV1["operations"];
  entity_id?: string;
}): BeworkPatchV1 {
  const version = overrides?.base_version ?? visitVersion();
  return {
    type: "bework_patch_v1",
    schema_version: 1,
    patch_id: overrides?.patch_id ?? "patch-visit-ctx02b",
    origin: {
      section: "VISIT",
      project_id: FIXTURE_PROJECT_ID,
      entity_id: overrides?.entity_id ?? FIXTURE_VISIT_ID,
      base_version: version,
    },
    change_intent: "FIELD_UPDATE",
    reason: "Ajustement démo CTX-02B",
    operations: overrides?.ops ?? [
      {
        op: "update_visit",
        target: {
          entity_type: "SITE_VISIT",
          visit_id: FIXTURE_VISIT_ID,
        },
        changes: { comments: "Commentaire B" },
      },
    ],
  };
}

// --- A capability ---
{
  assert.equal(getSectionCapability("PLANNING").mode, "AVAILABLE");
  assert.equal(getSectionCapability("VISIT").mode, "AVAILABLE");
  assert.equal(getSectionCapability("FOLLOW_UP").mode, "PREVIEW_ONLY");
  assert.equal(getSectionCapability("REPORT").mode, "PREVIEW_ONLY");
  assert.equal(getSectionCapability("NOTICE").mode, "PREVIEW_ONLY");
  console.log("  A capability: ok");
}

// --- catalog ---
{
  assert.ok(isVisitCommitSupportedOp("update_visit"));
  assert.deepEqual([...VISIT_COMMIT_SUPPORTED_OPS], ["update_visit"]);
  for (const op of VISIT_COMMIT_UNSUPPORTED_OPS) {
    assert.equal(isVisitCommitSupportedOp(op), false);
  }
  console.log("  catalog SUPPORTED/UNSUPPORTED: ok");
}

// --- B eligibility update_visit ---
{
  const subgraph = visitSubgraph();
  const patch = visitPatch({
    base_version: subgraph.visit!.contextVersion,
  });
  const impact = analyzePatchImpact({ patch, subgraph });
  assert.equal(impact.errors.length, 0);
  const elig = evaluateCommitEligibility({ patch, impact });
  assert.equal(elig.ok, true);
  if (elig.ok) {
    assert.equal(elig.mode, "VISIT_ONLY");
    assert.ok(elig.buttonLabel.toLowerCase().includes("visite"));
  }
  console.log("  B eligibility update_visit: ok");
}

// --- C multi fields ---
{
  const subgraph = visitSubgraph();
  const patch = visitPatch({
    base_version: subgraph.visit!.contextVersion,
    ops: [
      {
        op: "update_visit",
        target: { entity_type: "SITE_VISIT", visit_id: FIXTURE_VISIT_ID },
        changes: {
          subject: "Visite mise à jour",
          client_need: "Nouveau besoin",
          comments: "Note terrain",
        },
      },
    ],
  });
  const impact = analyzePatchImpact({ patch, subgraph });
  assert.equal(impact.errors.length, 0);
  const elig = evaluateCommitEligibility({ patch, impact });
  assert.equal(elig.ok, true);
  if (elig.ok) assert.equal(elig.mode, "VISIT_ONLY");
  console.log("  C multi-fields → VISIT_ONLY: ok");
}

// --- D stale version ---
{
  const patch = visitPatch({ base_version: 111 });
  const stale = validatePatchContext(patch, {
    organizationId: "org",
    projectId: FIXTURE_PROJECT_ID,
    currentVersion: 222,
  });
  assert.equal(stale.ok, false);
  assert.equal(stale.code, "VERSION_CONFLICT");
  console.log("  D stale version: ok");
}

// --- E fingerprint ---
{
  const subgraph = visitSubgraph();
  const patch = visitPatch({
    base_version: subgraph.visit!.contextVersion,
  });
  const impact = analyzePatchImpact({ patch, subgraph });
  const versions = collectVersionSnapshot(subgraph);
  assert.equal(versions.visitContextVersion, subgraph.visit!.contextVersion);
  const fp1 = computePreviewFingerprint(
    buildFingerprintPayload({ patch, versions, impact, subgraph }),
  );
  const versions2 = {
    ...versions,
    visitContextVersion: versions.visitContextVersion! + 1,
  };
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

// --- F measurement UNSUPPORTED ---
{
  const subgraph = visitSubgraph();
  const patch = visitPatch({
    base_version: subgraph.visit!.contextVersion,
    ops: [
      {
        op: "update_measurement",
        target: {
          entity_type: "SITE_VISIT_MEASUREMENT",
          visit_id: FIXTURE_VISIT_ID,
          measurement_id: "m1",
        },
        changes: { observation: "x" },
      },
    ],
  });
  const impact = analyzePatchImpact({ patch, subgraph });
  assert.ok(impact.errors.length > 0);
  const elig = evaluateCommitEligibility({ patch, impact });
  assert.equal(elig.ok, false);
  console.log("  F update_measurement UNSUPPORTED: ok");
}

// --- G forbidden field (via impact whitelist) ---
{
  const parsed = parseBeworkPatch({
    type: "bework_patch_v1",
    schema_version: 1,
    patch_id: "bad-field",
    origin: {
      section: "VISIT",
      project_id: FIXTURE_PROJECT_ID,
      entity_id: FIXTURE_VISIT_ID,
      base_version: 1,
    },
    change_intent: "FIELD_UPDATE",
    reason: "x",
    operations: [
      {
        op: "update_visit",
        target: { entity_type: "SITE_VISIT", visit_id: FIXTURE_VISIT_ID },
        changes: { organizationId: "hack" },
      },
    ],
  });
  assert.equal(parsed.ok, false);
  console.log("  G champ interdit organizationId: ok");
}

// --- H cross-visit ---
{
  const subgraph = visitSubgraph();
  const patch = visitPatch({
    base_version: subgraph.visit!.contextVersion,
    ops: [
      {
        op: "update_visit",
        target: { entity_type: "SITE_VISIT", visit_id: "visit_other" },
        changes: { comments: "hack" },
      },
    ],
  });
  const impact = analyzePatchImpact({ patch, subgraph });
  assert.ok(impact.errors.some((e) => e.code === "PROJECT_MISMATCH"));
  const elig = evaluateCommitEligibility({ patch, impact });
  assert.equal(elig.ok, false);
  console.log("  H cross-visit: ok");
}

// --- I FOLLOW_UP still PREVIEW_ONLY ---
{
  const patch: BeworkPatchV1 = {
    type: "bework_patch_v1",
    schema_version: 1,
    patch_id: "fu-x",
    origin: {
      section: "FOLLOW_UP",
      project_id: FIXTURE_PROJECT_ID,
      entity_id: "fu_1",
      base_version: 1,
    },
    change_intent: "PROGRESS_UPDATE",
    reason: "x",
    operations: [],
  };
  const impact = analyzePatchImpact({
    patch,
    subgraph: visitSubgraph(),
  });
  const elig = evaluateCommitEligibility({ patch, impact });
  assert.equal(elig.ok, false);
  if (!elig.ok) assert.equal(elig.code, "PREVIEW_ONLY");
  console.log("  I FOLLOW_UP PREVIEW_ONLY: ok");
}

// --- J REPORT/NOTICE ---
{
  for (const section of ["REPORT", "NOTICE"] as const) {
    const patch: BeworkPatchV1 = {
      type: "bework_patch_v1",
      schema_version: 1,
      patch_id: `${section}-x`,
      origin: {
        section,
        project_id: FIXTURE_PROJECT_ID,
        entity_id: "doc_1",
        base_version: 1,
      },
      change_intent: "DOCUMENT_EDIT",
      reason: "x",
      operations: [],
    };
    const elig = evaluateCommitEligibility({
      patch,
      impact: analyzePatchImpact({ patch, subgraph: visitSubgraph() }),
    });
    assert.equal(elig.ok, false);
    if (!elig.ok) assert.equal(elig.code, "PREVIEW_ONLY");
  }
  console.log("  J REPORT/NOTICE PREVIEW_ONLY: ok");
}

// --- K CTX-07 version change conceptuel ---
{
  const x = visitVersion({ comments: "A" });
  const y = visitVersion({ comments: "B" });
  assert.notEqual(x, y);
  console.log("  K versionBefore != versionAfter: ok");
}

// --- L parse update_visit ---
{
  const parsed = parseBeworkPatch({
    type: "bework_patch_v1",
    schema_version: 1,
    patch_id: "parse-ok",
    origin: {
      section: "VISIT",
      project_id: FIXTURE_PROJECT_ID,
      entity_id: FIXTURE_VISIT_ID,
      base_version: 1,
    },
    change_intent: "FIELD_UPDATE",
    reason: "ok",
    operations: [
      {
        op: "update_visit",
        target: { entity_type: "SITE_VISIT", visit_id: FIXTURE_VISIT_ID },
        changes: { subject: "Nouveau sujet" },
      },
    ],
  });
  assert.equal(parsed.ok, true);
  if (parsed.ok) {
    assert.equal(parsed.patch.operations[0]?.op, "update_visit");
  }
  console.log("  L parse update_visit: ok");
}

// --- M PLANNING non-régression ---
{
  assert.equal(getSectionCapability("PLANNING").mode, "AVAILABLE");
  console.log("  M PLANNING AVAILABLE: ok");
}

// --- N add_measurement UNSUPPORTED ---
{
  const subgraph = visitSubgraph();
  const patch = visitPatch({
    base_version: subgraph.visit!.contextVersion,
    ops: [
      {
        op: "add_measurement",
        target: { entity_type: "SITE_VISIT", visit_id: FIXTURE_VISIT_ID },
        measurement: { label: "Mur", unit: "m²" },
      },
    ],
  });
  const impact = analyzePatchImpact({ patch, subgraph });
  assert.ok(impact.errors.length > 0);
  assert.equal(evaluateCommitEligibility({ patch, impact }).ok, false);
  console.log("  N add_measurement UNSUPPORTED: ok");
}

console.log("ctx02b-visit-commit.test.ts: ok");
