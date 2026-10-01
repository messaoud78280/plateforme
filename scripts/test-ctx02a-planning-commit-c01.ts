/**
 * Smoke CTX-02A — PLANNING capability + non-régression C-01 (lecture seule).
 * Aucune écriture planning / devis / métré.
 *
 * Usage:
 *   npx @railway/cli run --service plateforme --environment production -- \
 *     node --import tsx scripts/test-ctx02a-planning-commit-c01.ts
 */
import { prisma } from "../src/lib/prisma";
import { getSectionCapability } from "../src/lib/bework-patch/capability";
import { buildUniversalPatchContext } from "../src/lib/bework-patch/build-context";
import { evaluateQuoteStudySyncState } from "../src/lib/preparation/quote-bridge/quote-sync-state";
import { evaluatePlanningStudyVersionSync } from "../src/lib/preparation/schedule/planning-sync-state";
import { computeVisitContextVersion } from "../src/lib/bework-context/visit-context-version";

const ORG_ID = "cmt2nx23j00021k6btoov39gr";
const C01 = "cmuh69adc00011423ry0hhj7s";
const SCOPE_ID = "cmui2yaj20001dli4kof4j59b";

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
  if (caps.PLANNING !== "AVAILABLE") throw new Error("PLANNING not AVAILABLE");
  if (caps.VISIT !== "PREVIEW_ONLY") throw new Error("VISIT");
  if (caps.FOLLOW_UP !== "PREVIEW_ONLY") throw new Error("FOLLOW_UP");
  if (caps.REPORT !== "PREVIEW_ONLY") throw new Error("REPORT");
  if (caps.NOTICE !== "PREVIEW_ONLY") throw new Error("NOTICE");

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
      id: true,
      revisionNumber: true,
      studyVersionAtGeneration: true,
      title: true,
    },
    orderBy: { updatedAt: "desc" },
  });
  if (!plan) throw new Error("C-01 plan missing");

  const planningCtx = await buildUniversalPatchContext({
    orgId: ORG_ID,
    section: "PLANNING",
    projectId: C01,
    entityId: plan.id,
  });
  if (!planningCtx) throw new Error("planning context null");
  if (planningCtx.target.version !== plan.revisionNumber) {
    throw new Error("base_version mismatch");
  }
  if (
    (planningCtx.data as { study_version_at_generation?: number })
      .study_version_at_generation !== plan.studyVersionAtGeneration
  ) {
    throw new Error("studyVersionAtGeneration not exposed");
  }

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

  const visitCount = await prisma.siteVisit.count({
    where: { organizationId: ORG_ID, projectId: C01 },
  });

  // CTX-07 déterminisme si une visite URBAN existe (lecture seule)
  const visit = await prisma.siteVisit.findFirst({
    where: { organizationId: ORG_ID, projectId: { not: null } },
    include: {
      measurements: true,
      medias: { take: 20 },
    },
    orderBy: { updatedAt: "desc" },
  });
  let visitDeterminism: unknown = "no visit";
  if (visit) {
    const input = {
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
    };
    const v1 = computeVisitContextVersion(input);
    const v2 = computeVisitContextVersion(input);
    visitDeterminism = { equal: v1 === v2, version: v1 };
  }

  const report = {
    writePerformed: false,
    capabilities: caps,
    c01: {
      studyVersion: study.version,
      planId: plan.id,
      planRevision: plan.revisionNumber,
      studyVersionAtGeneration: plan.studyVersionAtGeneration,
      planSyncState: planSync.syncState,
      transferStudyVersion: transfer?.studyVersion ?? null,
      quoteSyncState: quoteSync.syncState,
      visits: visitCount,
      planningContext: {
        type: planningCtx.type,
        version: planningCtx.target.version,
        base_version: planningCtx.target.base_version,
        study_version_at_generation: (
          planningCtx.data as { study_version_at_generation?: number }
        ).study_version_at_generation,
      },
      takeoff: {
        organization: takeoffCtx.organization?.name ?? null,
        scope: takeoffCtx.scope?.name ?? null,
        version: takeoffCtx.target.version,
        sourceId: td.sources?.[0]?.id ?? null,
        ged: td.sources?.[0]?.ged?.name ?? null,
        parameters: td.counts?.parameters ?? null,
        lines: td.counts?.lines ?? null,
      },
    },
    visitDeterminism,
  };

  console.log(JSON.stringify(report, null, 2));

  if (study.version !== 4) throw new Error("study != 4");
  if (plan.revisionNumber !== 1) throw new Error("plan revision != 1");
  if (plan.studyVersionAtGeneration !== 3) throw new Error("source != 3");
  if (planSync.syncState !== "MODIFICATION_DISPONIBLE") throw new Error("plan sync");
  if (quoteSync.syncState !== "MODIFICATION_DISPONIBLE") throw new Error("quote sync");
  if (visitCount !== 0) throw new Error("visits");
  if (td.counts?.parameters !== 28 || td.counts?.lines !== 32) throw new Error("takeoff");
  if (td.sources?.[0]?.id !== "SRC-C01") throw new Error("source");

  console.log("CTX-02A smoke C-01: OK (lecture seule, aucune écriture)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
