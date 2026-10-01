/**
 * Tests CTX-02E — commit universel NOTICE (update_notice).
 * Fixtures locales — aucune écriture BDD.
 */
import assert from "node:assert/strict";
import { getSectionCapability } from "@/lib/bework-patch/capability";
import { evaluateCommitEligibility } from "@/lib/bework-patch/commit/eligibility";
import {
  NOTICE_COMMIT_SUPPORTED_OPS,
  NOTICE_COMMIT_UNSUPPORTED_OPS,
  isNoticeCommitSupportedOp,
  noticeDocToVersionInput,
  computeNoticeContextVersion,
} from "@/lib/bework-patch/commit/notice-ops";
import {
  REPORT_COMMIT_SUPPORTED_OPS,
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

const DOC_ID = "notice_ctx02e";
const PROJECT_ID = "proj_1";

function noticeVersion(input?: {
  title?: string;
  quickNotes?: string | null;
  summary?: string | null;
}): number {
  return computeNoticeContextVersion(
    noticeDocToVersionInput({
      id: DOC_ID,
      kind: "NOTICE",
      title: input?.title ?? "Notice démo",
      status: "DRAFT",
      quickNotes: input?.quickNotes ?? "Note A",
      payloadJson: {
        title: input?.title ?? "Notice démo",
        summary: input?.summary ?? "Résumé A",
        additionalNotes: null,
      },
    }),
  );
}

function noticeSubgraph(opts?: {
  title?: string;
  kind?: string;
  otherDoc?: boolean;
}): ImpactSubgraph {
  const base = buildFixtureSubgraph54();
  const id = opts?.otherDoc ? "notice_other" : DOC_ID;
  const title = opts?.title ?? "Notice démo";
  const kind = opts?.kind ?? "NOTICE";
  const payloadJson = {
    title,
    summary: "Résumé A",
    additionalNotes: null,
  };
  const contextVersion = computeNoticeContextVersion(
    noticeDocToVersionInput({
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
    notice: {
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

function noticePatch(overrides?: {
  base_version?: number;
  ops?: BeworkPatchV1["operations"];
  entity_id?: string;
}): BeworkPatchV1 {
  const version = overrides?.base_version ?? noticeVersion();
  return {
    type: "bework_patch_v1",
    schema_version: 1,
    patch_id: "patch-notice-ctx02e",
    origin: {
      section: "NOTICE",
      project_id: PROJECT_ID,
      entity_id: overrides?.entity_id ?? DOC_ID,
      base_version: version,
    },
    change_intent: "DOCUMENT_EDIT",
    reason: "Ajustement démo CTX-02E",
    operations: overrides?.ops ?? [
      {
        op: "update_notice",
        target: { entity_type: "SITE_DOCUMENT", document_id: DOC_ID },
        changes: { quick_notes: "Note B" },
      },
    ],
  };
}

function reportPatchOnNoticeDoc(): BeworkPatchV1 {
  const version = computeReportContextVersion(
    docToVersionInput({
      id: DOC_ID,
      kind: "NOTICE",
      title: "Notice démo",
      status: "DRAFT",
      quickNotes: "Note A",
      payloadJson: { title: "Notice démo", summary: "Résumé A" },
    }),
  );
  return {
    type: "bework_patch_v1",
    schema_version: 1,
    patch_id: "patch-report-on-notice",
    origin: {
      section: "REPORT",
      project_id: PROJECT_ID,
      entity_id: DOC_ID,
      base_version: version,
    },
    change_intent: "DOCUMENT_EDIT",
    reason: "cross",
    operations: [
      {
        op: "update_report",
        target: { entity_type: "SITE_DOCUMENT", document_id: DOC_ID },
        changes: { quick_notes: "Hack" },
      },
    ],
  };
}

// --- A capability finale ---
{
  assert.equal(getSectionCapability("TAKEOFF").mode, "AVAILABLE");
  assert.equal(getSectionCapability("QUOTE").mode, "AVAILABLE");
  assert.equal(getSectionCapability("PLANNING").mode, "AVAILABLE");
  assert.equal(getSectionCapability("VISIT").mode, "AVAILABLE");
  assert.equal(getSectionCapability("FOLLOW_UP").mode, "AVAILABLE");
  assert.equal(getSectionCapability("REPORT").mode, "AVAILABLE");
  assert.equal(getSectionCapability("NOTICE").mode, "AVAILABLE");
  console.log("  A capability: ok");
}

// --- B version stable ---
{
  assert.equal(noticeVersion(), noticeVersion());
  console.log("  B déterminisme: ok");
}

// --- catalog ---
{
  assert.ok(isNoticeCommitSupportedOp("update_notice"));
  assert.deepEqual([...NOTICE_COMMIT_SUPPORTED_OPS], ["update_notice"]);
  for (const op of NOTICE_COMMIT_UNSUPPORTED_OPS) {
    assert.equal(isNoticeCommitSupportedOp(op), false);
  }
  assert.ok(isReportCommitSupportedOp("update_report"));
  assert.deepEqual([...REPORT_COMMIT_SUPPORTED_OPS], ["update_report"]);
  console.log("  catalog: ok");
}

// --- C eligibility ---
{
  const subgraph = noticeSubgraph();
  const patch = noticePatch({
    base_version: subgraph.notice!.contextVersion,
  });
  const impact = analyzePatchImpact({ patch, subgraph });
  assert.equal(impact.errors.length, 0);
  const elig = evaluateCommitEligibility({ patch, impact });
  assert.equal(elig.ok, true);
  if (elig.ok) assert.equal(elig.mode, "NOTICE_ONLY");
  console.log("  C eligibility: ok");
}

// --- D multi-fields ---
{
  const subgraph = noticeSubgraph();
  const patch = noticePatch({
    base_version: subgraph.notice!.contextVersion,
    ops: [
      {
        op: "update_notice",
        target: { entity_type: "SITE_DOCUMENT", document_id: DOC_ID },
        changes: {
          title: "Nouvelle notice",
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

// --- E stale base_version ---
{
  const stale = validatePatchContext(noticePatch({ base_version: 1 }), {
    organizationId: "org",
    projectId: PROJECT_ID,
    currentVersion: 2,
  });
  assert.equal(stale.ok, false);
  console.log("  E stale version: ok");
}

// --- F fingerprint ---
{
  const subgraph = noticeSubgraph();
  const patch = noticePatch({
    base_version: subgraph.notice!.contextVersion,
  });
  const impact = analyzePatchImpact({ patch, subgraph });
  const versions = collectVersionSnapshot(subgraph);
  const fp1 = computePreviewFingerprint(
    buildFingerprintPayload({ patch, versions, impact, subgraph }),
  );
  const fp2 = computePreviewFingerprint(
    buildFingerprintPayload({
      patch,
      versions: { ...versions, noticeVersion: versions.noticeVersion! + 1 },
      impact,
      subgraph,
    }),
  );
  assert.notEqual(fp1, fp2);
  console.log("  F fingerprint: ok");
}

// --- G section UNSUPPORTED ---
{
  const subgraph = noticeSubgraph();
  const patch = noticePatch({
    base_version: subgraph.notice!.contextVersion,
    ops: [
      {
        op: "update_document_section",
        target: { entity_type: "SITE_DOCUMENT", document_id: DOC_ID },
        changes: { text: "x" },
      },
    ],
  });
  assert.ok(analyzePatchImpact({ patch, subgraph }).errors.length > 0);
  const elig = evaluateCommitEligibility({
    patch,
    impact: analyzePatchImpact({ patch, subgraph }),
  });
  assert.equal(elig.ok, false);
  console.log("  G section UNSUPPORTED: ok");
}

// --- H / I champ système ---
{
  const parsed = parseBeworkPatch({
    type: "bework_patch_v1",
    schema_version: 1,
    patch_id: "bad",
    origin: {
      section: "NOTICE",
      project_id: PROJECT_ID,
      entity_id: DOC_ID,
      base_version: 1,
    },
    change_intent: "DOCUMENT_EDIT",
    reason: "x",
    operations: [
      {
        op: "update_notice",
        target: { entity_type: "SITE_DOCUMENT", document_id: DOC_ID },
        changes: { organizationId: "hack", kind: "COMPTE_RENDU" },
      },
    ],
  });
  assert.equal(parsed.ok, false);
  console.log("  I champ système: ok");
}

// --- J cross-document ---
{
  const subgraph = noticeSubgraph();
  const patch = noticePatch({
    base_version: subgraph.notice!.contextVersion,
    ops: [
      {
        op: "update_notice",
        target: { entity_type: "SITE_DOCUMENT", document_id: "notice_other" },
        changes: { title: "Hack" },
      },
    ],
  });
  assert.ok(
    analyzePatchImpact({ patch, subgraph }).errors.some(
      (e) => e.code === "PROJECT_MISMATCH",
    ),
  );
  console.log("  J cross-document: ok");
}

// --- M NOTICE ciblant COMPTE_RENDU (wrong kind) ---
{
  const subgraph = noticeSubgraph({ kind: "COMPTE_RENDU" });
  const patch = noticePatch({
    base_version: subgraph.notice!.contextVersion,
  });
  assert.ok(
    analyzePatchImpact({ patch, subgraph }).errors.some(
      (e) => e.code === "PROJECT_MISMATCH",
    ),
  );
  console.log("  M NOTICE→COMPTE_RENDU: ok");
}

// --- N REPORT ciblant NOTICE (non-régression CTX-02D) ---
{
  const base = buildFixtureSubgraph54();
  const subgraph: ImpactSubgraph = {
    ...base,
    projectId: PROJECT_ID,
    report: {
      id: DOC_ID,
      projectId: PROJECT_ID,
      kind: "NOTICE",
      title: "Notice démo",
      status: "DRAFT",
      quickNotes: "Note A",
      payloadJson: { title: "Notice démo", summary: "Résumé A" },
      contextVersion: computeReportContextVersion(
        docToVersionInput({
          id: DOC_ID,
          kind: "NOTICE",
          title: "Notice démo",
          status: "DRAFT",
          quickNotes: "Note A",
          payloadJson: { title: "Notice démo", summary: "Résumé A" },
        }),
      ),
    },
  };
  const patch = reportPatchOnNoticeDoc();
  assert.ok(
    analyzePatchImpact({ patch, subgraph }).errors.some(
      (e) => e.code === "PROJECT_MISMATCH",
    ),
  );
  console.log("  N REPORT→NOTICE: ok");
}

// --- O média / update_report sur NOTICE ---
{
  const subgraph = noticeSubgraph();
  const patch = noticePatch({
    base_version: subgraph.notice!.contextVersion,
    ops: [
      {
        op: "update_report",
        target: { entity_type: "SITE_DOCUMENT", document_id: DOC_ID },
        changes: { quick_notes: "x" },
      },
    ],
  });
  assert.ok(analyzePatchImpact({ patch, subgraph }).errors.length > 0);
  const elig = evaluateCommitEligibility({
    patch,
    impact: analyzePatchImpact({ patch, subgraph }),
  });
  assert.equal(elig.ok, false);
  console.log("  O média/update_report UNSUPPORTED: ok");
}

// --- P payload complet via update_text ---
{
  const subgraph = noticeSubgraph();
  const patch = noticePatch({
    base_version: subgraph.notice!.contextVersion,
    ops: [
      {
        op: "update_text",
        target: { entity_type: "SITE_DOCUMENT", id: DOC_ID },
        changes: { field: "payloadJson", text: "{}" },
      },
    ],
  });
  assert.ok(analyzePatchImpact({ patch, subgraph }).errors.length > 0);
  console.log("  P payload complet: ok");
}

// --- L version change ---
{
  assert.notEqual(
    noticeVersion({ quickNotes: "A" }),
    noticeVersion({ quickNotes: "B" }),
  );
  // KIND isolé dans l'empreinte
  const noticeV = computeNoticeContextVersion(
    noticeDocToVersionInput({
      id: DOC_ID,
      kind: "NOTICE",
      title: "Same",
      status: "DRAFT",
      quickNotes: null,
      payloadJson: { title: "Same" },
    }),
  );
  const reportV = computeReportContextVersion(
    docToVersionInput({
      id: DOC_ID,
      kind: "COMPTE_RENDU",
      title: "Same",
      status: "DRAFT",
      quickNotes: null,
      payloadJson: { title: "Same" },
    }),
  );
  assert.notEqual(noticeV, reportV);
  console.log("  L version change + kind isolation: ok");
}

console.log("ctx02e-notice-commit.test.ts: ok");
