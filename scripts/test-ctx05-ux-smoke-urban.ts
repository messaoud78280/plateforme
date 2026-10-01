/**
 * Smoke CTX-05 — UX universelle + non-régression C-01 (lecture seule).
 * Aucune écriture production.
 *
 * Usage:
 *   NODE_TLS_REJECT_UNAUTHORIZED=0 node --import tsx scripts/test-ctx05-ux-smoke-urban.ts
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
  const {
    SECTION_METIER_LABEL,
    mapPatchErrorToUser,
    sectionMetierLabel,
  } = await import("../src/lib/bework-patch/ui-messages");
  const { buildUniversalPatchContext } = await import(
    "../src/lib/bework-patch/build-context"
  );
  const { loadImpactSubgraph } = await import(
    "../src/lib/bework-patch/impact/load-subgraph"
  );
  const { analyzeBeworkPatchInput } = await import(
    "../src/lib/bework-patch/analyze"
  );
  const { buildCommitPreviewMeta } = await import(
    "../src/lib/bework-patch/commit/commit-universal"
  );
  const { evaluateQuoteStudySyncState } = await import(
    "../src/lib/preparation/quote-bridge/quote-sync-state"
  );
  const { evaluatePlanningStudyVersionSync } = await import(
    "../src/lib/preparation/schedule/planning-sync-state"
  );

  // --- UX labels ---
  const expected: Record<string, string> = {
    TAKEOFF: "Métré / quantitatif",
    QUOTE: "Devis",
    PLANNING: "Planning chantier",
    VISIT: "Visite & relevés",
    FOLLOW_UP: "Suivi de chantier",
    REPORT: "Compte rendu",
    NOTICE: "Notice explicative",
  };
  for (const [k, v] of Object.entries(expected)) {
    if (sectionMetierLabel(k as keyof typeof SECTION_METIER_LABEL) !== v) {
      throw new Error(`label ${k}`);
    }
  }

  const errCodes = [
    "VERSION_CONFLICT",
    "PREVIEW_STALE",
    "DUPLICATE_PATCH",
    "INVALID_JSON",
    "OPERATION_NOT_ALLOWED_FOR_SECTION",
  ] as const;
  for (const code of errCodes) {
    const m = mapPatchErrorToUser({ code, section: "TAKEOFF" });
    if (m.message.includes(code) || m.title.includes(code)) {
      throw new Error(`jargon exposé: ${code}`);
    }
  }

  // --- Capabilities 7 sections ---
  for (const s of Object.keys(expected)) {
    const mode = getSectionCapability(
      s as keyof typeof SECTION_METIER_LABEL,
    ).mode;
    if (mode !== "AVAILABLE") throw new Error(`${s}=${mode}`);
  }

  // --- C-01 témoin ---
  const study = await prisma.prepStudy.findFirst({
    where: {
      organizationId: ORG_ID,
      projectId: C01,
      scopeId: SCOPE_ID,
      archivedAt: null,
    },
    select: {
      id: true,
      version: true,
      _count: { select: { parameters: true, lines: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
  if (!study) throw new Error("C-01 study missing");
  if (study.version !== 4) throw new Error(`study.version=${study.version}`);
  if (study._count.parameters !== 28) {
    throw new Error(`params=${study._count.parameters}`);
  }
  if (study._count.lines !== 32) {
    throw new Error(`lines=${study._count.lines}`);
  }

  const quote = await prisma.commercialQuote.findFirst({
    where: {
      organizationId: ORG_ID,
      projectId: C01,
      number: "DEMO-2026-0002",
    },
    select: { id: true, status: true },
  });
  const transfer = await prisma.prepQuoteTransfer.findFirst({
    where: {
      organizationId: ORG_ID,
      quote: { number: "DEMO-2026-0002" },
    },
    orderBy: { createdAt: "desc" },
    select: { studyVersion: true },
  });
  if (transfer?.studyVersion !== 3) {
    throw new Error(`transfer.studyVersion=${transfer?.studyVersion}`);
  }
  const quoteSync = evaluateQuoteStudySyncState({
    hasQuote: Boolean(quote),
    hasMetreProvenance: Boolean(transfer),
    currentStudyVersion: study.version,
    transferStudyVersion: transfer?.studyVersion ?? null,
  });
  if (quoteSync.syncState !== "MODIFICATION_DISPONIBLE") {
    throw new Error(`quoteSync=${quoteSync.syncState}`);
  }

  const plan = await prisma.prepSchedulePlan.findFirst({
    where: { organizationId: ORG_ID, projectId: C01, studyId: study.id },
    select: {
      id: true,
      revisionNumber: true,
      studyVersionAtGeneration: true,
    },
    orderBy: { updatedAt: "desc" },
  });
  if (!plan) throw new Error("C-01 plan missing");
  if (plan.revisionNumber !== 1) {
    throw new Error(`revision=${plan.revisionNumber}`);
  }
  if (plan.studyVersionAtGeneration !== 3) {
    throw new Error(`svg=${plan.studyVersionAtGeneration}`);
  }
  const planSync = evaluatePlanningStudyVersionSync({
    hasPlan: true,
    currentStudyVersion: study.version,
    studyVersionAtGeneration: plan.studyVersionAtGeneration,
  });
  if (planSync.syncState !== "MODIFICATION_DISPONIBLE") {
    throw new Error(`planSync=${planSync.syncState}`);
  }

  const [visits, followUps, reports, notices] = await Promise.all([
    prisma.siteVisit.count({ where: { organizationId: ORG_ID, projectId: C01 } }),
    prisma.followUpSheet.count({
      where: { organizationId: ORG_ID, projectId: C01 },
    }),
    prisma.siteDocument.count({
      where: { organizationId: ORG_ID, projectId: C01, kind: "COMPTE_RENDU" },
    }),
    prisma.siteDocument.count({
      where: { organizationId: ORG_ID, projectId: C01, kind: "NOTICE" },
    }),
  ]);
  if (visits !== 0 || followUps !== 0 || reports !== 0 || notices !== 0) {
    throw new Error(
      `counts visits=${visits} fu=${followUps} r=${reports} n=${notices}`,
    );
  }

  const takeoffCtx = await buildUniversalPatchContext({
    orgId: ORG_ID,
    section: "TAKEOFF",
    projectId: C01,
    entityId: study.id,
  });
  if (!takeoffCtx) throw new Error("takeoff ctx null");
  const td = takeoffCtx.data as {
    sources?: Array<{ id?: string; ged?: { name?: string }; filename?: string }>;
  };
  const src0 = td.sources?.[0];
  if (src0?.id !== "SRC-C01") throw new Error(`source=${src0?.id}`);
  const gedName = src0?.ged?.name ?? src0?.filename ?? "";
  if (!/plan de fondation/i.test(gedName)) {
    throw new Error(`ged=${gedName}`);
  }

  // --- TAKEOFF analyze lecture seule (stop avant commit) ---
  const param = await prisma.prepParameter.findFirst({
    where: { studyId: study.id },
    select: { id: true, key: true, value: true, label: true },
  });
  if (!param) throw new Error("no param");

  const takeoffPatch = {
    type: "bework_patch_v1" as const,
    schema_version: 1 as const,
    patch_id: `smoke-ctx05-takeoff-readonly-${Date.now()}`,
    origin: {
      section: "TAKEOFF" as const,
      project_id: C01,
      entity_id: study.id,
      base_version: study.version,
    },
    change_intent: "TECHNICAL_CORRECTION" as const,
    reason: "CTX-05 smoke lecture seule — ne pas committer",
    operations: [
      {
        op: "update_parameter" as const,
        target: {
          entity_type: "PREP_PARAMETER" as const,
          study_id: study.id,
          parameter_id: param.id,
          parameter_key: param.key,
        },
        changes: { value: Number(param.value ?? 0) },
      },
    ],
  };

  const takeoffSub = await loadImpactSubgraph({
    orgId: ORG_ID,
    projectId: C01,
    patch: takeoffPatch,
  });
  const takeoffAnalysis = analyzeBeworkPatchInput({
    raw: takeoffPatch,
    snapshot: {
      organizationId: ORG_ID,
      projectId: C01,
      currentVersion: study.version,
    },
    context: takeoffCtx,
    subgraph: takeoffSub,
  });
  if (!takeoffAnalysis.impact) throw new Error("TAKEOFF impact null");
  const takeoffMeta = buildCommitPreviewMeta({
    patch: takeoffPatch,
    impact: takeoffAnalysis.impact,
    subgraph: takeoffSub!,
  });
  if (!takeoffMeta?.fingerprint) throw new Error("TAKEOFF fingerprint");

  // --- NOTICE analyze lecture seule si présent ---
  const notice = await prisma.siteDocument.findFirst({
    where: { organizationId: ORG_ID, kind: "NOTICE" },
    select: { id: true, projectId: true, title: true },
    orderBy: { updatedAt: "desc" },
  });

  let noticeSmoke: Record<string, unknown> = { present: false };
  if (notice) {
    const {
      computeNoticeContextVersion,
      noticeDocToVersionInput,
    } = await import("../src/lib/bework-patch/commit/notice-ops");
    const full = await prisma.siteDocument.findUniqueOrThrow({
      where: { id: notice.id },
      select: {
        id: true,
        projectId: true,
        kind: true,
        title: true,
        status: true,
        quickNotes: true,
        payloadJson: true,
      },
    });
    const v = computeNoticeContextVersion(noticeDocToVersionInput(full));
    const noticeCtx = await buildUniversalPatchContext({
      orgId: ORG_ID,
      section: "NOTICE",
      projectId: full.projectId,
      entityId: full.id,
    });
    const noticePatch = {
      type: "bework_patch_v1" as const,
      schema_version: 1 as const,
      patch_id: `smoke-ctx05-notice-readonly-${Date.now()}`,
      origin: {
        section: "NOTICE" as const,
        project_id: full.projectId,
        entity_id: full.id,
        base_version: v,
      },
      change_intent: "DOCUMENT_EDIT" as const,
      reason: "CTX-05 smoke lecture seule — ne pas committer",
      operations: [
        {
          op: "update_notice" as const,
          target: {
            entity_type: "SITE_DOCUMENT" as const,
            document_id: full.id,
          },
          changes: { quick_notes: full.quickNotes ?? "smoke-preview-only" },
        },
      ],
    };
    const noticeSub = await loadImpactSubgraph({
      orgId: ORG_ID,
      projectId: full.projectId,
      patch: noticePatch,
    });
    const noticeAnalysis = analyzeBeworkPatchInput({
      raw: noticePatch,
      context: noticeCtx,
      subgraph: noticeSub,
    });
    if (!noticeAnalysis.impact) throw new Error("NOTICE impact null");
    const noticeMeta = buildCommitPreviewMeta({
      patch: noticePatch,
      impact: noticeAnalysis.impact,
      subgraph: noticeSub,
    });
    noticeSmoke = {
      present: true,
      canCommit: noticeMeta?.eligibility.ok ?? false,
      label: sectionMetierLabel("NOTICE"),
      fingerprint: Boolean(noticeMeta?.fingerprint),
    };
  }

  // Re-check C-01 inchangé après analyzes
  const studyAfter = await prisma.prepStudy.findFirst({
    where: { id: study.id },
    select: { version: true },
  });
  if (studyAfter?.version !== 4) throw new Error("C-01 mutated");

  console.log(
    JSON.stringify(
      {
        writePerformed: false,
        org: "URBAN AMÉNAGEMENTS",
        ux: {
          labels: expected,
          errorMappingOk: true,
        },
        takeoffPreview: {
          label: sectionMetierLabel("TAKEOFF"),
          impact: Boolean(takeoffAnalysis.impact),
          canCommit: takeoffMeta?.eligibility.ok ?? false,
          directChanges: takeoffAnalysis.impact?.directChanges.length ?? 0,
          derivedChanges: takeoffAnalysis.impact?.derivedChanges.length ?? 0,
        },
        noticePreview: noticeSmoke,
        c01: {
          study: 4,
          quote: {
            transferStudyVersion: 3,
            state: "À REVALIDER",
            syncState: quoteSync.syncState,
          },
          planning: {
            revision: 1,
            studyVersionAtGeneration: 3,
            state: "MODIFICATION_DISPONIBLE",
            syncState: planSync.syncState,
          },
          visits: 0,
          followUps: 0,
          reports: 0,
          notices: 0,
          takeoff: {
            parameters: 28,
            lines: 32,
            source: "SRC-C01",
            ged: gedName,
          },
        },
      },
      null,
      2,
    ),
  );
  console.log("CTX-05 smoke URBAN: OK (lecture seule, aucune écriture)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
