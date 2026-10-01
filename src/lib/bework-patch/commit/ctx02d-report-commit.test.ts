/**
 * Tests CTX-02D — commit universel REPORT (update_report).
 * Fixtures locales — aucune écriture BDD.
 */
import assert from "node:assert/strict";
import { getSectionCapability } from "@/lib/bework-patch/capability";
import { evaluateCommitEligibility } from "@/lib/bework-patch/commit/eligibility";
import {
  REPORT_COMMIT_SUPPORTED_OPS,
  REPORT_COMMIT_UNSUPPORTED_OPS,
  isReportCommitSupportedOp,
  docToVersionInput,
} from "@/lib/bework-patch/commit/report-ops";
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
import { computeReportContextVersion } from "@/lib/bework-context/report-context-version";
import { parseBeworkPatch } from "@/lib/bework-patch/parse";

const DOC_ID = "report_ctx02d";
const PROJECT_ID = "proj_1";

function reportVersion(input?: {
  title?: string;
  quickNotes?: string | null;
  summary?: string | null;
}): number {
  return computeReportContextVersion(
    docToVersionInput({
      id: DOC_ID,
      kind: "COMPTE_RENDU",
      title: input?.title ?? "CR démo",
      status: "DRAFT",
      quickNotes: input?.quickNotes ?? "Note A",
      payloadJson: {
        title: input?.title ?? "CR démo",
        summary: input?.summary ?? "Résumé A",
        additionalNotes: null,
      },
    }),
  );
}

function reportSubgraph(opts?: {
  title?: string;
  kind?: string;
  otherDoc?: boolean;
}): ImpactSubgraph {
  const base = buildFixtureSubgraph54();
  const id = opts?.otherDoc ? "report_other" : DOC_ID;
  const title = opts?.title ?? "CR démo";
  const kind = opts?.kind ?? "COMPTE_RENDU";
  const payloadJson = {
    title,
    summary: "Résumé A",
    additionalNotes: null,
  };
  const contextVersion = computeReportContextVersion(
    docToVersionInput({
      id,
      kind,
      title,
      status: "DRAFT",
      quickNotes: "Note A",
      payloadJson,
    }),
  );
  return {
    ...base,
    projectId: PROJECT_ID,
    report: {
      id,
      projectId: PROJECT_ID,
      kind,
      title,
      status: "DRAFT",
      quickNotes: "Note A",
      payloadJson,
      contextVersion,
    },
  };
}

function reportPatch(overrides?: {
  base_version?: number;
  ops?: BeworkPatchV1["operations"];
  entity_id?: string;
}): BeworkPatchV1 {
  const version = overrides?.base_version ?? reportVersion();
  return {
    type: "bework_patch_v1",
    schema_version: 1,
    patch_id: "patch-report-ctx02d",
    origin: {
      section: "REPORT",
      project_id: PROJECT_ID,
      entity_id: overrides?.entity_id ?? DOC_ID,
      base_version: version,
    },
    change_intent: "DOCUMENT_EDIT",
    reason: "Ajustement démo CTX-02D",
    operations: overrides?.ops ?? [
      {
        op: "update_report",
        target: { entity_type: "SITE_DOCUMENT", document_id: DOC_ID },
        changes: { quick_notes: "Note B" },
      },
    ],
  };
}

{
  assert.equal(getSectionCapability("REPORT").mode, "AVAILABLE");
  assert.equal(getSectionCapability("NOTICE").mode, "AVAILABLE");
  assert.equal(getSectionCapability("FOLLOW_UP").mode, "AVAILABLE");
  console.log("  A capability: ok");
}

{
  assert.equal(reportVersion(), reportVersion());
  console.log("  B déterminisme: ok");
}

{
  assert.ok(isReportCommitSupportedOp("update_report"));
  assert.deepEqual([...REPORT_COMMIT_SUPPORTED_OPS], ["update_report"]);
  for (const op of REPORT_COMMIT_UNSUPPORTED_OPS) {
    assert.equal(isReportCommitSupportedOp(op), false);
  }
  console.log("  catalog: ok");
}

{
  const subgraph = reportSubgraph();
  const patch = reportPatch({
    base_version: subgraph.report!.contextVersion,
  });
  const impact = analyzePatchImpact({ patch, subgraph });
  assert.equal(impact.errors.length, 0);
  const elig = evaluateCommitEligibility({ patch, impact });
  assert.equal(elig.ok, true);
  if (elig.ok) assert.equal(elig.mode, "REPORT_ONLY");
  console.log("  C eligibility: ok");
}

{
  const subgraph = reportSubgraph();
  const patch = reportPatch({
    base_version: subgraph.report!.contextVersion,
    ops: [
      {
        op: "update_report",
        target: { entity_type: "SITE_DOCUMENT", document_id: DOC_ID },
        changes: {
          title: "Nouveau CR",
          summary: "Nouveau résumé",
          additional_notes: "Notes",
        },
      },
    ],
  });
  assert.equal(analyzePatchImpact({ patch, subgraph }).errors.length, 0);
  assert.equal(
    evaluateCommitEligibility({
      patch,
      impact: analyzePatchImpact({ patch, subgraph }),
    }).ok,
    true,
  );
  console.log("  D multi-fields: ok");
}

{
  const stale = validatePatchContext(reportPatch({ base_version: 1 }), {
    organizationId: "org",
    projectId: PROJECT_ID,
    currentVersion: 2,
  });
  assert.equal(stale.ok, false);
  console.log("  E stale version: ok");
}

{
  const subgraph = reportSubgraph();
  const patch = reportPatch({
    base_version: subgraph.report!.contextVersion,
  });
  const impact = analyzePatchImpact({ patch, subgraph });
  const versions = collectVersionSnapshot(subgraph);
  const fp1 = computePreviewFingerprint(
    buildFingerprintPayload({ patch, versions, impact, subgraph }),
  );
  const fp2 = computePreviewFingerprint(
    buildFingerprintPayload({
      patch,
      versions: { ...versions, reportVersion: versions.reportVersion! + 1 },
      impact,
      subgraph,
    }),
  );
  assert.notEqual(fp1, fp2);
  console.log("  F fingerprint: ok");
}

{
  const subgraph = reportSubgraph();
  const patch = reportPatch({
    base_version: subgraph.report!.contextVersion,
    ops: [
      {
        op: "update_document_section",
        target: { entity_type: "SITE_DOCUMENT", document_id: DOC_ID },
        changes: { text: "x" },
      },
    ],
  });
  assert.ok(analyzePatchImpact({ patch, subgraph }).errors.length > 0);
  console.log("  G section UNSUPPORTED: ok");
}

{
  const parsed = parseBeworkPatch({
    type: "bework_patch_v1",
    schema_version: 1,
    patch_id: "bad",
    origin: {
      section: "REPORT",
      project_id: PROJECT_ID,
      entity_id: DOC_ID,
      base_version: 1,
    },
    change_intent: "DOCUMENT_EDIT",
    reason: "x",
    operations: [
      {
        op: "update_report",
        target: { entity_type: "SITE_DOCUMENT", document_id: DOC_ID },
        changes: { organizationId: "hack" },
      },
    ],
  });
  assert.equal(parsed.ok, false);
  console.log("  H champ interdit: ok");
}

{
  const subgraph = reportSubgraph();
  const patch = reportPatch({
    base_version: subgraph.report!.contextVersion,
    ops: [
      {
        op: "update_report",
        target: { entity_type: "SITE_DOCUMENT", document_id: "report_other" },
        changes: { title: "Hack" },
      },
    ],
  });
  assert.ok(
    analyzePatchImpact({ patch, subgraph }).errors.some(
      (e) => e.code === "PROJECT_MISMATCH",
    ),
  );
  console.log("  I cross-document: ok");
}

{
  const subgraph = reportSubgraph({ kind: "NOTICE" });
  const patch = reportPatch({
    base_version: subgraph.report!.contextVersion,
  });
  assert.ok(
    analyzePatchImpact({ patch, subgraph }).errors.some(
      (e) => e.code === "PROJECT_MISMATCH",
    ),
  );
  console.log("  J wrong kind NOTICE: ok");
}

{
  assert.equal(getSectionCapability("NOTICE").mode, "AVAILABLE");
  const noticeId = "n1";
  const patch: BeworkPatchV1 = {
    type: "bework_patch_v1",
    schema_version: 1,
    patch_id: "notice-x",
    origin: {
      section: "NOTICE",
      project_id: PROJECT_ID,
      entity_id: noticeId,
      base_version: 1,
    },
    change_intent: "DOCUMENT_EDIT",
    reason: "x",
    operations: [
      {
        op: "update_notice",
        target: { entity_type: "SITE_DOCUMENT", document_id: noticeId },
        changes: { quick_notes: "x" },
      },
    ],
  };
  const subgraph = {
    ...reportSubgraph(),
    notice: {
      id: noticeId,
      projectId: PROJECT_ID,
      kind: "NOTICE" as const,
      title: "N",
      status: "DRAFT",
      quickNotes: null,
      payloadJson: {},
      contextVersion: 1,
    },
  };
  const elig = evaluateCommitEligibility({
    patch,
    impact: analyzePatchImpact({ patch, subgraph }),
  });
  assert.equal(elig.ok, true);
  if (elig.ok) assert.equal(elig.mode, "NOTICE_ONLY");
  console.log("  K NOTICE AVAILABLE (NOTICE_ONLY): ok");
}

{
  assert.notEqual(reportVersion({ quickNotes: "A" }), reportVersion({ quickNotes: "B" }));
  console.log("  L version change: ok");
}

console.log("ctx02d-report-commit.test.ts: ok");
