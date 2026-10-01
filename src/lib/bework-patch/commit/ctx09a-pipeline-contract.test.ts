/**
 * CTX-09A — Contrat pipeline universel des sections AVAILABLE.
 * Régression : NOTICE doit produire impact + fingerprint + eligibility
 * (défaut audit : analyze.ts + analyze/route omettaient NOTICE).
 */
import assert from "node:assert/strict";
import {
  BEWORK_PATCH_SECTIONS,
  type BeworkPatchV1,
} from "@/lib/bework-patch/types";
import { getSectionCapability } from "@/lib/bework-patch/capability";
import {
  isUniversalPipelineSection,
  universalPipelineSections,
} from "@/lib/bework-patch/universal-pipeline";
import { analyzeBeworkPatchInput } from "@/lib/bework-patch/analyze";
import { analyzePatchImpact } from "@/lib/bework-patch/impact/analyze-impact";
import { buildFixtureSubgraph54 } from "@/lib/bework-patch/impact/fixtures";
import type { ImpactSubgraph } from "@/lib/bework-patch/impact/types";
import { buildCommitPreviewMeta } from "@/lib/bework-patch/commit/commit-universal";
import {
  buildFingerprintPayload,
  collectVersionSnapshot,
  computePreviewFingerprint,
} from "@/lib/bework-patch/commit/fingerprint";
import { evaluateCommitEligibility } from "@/lib/bework-patch/commit/eligibility";
import {
  computeNoticeContextVersion,
  noticeDocToVersionInput,
  isNoticeCommitSupportedOp,
  NOTICE_UPDATE_ALLOWED_FIELDS,
} from "@/lib/bework-patch/commit/notice-ops";
import { validatePatchContext } from "@/lib/bework-patch/validate-context";
import { parseBeworkPatch } from "@/lib/bework-patch/parse";

const DOC_ID = "notice_ctx09a";
const PROJECT_ID = "proj_1";

function noticeVersion(quickNotes = "Note A"): number {
  return computeNoticeContextVersion(
    noticeDocToVersionInput({
      id: DOC_ID,
      kind: "NOTICE",
      title: "Notice démo",
      status: "DRAFT",
      quickNotes,
      payloadJson: {
        title: "Notice démo",
        summary: "Résumé A",
        additionalNotes: null,
      },
    }),
  );
}

function noticeSubgraph(): ImpactSubgraph {
  const base = buildFixtureSubgraph54();
  const payloadJson = {
    title: "Notice démo",
    summary: "Résumé A",
    additionalNotes: null,
  };
  const contextVersion = noticeVersion();
  return {
    ...base,
    projectId: PROJECT_ID,
    notice: {
      id: DOC_ID,
      projectId: PROJECT_ID,
      kind: "NOTICE",
      title: "Notice démo",
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
  patch_id?: string;
}): BeworkPatchV1 {
  const version = overrides?.base_version ?? noticeVersion();
  return {
    type: "bework_patch_v1",
    schema_version: 1,
    patch_id: overrides?.patch_id ?? "patch-notice-ctx09a",
    origin: {
      section: "NOTICE",
      project_id: PROJECT_ID,
      entity_id: DOC_ID,
      base_version: version,
    },
    change_intent: "DOCUMENT_EDIT",
    reason: "CTX-09A",
    operations: overrides?.ops ?? [
      {
        op: "update_notice",
        target: { entity_type: "SITE_DOCUMENT", document_id: DOC_ID },
        changes: { quick_notes: "Note B" },
      },
    ],
  };
}

// --- Contrat : toute section AVAILABLE doit être dans le pipeline universel ---
{
  const available = universalPipelineSections();
  assert.deepEqual(
    [...available].sort(),
    [
      "FOLLOW_UP",
      "NOTICE",
      "PLANNING",
      "QUOTE",
      "REPORT",
      "TAKEOFF",
      "VISIT",
    ].sort(),
  );
  for (const section of BEWORK_PATCH_SECTIONS) {
    const cap = getSectionCapability(section);
    if (cap.mode === "AVAILABLE") {
      assert.equal(
        isUniversalPipelineSection(section),
        true,
        `${section} AVAILABLE sans pipeline universel`,
      );
    }
  }
  console.log("  contract AVAILABLE → pipeline: ok");
}

// --- RÉGRESSION CRITIQUE : analyze doit produire impact NOTICE ---
{
  const patch = noticePatch();
  const subgraph = noticeSubgraph();
  const analysis = analyzeBeworkPatchInput({
    raw: patch,
    subgraph,
  });
  assert.equal(analysis.ok, true, "analyze NOTICE doit être ok");
  assert.ok(
    analysis.impact,
    "RÉGRESSION: impact NOTICE null — analyze.ts omettait NOTICE (AUDIT-CTX-02)",
  );
  assert.equal(
    analysis.canCommit,
    true,
    "RÉGRESSION: canCommit NOTICE false — analyze.ts omettait NOTICE",
  );
  assert.equal(analysis.capability.mode, "AVAILABLE");
  console.log("  NOTICE analyze impact+canCommit: ok");
}

// --- Analyze → fingerprint → eligibility (commitMeta logique) ---
{
  const patch = noticePatch();
  const subgraph = noticeSubgraph();
  const impact = analyzePatchImpact({ patch, subgraph });
  assert.equal(impact.errors.length, 0);
  const meta = buildCommitPreviewMeta({ patch, impact, subgraph });
  assert.ok(meta.fingerprint.length >= 32);
  assert.equal(meta.eligibility.ok, true);
  if (meta.eligibility.ok) {
    assert.equal(meta.eligibility.mode, "NOTICE_ONLY");
  }
  assert.equal(meta.versions.noticeVersion, subgraph.notice!.contextVersion);

  // Même fingerprint recalculé (simule commit sans changement DB)
  const versions = collectVersionSnapshot(subgraph);
  const fp2 = computePreviewFingerprint(
    buildFingerprintPayload({ patch, versions, impact, subgraph }),
  );
  assert.equal(meta.fingerprint, fp2);
  console.log("  NOTICE fingerprint analyze=commit: ok");
}

// --- Safe integer ---
{
  const v = noticeVersion();
  assert.equal(Number.isSafeInteger(v), true);
  assert.ok(v >= 1);
  assert.ok(v <= Number.MAX_SAFE_INTEGER);
  console.log("  NOTICE safe integer: ok");
}

// --- base_version stale ---
{
  const stale = validatePatchContext(noticePatch({ base_version: 1 }), {
    organizationId: "org",
    projectId: PROJECT_ID,
    currentVersion: noticeVersion(),
  });
  assert.equal(stale.ok, false);
  console.log("  NOTICE base_version stale: ok");
}

// --- fingerprint stale ---
{
  const patch = noticePatch();
  const subgraph = noticeSubgraph();
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
  console.log("  NOTICE fingerprint stale: ok");
}

// --- Unsupported ops → canCommit/eligibility false ---
{
  const subgraph = noticeSubgraph();
  const patch = noticePatch({
    ops: [
      {
        op: "update_document_section",
        target: { entity_type: "SITE_DOCUMENT", document_id: DOC_ID },
        changes: { text: "x" },
      },
    ],
  });
  const impact = analyzePatchImpact({ patch, subgraph });
  assert.ok(impact.errors.length > 0);
  const elig = evaluateCommitEligibility({ patch, impact });
  assert.equal(elig.ok, false);
  const analysis = analyzeBeworkPatchInput({ raw: patch, subgraph });
  assert.equal(analysis.canCommit, false);
  console.log("  NOTICE unsupported → !canCommit: ok");
}

// --- Isolation REPORT/NOTICE ---
{
  const subgraph = noticeSubgraph();
  // NOTICE on wrong kind already in notice with kind COMPTE_RENDU
  const badKind: ImpactSubgraph = {
    ...subgraph,
    notice: {
      ...subgraph.notice!,
      kind: "COMPTE_RENDU",
      contextVersion: computeNoticeContextVersion(
        noticeDocToVersionInput({
          id: DOC_ID,
          kind: "COMPTE_RENDU",
          title: "Notice démo",
          status: "DRAFT",
          quickNotes: "Note A",
          payloadJson: subgraph.notice!.payloadJson,
        }),
      ),
    },
  };
  const patch = noticePatch({
    base_version: badKind.notice!.contextVersion,
  });
  assert.ok(
    analyzePatchImpact({ patch, subgraph: badKind }).errors.some(
      (e) => e.code === "PROJECT_MISMATCH",
    ),
  );
  console.log("  NOTICE→COMPTE_RENDU REFUS: ok");
}

// --- Whitelist inchangée ---
{
  assert.ok(isNoticeCommitSupportedOp("update_notice"));
  assert.deepEqual([...NOTICE_UPDATE_ALLOWED_FIELDS], [
    "title",
    "quick_notes",
    "summary",
    "additional_notes",
  ]);
  console.log("  whitelist NOTICE inchangée: ok");
}

// --- Preview = commit fields (directChanges) ---
{
  const patch = noticePatch({
    ops: [
      {
        op: "update_notice",
        target: { entity_type: "SITE_DOCUMENT", document_id: DOC_ID },
        changes: {
          title: "Nouveau titre",
          summary: "Nouveau résumé",
          additional_notes: "Notes",
          quick_notes: "QN",
        },
      },
    ],
  });
  const subgraph = noticeSubgraph();
  const impact = analyzePatchImpact({ patch, subgraph });
  assert.equal(impact.errors.length, 0);
  assert.equal(impact.directChanges.length, 1);
  const after = impact.directChanges[0]!.after as Record<string, unknown>;
  assert.equal(after.title, "Nouveau titre");
  assert.equal(after.summary, "Nouveau résumé");
  assert.equal(after.additional_notes, "Notes");
  assert.equal(after.quick_notes, "QN");
  console.log("  preview=commit fields: ok");
}

// --- Parse + eligibility pipeline ---
{
  const raw = noticePatch();
  const parsed = parseBeworkPatch(raw);
  assert.equal(parsed.ok, true);
  if (parsed.ok) {
    const subgraph = noticeSubgraph();
    const impact = analyzePatchImpact({ patch: parsed.patch, subgraph });
    const elig = evaluateCommitEligibility({
      patch: parsed.patch,
      impact,
    });
    assert.equal(elig.ok, true);
  }
  console.log("  parse→eligibility: ok");
}

console.log("ctx09a-pipeline-contract.test.ts: ok");
