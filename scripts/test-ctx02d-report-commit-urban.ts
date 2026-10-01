/**
 * Smoke CTX-02D — REPORT capability + URBAN lecture seule + C-01 inchangé.
 */
import { prisma } from "../src/lib/prisma";
import { getSectionCapability } from "../src/lib/bework-patch/capability";
import { buildUniversalPatchContext } from "../src/lib/bework-patch/build-context";
import { computeReportContextVersion } from "../src/lib/bework-context/report-context-version";
import {
  docToVersionInput,
  isReportCommitSupportedOp,
} from "../src/lib/bework-patch/commit/report-ops";

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
  if (caps.REPORT !== "AVAILABLE") throw new Error("REPORT not AVAILABLE");
  if (caps.NOTICE !== "PREVIEW_ONLY") throw new Error("NOTICE");
  if (!isReportCommitSupportedOp("update_report")) throw new Error("op");

  const doc = await prisma.siteDocument.findFirst({
    where: {
      organizationId: ORG_ID,
      kind: "COMPTE_RENDU",
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
      _count: { select: { media: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  let urbanReport: unknown =
    "aucun COMPTE_RENDU URBAN disponible pour smoke réel";
  if (doc) {
    const v1 = computeReportContextVersion(docToVersionInput(doc));
    const v2 = computeReportContextVersion(docToVersionInput(doc));
    if (v1 !== v2) throw new Error("version non déterministe");
    const ctx = await buildUniversalPatchContext({
      orgId: ORG_ID,
      section: "REPORT",
      projectId: doc.projectId,
      entityId: doc.id,
    });
    if (!ctx) throw new Error("report context null");
    if (ctx.target.version !== v1) throw new Error("version mismatch");
    const payload =
      doc.payloadJson && typeof doc.payloadJson === "object"
        ? Object.keys(doc.payloadJson as object)
        : [];
    urbanReport = {
      organizationId: doc.organizationId,
      projectId: doc.projectId,
      documentId: doc.id,
      kind: doc.kind,
      title: doc.title,
      status: doc.status,
      version: v1,
      versionSecondRead: v2,
      payloadKeys: payload,
      pdfStoragePath: doc.pdfStoragePath,
      mediaCount: doc._count.media,
      contextBaseVersion: ctx.target.base_version,
      supportedCommitOp: "update_report",
      whitelist: ["title", "quick_notes", "summary", "additional_notes"],
      pdfBehavior:
        "PDF généré on-demand depuis payloadJson (pas de pdfStoragePath écrit) — inchangé par CTX-02D",
    };
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
        urbanReport,
        c01: {
          studyVersion: study.version,
          planRevision: plan.revisionNumber,
          studyVersionAtGeneration: plan.studyVersionAtGeneration,
          transferStudyVersion: transfer?.studyVersion ?? null,
          visits: c01Visits,
          followUps: c01FollowUps,
          reports: c01Reports,
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
  console.log("CTX-02D smoke URBAN: OK (lecture seule, aucune écriture)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
