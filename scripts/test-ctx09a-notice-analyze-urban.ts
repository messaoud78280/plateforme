/**
 * Smoke CTX-09A — NOTICE analyze pipeline prêt (lecture seule, stop avant commit).
 * Aucune écriture production.
 */
import {
  getScriptDatabaseUrlCandidatesForLongJobs,
  loadScriptEnv,
} from "./load-script-env";

process.env.NODE_TLS_REJECT_UNAUTHORIZED ??= "0";
loadScriptEnv();
process.env.DATABASE_URL =
  getScriptDatabaseUrlCandidatesForLongJobs()[0] ?? process.env.DATABASE_URL;

const ORG_ID = "cmt2nx23j00021k6btoov39gr";
const C01 = "cmuh69adc00011423ry0hhj7s";
const SCOPE_ID = "cmui2yaj20001dli4kof4j59b";

async function main() {
  const { prisma } = await import("../src/lib/prisma");
  const { getSectionCapability } = await import(
    "../src/lib/bework-patch/capability"
  );
  const { buildUniversalPatchContext } = await import(
    "../src/lib/bework-patch/build-context"
  );
  const { loadImpactSubgraph } = await import(
    "../src/lib/bework-patch/impact/load-subgraph"
  );
  const { analyzePatchImpact } = await import(
    "../src/lib/bework-patch/impact/analyze-impact"
  );
  const { analyzeBeworkPatchInput } = await import(
    "../src/lib/bework-patch/analyze"
  );
  const { buildCommitPreviewMeta } = await import(
    "../src/lib/bework-patch/commit/commit-universal"
  );
  const { isUniversalPipelineSection, universalPipelineSections } =
    await import("../src/lib/bework-patch/universal-pipeline");
  const {
    computeNoticeContextVersion,
    noticeDocToVersionInput,
  } = await import("../src/lib/bework-patch/commit/notice-ops");

  const caps = Object.fromEntries(
    (
      [
        "TAKEOFF",
        "QUOTE",
        "PLANNING",
        "VISIT",
        "FOLLOW_UP",
        "REPORT",
        "NOTICE",
      ] as const
    ).map((s) => [s, getSectionCapability(s).mode]),
  );
  for (const [k, v] of Object.entries(caps)) {
    if (v !== "AVAILABLE") throw new Error(`${k}=${v}`);
  }
  if (!isUniversalPipelineSection("NOTICE")) {
    throw new Error("NOTICE not in universal pipeline");
  }
  if (!universalPipelineSections().includes("NOTICE")) {
    throw new Error("NOTICE missing from universalPipelineSections");
  }

  const doc = await prisma.siteDocument.findFirst({
    where: { organizationId: ORG_ID, kind: "NOTICE" },
    select: {
      id: true,
      projectId: true,
      kind: true,
      title: true,
      status: true,
      quickNotes: true,
      payloadJson: true,
    },
    orderBy: { updatedAt: "desc" },
  });
  if (!doc) {
    console.log(
      JSON.stringify({
        writePerformed: false,
        notice: "ABSENT — smoke analyze skippé",
        capabilities: caps,
      }),
    );
    return;
  }

  const v1 = computeNoticeContextVersion(noticeDocToVersionInput(doc));
  const v2 = computeNoticeContextVersion(noticeDocToVersionInput(doc));
  if (v1 !== v2) throw new Error("version unstable");

  const ctx = await buildUniversalPatchContext({
    orgId: ORG_ID,
    section: "NOTICE",
    projectId: doc.projectId,
    entityId: doc.id,
  });
  if (!ctx) throw new Error("context null");
  if (ctx.target.version !== v1) throw new Error("context version mismatch");

  const patch = {
    type: "bework_patch_v1" as const,
    schema_version: 1 as const,
    patch_id: `smoke-ctx09a-notice-readonly-${Date.now()}`,
    origin: {
      section: "NOTICE" as const,
      project_id: doc.projectId,
      entity_id: doc.id,
      base_version: v1,
    },
    change_intent: "DOCUMENT_EDIT" as const,
    reason: "CTX-09A smoke lecture seule — ne pas committer",
    operations: [
      {
        op: "update_notice" as const,
        target: {
          entity_type: "SITE_DOCUMENT" as const,
          document_id: doc.id,
        },
        changes: { quick_notes: doc.quickNotes ?? "smoke-preview-only" },
      },
    ],
  };

  const subgraph = await loadImpactSubgraph({
    orgId: ORG_ID,
    projectId: doc.projectId,
    patch,
  });
  if (!subgraph.notice) throw new Error("subgraph.notice null");
  if (subgraph.notice.kind !== "NOTICE") throw new Error("kind");

  const analysis = analyzeBeworkPatchInput({ raw: patch, subgraph, context: ctx });
  if (!analysis.impact) throw new Error("impact null after CTX-09A");
  if (!analysis.canCommit) throw new Error("canCommit false");

  const impact = analyzePatchImpact({ patch, subgraph });
  const meta = buildCommitPreviewMeta({ patch, impact, subgraph });
  if (!meta.fingerprint) throw new Error("no fingerprint");
  if (!meta.eligibility.ok) throw new Error("eligibility false");
  if (meta.eligibility.ok && meta.eligibility.mode !== "NOTICE_ONLY") {
    throw new Error(`mode=${meta.eligibility.mode}`);
  }

  // Unsupported must not canCommit
  const badPatch = {
    ...patch,
    patch_id: `${patch.patch_id}-bad`,
    operations: [
      {
        op: "update_document_section" as const,
        target: {
          entity_type: "SITE_DOCUMENT" as const,
          document_id: doc.id,
        },
        changes: { text: "x" },
      },
    ],
  };
  const badAnalysis = analyzeBeworkPatchInput({
    raw: badPatch,
    subgraph,
  });
  if (badAnalysis.canCommit) throw new Error("unsupported canCommit");

  const study = await prisma.prepStudy.findFirst({
    where: {
      organizationId: ORG_ID,
      projectId: C01,
      scopeId: SCOPE_ID,
      archivedAt: null,
    },
    select: { id: true, version: true },
    orderBy: { updatedAt: "desc" },
  });
  if (!study) throw new Error("C-01 missing");
  const plan = await prisma.prepSchedulePlan.findFirst({
    where: { organizationId: ORG_ID, projectId: C01, studyId: study.id },
    select: { revisionNumber: true, studyVersionAtGeneration: true },
  });
  const transfer = await prisma.prepQuoteTransfer.findFirst({
    where: { organizationId: ORG_ID, quote: { number: "DEMO-2026-0002" } },
    orderBy: { createdAt: "desc" },
    select: { studyVersion: true },
  });
  const takeoffCtx = await buildUniversalPatchContext({
    orgId: ORG_ID,
    section: "TAKEOFF",
    projectId: C01,
    entityId: study.id,
  });
  const td = takeoffCtx?.data as {
    counts?: { parameters: number; lines: number };
    sources?: Array<{ id: string; ged?: { name?: string } | null }>;
  };

  console.log(
    JSON.stringify(
      {
        writePerformed: false,
        stoppedBeforeCommit: true,
        capabilities: caps,
        noticeAnalyze: {
          documentId: doc.id,
          projectId: doc.projectId,
          kind: doc.kind,
          version: v1,
          contextOk: true,
          subgraphOk: true,
          impactOk: true,
          canCommit: analysis.canCommit,
          fingerprintPresent: !!meta.fingerprint,
          eligibilityMode:
            meta.eligibility.ok ? meta.eligibility.mode : meta.eligibility.code,
          unsupportedBlocked: !badAnalysis.canCommit,
        },
        c01: {
          studyVersion: study.version,
          planRevision: plan?.revisionNumber ?? null,
          studyVersionAtGeneration: plan?.studyVersionAtGeneration ?? null,
          transferStudyVersion: transfer?.studyVersion ?? null,
          visits: await prisma.siteVisit.count({
            where: { organizationId: ORG_ID, projectId: C01 },
          }),
          followUps: await prisma.followUpSheet.count({
            where: { organizationId: ORG_ID, projectId: C01 },
          }),
          reports: await prisma.siteDocument.count({
            where: {
              organizationId: ORG_ID,
              projectId: C01,
              kind: "COMPTE_RENDU",
            },
          }),
          notices: await prisma.siteDocument.count({
            where: { organizationId: ORG_ID, projectId: C01, kind: "NOTICE" },
          }),
          takeoff: {
            parameters: td?.counts?.parameters,
            lines: td?.counts?.lines,
            sourceId: td?.sources?.[0]?.id,
            ged: td?.sources?.[0]?.ged?.name,
          },
        },
      },
      null,
      2,
    ),
  );
  console.log(
    "CTX-09A smoke URBAN: OK (analyze prêt, écriture production = NON)",
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    const { prisma } = await import("../src/lib/prisma");
    await prisma.$disconnect();
  });
