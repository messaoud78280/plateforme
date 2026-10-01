/**
 * Smoke CTX-02B — VISIT capability + visite URBAN lecture seule + C-01 inchangé.
 * Aucune écriture visite / planning / devis / métré.
 *
 * Usage:
 *   npx @railway/cli run --service plateforme --environment production -- \
 *     node --import tsx scripts/test-ctx02b-visit-commit-urban.ts
 */
import { prisma } from "../src/lib/prisma";
import { getSectionCapability } from "../src/lib/bework-patch/capability";
import { buildUniversalPatchContext } from "../src/lib/bework-patch/build-context";
import { evaluateQuoteStudySyncState } from "../src/lib/preparation/quote-bridge/quote-sync-state";
import { evaluatePlanningStudyVersionSync } from "../src/lib/preparation/schedule/planning-sync-state";
import { computeVisitContextVersion } from "../src/lib/bework-context/visit-context-version";
import { isVisitCommitSupportedOp } from "../src/lib/bework-patch/commit/visit-ops";

const ORG_ID = "cmt2nx23j00021k6btoov39gr";
const C01 = "cmuh69adc00011423ry0hhj7s";
const SCOPE_ID = "cmui2yaj20001dli4kof4j59b";
const URBAN_PROJECT = "cmuk97dlu000e1h5exgu6bx0f";
const URBAN_VISIT = "cmuk8qjrd00081h5epvx1pc26";

async function main() {
  const caps = {
    PLANNING: getSectionCapability("PLANNING").mode,
    VISIT: getSectionCapability("VISIT").mode,
    FOLLOW_UP: getSectionCapability("FOLLOW_UP").mode,
    REPORT: getSectionCapability("REPORT").mode,
    NOTICE: getSectionCapability("NOTICE").mode,
    TAKEOFF: getSectionCapability("TAKEOFF").mode,
    QUOTE: getSectionCapability("QUOTE").mode,
  };
  if (caps.PLANNING !== "AVAILABLE") throw new Error("PLANNING");
  if (caps.VISIT !== "AVAILABLE") throw new Error("VISIT not AVAILABLE");
  if (caps.FOLLOW_UP !== "AVAILABLE") throw new Error("FOLLOW_UP");
  if (caps.REPORT !== "AVAILABLE") throw new Error("REPORT");
  if (caps.NOTICE !== "AVAILABLE") throw new Error("NOTICE");
  if (!isVisitCommitSupportedOp("update_visit")) {
    throw new Error("update_visit not supported");
  }
  if (isVisitCommitSupportedOp("update_measurement")) {
    throw new Error("update_measurement should be unsupported");
  }

  const visit = await prisma.siteVisit.findFirst({
    where: { id: URBAN_VISIT, organizationId: ORG_ID },
    include: {
      measurements: true,
      medias: true,
    },
  });
  if (!visit) throw new Error("URBAN visit missing");
  if (visit.projectId !== URBAN_PROJECT) {
    throw new Error(`unexpected project ${visit.projectId}`);
  }

  const version = computeVisitContextVersion({
    id: visit.id,
    subject: visit.subject,
    status: visit.status,
    clientName: visit.clientName,
    siteAddress: visit.siteAddress,
    clientNeed: visit.clientNeed,
    comments: visit.comments,
    measurements: visit.measurements.map((m) => ({
      id: m.id,
      zone: m.zone,
      label: m.label,
      measureType: m.measureType,
      unit: m.unit,
      lengthM: m.lengthM != null ? Number(m.lengthM) : null,
      widthM: m.widthM != null ? Number(m.widthM) : null,
      heightM: m.heightM != null ? Number(m.heightM) : null,
      quantityValue: m.quantityValue != null ? Number(m.quantityValue) : null,
      computedQuantity: Number(m.computedQuantity),
      lot: m.lot,
      observation: m.observation,
    })),
    mediaRefs: visit.medias.map((m) => ({
      id: m.id,
      name: m.name,
      kind: m.kind,
      category: m.category,
      observation: m.observation,
      hasUrl: Boolean(m.fileUrl || m.storagePath),
    })),
  });

  const visitCtx = await buildUniversalPatchContext({
    orgId: ORG_ID,
    section: "VISIT",
    projectId: URBAN_PROJECT,
    entityId: URBAN_VISIT,
  });
  if (!visitCtx) throw new Error("visit context null");
  if (visitCtx.target.version !== version) {
    throw new Error(
      `version mismatch ctx=${visitCtx.target.version} computed=${version}`,
    );
  }

  // C-01 non-régression
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
    select: {
      revisionNumber: true,
      studyVersionAtGeneration: true,
    },
    orderBy: { updatedAt: "desc" },
  });
  if (!plan) throw new Error("C-01 plan missing");

  const transfer = await prisma.prepQuoteTransfer.findFirst({
    where: { organizationId: ORG_ID, quote: { number: "DEMO-2026-0002" } },
    orderBy: { createdAt: "desc" },
    select: { studyVersion: true },
  });
  const quoteSync = evaluateQuoteStudySyncState({
    hasQuote: true,
    hasMetreProvenance: Boolean(transfer),
    currentStudyVersion: study.version,
    transferStudyVersion: transfer?.studyVersion ?? null,
  });
  const planSync = evaluatePlanningStudyVersionSync({
    hasPlan: true,
    currentStudyVersion: study.version,
    studyVersionAtGeneration: plan.studyVersionAtGeneration,
  });

  const c01Visits = await prisma.siteVisit.count({
    where: { organizationId: ORG_ID, projectId: C01 },
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
        urbanVisit: {
          visitId: visit.id,
          projectId: visit.projectId,
          subject: visit.subject,
          version,
          contextBaseVersion: visitCtx.target.base_version,
          measurements: visit.measurements.length,
          medias: visit.medias.length,
          supportedCommitOp: "update_visit",
        },
        c01: {
          studyVersion: study.version,
          planRevision: plan.revisionNumber,
          studyVersionAtGeneration: plan.studyVersionAtGeneration,
          planSyncState: planSync.state,
          transferStudyVersion: transfer?.studyVersion ?? null,
          quoteSyncState: quoteSync.state,
          visits: c01Visits,
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
  console.log("CTX-02B smoke URBAN: OK (lecture seule, aucune écriture)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
