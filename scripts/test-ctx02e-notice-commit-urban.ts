/**
 * Smoke CTX-02E — NOTICE capability + URBAN lecture seule + C-01 inchangé.
 * Aucune écriture production.
 */
import { prisma } from "../src/lib/prisma";
import { getSectionCapability } from "../src/lib/bework-patch/capability";
import { buildUniversalPatchContext } from "../src/lib/bework-patch/build-context";
import {
  computeNoticeContextVersion,
  isNoticeCommitSupportedOp,
  noticeDocToVersionInput,
  NOTICE_UPDATE_ALLOWED_FIELDS,
} from "../src/lib/bework-patch/commit/notice-ops";
import { isReportCommitSupportedOp } from "../src/lib/bework-patch/commit/report-ops";
import { supportedOperationsForSection } from "../src/lib/bework-patch/operations-catalog";

const ORG_ID = "cmt2nx23j00021k6btoov39gr";
const C01 = "cmuh69adc00011423ry0hhj7s";
const SCOPE_ID = "cmui2yaj20001dli4kof4j59b";

async function main() {
  const caps = {
    TAKEOFF: getSectionCapability("TAKEOFF").mode,
    QUOTE: getSectionCapability("QUOTE").mode,
    PLANNING: getSectionCapability("PLANNING").mode,
    VISIT: getSectionCapability("VISIT").mode,
    FOLLOW_UP: getSectionCapability("FOLLOW_UP").mode,
    REPORT: getSectionCapability("REPORT").mode,
    NOTICE: getSectionCapability("NOTICE").mode,
  };
  for (const [k, v] of Object.entries(caps)) {
    if (v !== "AVAILABLE") throw new Error(`${k} not AVAILABLE (${v})`);
  }
  if (!isNoticeCommitSupportedOp("update_notice")) throw new Error("op notice");
  if (!isReportCommitSupportedOp("update_report")) throw new Error("op report");

  const doc = await prisma.siteDocument.findFirst({
    where: {
      organizationId: ORG_ID,
      kind: "NOTICE",
    },
    select: {
      id: true,
      projectId: true,
      organizationId: true,
      kind: true,
      title: true,
      status: true,
      quickNotes: true,
      payloadJson: true,
      pdfStoragePath: true,
      versionNumber: true,
      _count: { select: { media: true } },
      project: { select: { title: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  let urbanNotice: unknown =
    "aucune NOTICE URBAN disponible pour smoke réel";
  if (doc) {
    const v1 = computeNoticeContextVersion(noticeDocToVersionInput(doc));
    const v2 = computeNoticeContextVersion(noticeDocToVersionInput(doc));
    if (v1 !== v2) throw new Error("version non déterministe");
    const ctx = await buildUniversalPatchContext({
      orgId: ORG_ID,
      section: "NOTICE",
      projectId: doc.projectId,
      entityId: doc.id,
    });
    if (!ctx) throw new Error("notice context null");
    if (ctx.target.version !== v1) throw new Error("version mismatch");
    if (ctx.target.base_version !== v1) throw new Error("base_version mismatch");
    const payload =
      doc.payloadJson && typeof doc.payloadJson === "object"
        ? Object.keys(doc.payloadJson as object)
        : [];
    urbanNotice = {
      organizationId: doc.organizationId,
      projectId: doc.projectId,
      projectTitle: doc.project.title,
      documentId: doc.id,
      kind: doc.kind,
      title: doc.title,
      status: doc.status,
      versionNumberColumn: doc.versionNumber,
      version1: v1,
      version2: v2,
      payloadKeys: payload,
      pdfStoragePath: doc.pdfStoragePath,
      mediaCount: doc._count.media,
      quickNotesPresent: !!doc.quickNotes,
      contextBaseVersion: ctx.target.base_version,
      supportedCommitOp: "update_notice",
      whitelist: [...NOTICE_UPDATE_ALLOWED_FIELDS],
      catalogOps: supportedOperationsForSection("NOTICE").map((o) => o.op),
      pdfBehavior:
        "PDF généré on-demand depuis payloadJson — pdfStoragePath non utilisé en écriture patch ; inchangé par CTX-02E",
    };
  }

  // Isolation : un COMPTE_RENDU ne doit pas charger un contexte NOTICE
  const cr = await prisma.siteDocument.findFirst({
    where: { organizationId: ORG_ID, kind: "COMPTE_RENDU" },
    select: { id: true, projectId: true, kind: true },
  });
  let isolationReportNotice: unknown = "pas de COMPTE_RENDU pour test isolation";
  if (cr) {
    const bad = await buildUniversalPatchContext({
      orgId: ORG_ID,
      section: "NOTICE",
      projectId: cr.projectId,
      entityId: cr.id,
    });
    isolationReportNotice = {
      compteRenduId: cr.id,
      noticeContextOnCompteRendu: bad === null ? "REFUS (null)" : "FAIL",
    };
    if (bad !== null) throw new Error("NOTICE context loaded COMPTE_RENDU");
  }

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
  if (!study) throw new Error("C-01 study missing");
  const plan = await prisma.prepSchedulePlan.findFirst({
    where: { organizationId: ORG_ID, projectId: C01, studyId: study.id },
    select: { revisionNumber: true, studyVersionAtGeneration: true },
    orderBy: { updatedAt: "desc" },
  });
  if (!plan) throw new Error("C-01 plan missing");
  const transfer = await prisma.prepQuoteTransfer.findFirst({
    where: { organizationId: ORG_ID, quote: { number: "DEMO-2026-0002" } },
    orderBy: { createdAt: "desc" },
    select: { studyVersion: true },
  });
  const c01Visits = await prisma.siteVisit.count({
    where: { organizationId: ORG_ID, projectId: C01 },
  });
  const c01FollowUps = await prisma.followUpSheet.count({
    where: { organizationId: ORG_ID, projectId: C01 },
  });
  const c01Reports = await prisma.siteDocument.count({
    where: { organizationId: ORG_ID, projectId: C01, kind: "COMPTE_RENDU" },
  });
  const c01Notices = await prisma.siteDocument.count({
    where: { organizationId: ORG_ID, projectId: C01, kind: "NOTICE" },
  });
  const takeoffCtx = await buildUniversalPatchContext({
    orgId: ORG_ID,
    section: "TAKEOFF",
    projectId: C01,
    entityId: study.id,
  });
  if (!takeoffCtx) throw new Error("takeoff null");
  const td = takeoffCtx.data as {
    counts?: { parameters: number; lines: number };
    sources?: Array<{ id: string; ged?: { name?: string } | null }>;
  };

  console.log(
    JSON.stringify(
      {
        writePerformed: false,
        capabilities: caps,
        urbanNotice,
        isolationReportNotice,
        c01: {
          studyVersion: study.version,
          planRevision: plan.revisionNumber,
          studyVersionAtGeneration: plan.studyVersionAtGeneration,
          transferStudyVersion: transfer?.studyVersion ?? null,
          visits: c01Visits,
          followUps: c01FollowUps,
          reports: c01Reports,
          notices: c01Notices,
          takeoff: {
            organization: takeoffCtx.organization?.name,
            scope: takeoffCtx.scope?.name,
            version: takeoffCtx.target.version,
            sourceId: td.sources?.[0]?.id,
            ged: td.sources?.[0]?.ged?.name,
            parameters: td.counts?.parameters,
            lines: td.counts?.lines,
          },
        },
      },
      null,
      2,
    ),
  );
  console.log("CTX-02E smoke URBAN: OK (lecture seule, aucune écriture)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
