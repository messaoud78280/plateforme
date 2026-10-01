/**
 * Smoke CTX-07 — version VISIT dérivée (lecture seule, Railway/prod).
 * Aucune création / modification de visite.
 *
 * Usage:
 *   npx @railway/cli run --service plateforme --environment production -- \
 *     node --import tsx scripts/test-ctx07-visit-context-version.ts
 */
import { prisma } from "../src/lib/prisma";
import { buildUniversalPatchContext } from "../src/lib/bework-patch/build-context";
import { getSectionCapability } from "../src/lib/bework-patch/capability";
import { computeVisitContextVersion } from "../src/lib/bework-context/visit-context-version";
import { evaluateQuoteStudySyncState } from "../src/lib/preparation/quote-bridge/quote-sync-state";
import { evaluatePlanningStudyVersionSync } from "../src/lib/preparation/schedule/planning-sync-state";

const ORG_ID = "cmt2nx23j00021k6btoov39gr";
const C01 = "cmuh69adc00011423ry0hhj7s";
const SCOPE_ID = "cmui2yaj20001dli4kof4j59b";

async function main() {
  const capability = getSectionCapability("VISIT");
  if (capability.mode !== "AVAILABLE") {
    throw new Error(`VISIT capability=${capability.mode}`);
  }

  const visit = await prisma.siteVisit.findFirst({
    where: {
      organizationId: ORG_ID,
      projectId: { not: null },
    },
    include: {
      measurements: { orderBy: { sortOrder: "asc" } },
      medias: { orderBy: { createdAt: "desc" }, take: 50 },
      project: { select: { id: true, title: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  let visitReport: Record<string, unknown>;
  if (!visit || !visit.projectId) {
    visitReport = {
      urbanVisitSmoke: "aucune visite URBAN disponible pour smoke réel",
    };
  } else {
    const ctx1 = await buildUniversalPatchContext({
      orgId: ORG_ID,
      section: "VISIT",
      projectId: visit.projectId,
      entityId: visit.id,
    });
    const ctx2 = await buildUniversalPatchContext({
      orgId: ORG_ID,
      section: "VISIT",
      projectId: visit.projectId,
      entityId: visit.id,
    });
    if (!ctx1 || !ctx2) throw new Error("contexte VISIT null");

    const localVersion = computeVisitContextVersion({
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

    if (ctx1.target.version !== ctx2.target.version) {
      throw new Error("version non déterministe entre deux lectures");
    }
    if (ctx1.target.version !== localVersion) {
      throw new Error(
        `version contexte=${ctx1.target.version} != locale=${localVersion}`,
      );
    }
    if (ctx1.target.version === 1 && ctx1.data && Object.keys(ctx1.data).length > 2) {
      // version=1 possible par collision uint48 rare ; on signale seulement
      console.warn("note: version numérique = 1 (collision possible ou état minimal)");
    }

    const wrong = await buildUniversalPatchContext({
      orgId: "org-does-not-exist",
      section: "VISIT",
      projectId: visit.projectId,
      entityId: visit.id,
    });

    visitReport = {
      urbanVisitSmoke: "ok",
      organizationId: ORG_ID,
      projectId: visit.projectId,
      projectTitle: visit.project?.title ?? null,
      visitId: visit.id,
      version1: ctx1.target.version,
      version2: ctx2.target.version,
      base_version: ctx1.target.base_version,
      measurements: visit.measurements.length,
      mediaRefs: visit.medias.length,
      wrongOrgNull: wrong === null,
      type: ctx1.type,
      expectedOutput: ctx1.expected_output,
    };
  }

  // Non-régression C-01 + TAKEOFF CTX-08
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
  if (!study) throw new Error("C-01 study manquante");

  const takeoffCtx = await buildUniversalPatchContext({
    orgId: ORG_ID,
    section: "TAKEOFF",
    projectId: C01,
    entityId: study.id,
  });
  if (!takeoffCtx) throw new Error("TAKEOFF contexte null");
  const td = takeoffCtx.data as {
    counts?: { parameters: number; lines: number; sources: number };
    sources?: Array<{ id: string; ged?: { name?: string } | null }>;
  };

  const visitCountC01 = await prisma.siteVisit.count({
    where: { organizationId: ORG_ID, projectId: C01 },
  });

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
  const plan = await prisma.prepSchedulePlan.findFirst({
    where: { organizationId: ORG_ID, projectId: C01, studyId: study.id },
    select: { studyVersionAtGeneration: true, revisionNumber: true },
    orderBy: { updatedAt: "desc" },
  });
  const planSync = evaluatePlanningStudyVersionSync({
    hasPlan: Boolean(plan),
    currentStudyVersion: study.version,
    studyVersionAtGeneration: plan?.studyVersionAtGeneration ?? null,
  });

  const report = {
    visitCapability: capability.mode,
    ...visitReport,
    c01: {
      studyVersion: study.version,
      visits: visitCountC01,
      transferStudyVersion: transfer?.studyVersion ?? null,
      quoteSyncState: quoteSync.syncState,
      planStudyVersionAtGeneration: plan?.studyVersionAtGeneration ?? null,
      planSyncState: planSync.syncState,
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
  };

  console.log(JSON.stringify(report, null, 2));

  if (study.version !== 4) throw new Error("C-01 study != 4");
  if (visitCountC01 !== 0) throw new Error("C-01 visits unexpected");
  if (quoteSync.syncState !== "MODIFICATION_DISPONIBLE") throw new Error("quote sync");
  if (planSync.syncState !== "MODIFICATION_DISPONIBLE") throw new Error("plan sync");
  if (takeoffCtx.organization?.name !== "URBAN AMÉNAGEMENTS") throw new Error("org");
  if ((takeoffCtx.scope?.name ?? "").toLocaleUpperCase("fr-FR") !== "FONDATIONS") {
    throw new Error("scope");
  }
  if (td.counts?.parameters !== 28 || td.counts?.lines !== 32) throw new Error("takeoff counts");
  if (td.sources?.[0]?.id !== "SRC-C01") throw new Error("source");
  if (td.sources?.[0]?.ged?.name !== "plan de fondation.pdf") throw new Error("ged");

  console.log("CTX-07 smoke: OK (lecture seule)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
