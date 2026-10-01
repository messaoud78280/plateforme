/**
 * Smoke CTX-02C — FOLLOW_UP capability + URBAN lecture seule + C-01 inchangé.
 * Aucune écriture.
 *
 * Usage:
 *   npx @railway/cli run --service plateforme --environment production -- \
 *     node --import tsx scripts/test-ctx02c-follow-up-commit-urban.ts
 */
import { prisma } from "../src/lib/prisma";
import { getSectionCapability } from "../src/lib/bework-patch/capability";
import { buildUniversalPatchContext } from "../src/lib/bework-patch/build-context";
import { computeFollowUpContextVersion } from "../src/lib/bework-context/follow-up-context-version";
import {
  isFollowUpCommitSupportedOp,
  sheetToVersionInput,
} from "../src/lib/bework-patch/commit/follow-up-ops";
import { evaluateQuoteStudySyncState } from "../src/lib/preparation/quote-bridge/quote-sync-state";
import { evaluatePlanningStudyVersionSync } from "../src/lib/preparation/schedule/planning-sync-state";

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
  if (caps.FOLLOW_UP !== "AVAILABLE") throw new Error("FOLLOW_UP not AVAILABLE");
  if (caps.REPORT !== "AVAILABLE") throw new Error("REPORT");
  if (caps.NOTICE !== "AVAILABLE") throw new Error("NOTICE");
  if (!isFollowUpCommitSupportedOp("update_follow_up")) {
    throw new Error("update_follow_up missing");
  }
  if (isFollowUpCommitSupportedOp("update_progress")) {
    throw new Error("update_progress should be unsupported");
  }

  const sheet = await prisma.followUpSheet.findFirst({
    where: {
      organizationId: ORG_ID,
      projectId: { not: null },
      status: { not: "ARCHIVE" },
    },
    select: {
      id: true,
      projectId: true,
      title: true,
      status: true,
      notes: true,
      prepSchedulePlanId: true,
      organizationId: true,
      _count: { select: { timeline: true, agendaEvents: true, tasks: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  let urbanFollowUp: unknown = "aucun FOLLOW_UP URBAN disponible pour smoke réel";
  if (sheet?.projectId) {
    const v1 = computeFollowUpContextVersion(sheetToVersionInput(sheet));
    const v2 = computeFollowUpContextVersion(sheetToVersionInput(sheet));
    if (v1 !== v2) throw new Error("version non déterministe");

    const ctx = await buildUniversalPatchContext({
      orgId: ORG_ID,
      section: "FOLLOW_UP",
      projectId: sheet.projectId,
      entityId: sheet.id,
    });
    if (!ctx) throw new Error("follow-up context null");
    if (ctx.target.version !== v1) {
      throw new Error(`version mismatch ctx=${ctx.target.version} computed=${v1}`);
    }

    urbanFollowUp = {
      organizationId: sheet.organizationId,
      projectId: sheet.projectId,
      followUpId: sheet.id,
      model: "FollowUpSheet",
      title: sheet.title,
      status: sheet.status,
      version: v1,
      versionSecondRead: v2,
      timelineEvents: sheet._count.timeline,
      agendaEvents: sheet._count.agendaEvents,
      tasks: sheet._count.tasks,
      contextBaseVersion: ctx.target.base_version,
      supportedCommitOp: "update_follow_up",
      whitelist: ["title", "notes"],
    };
  }

  // C-01
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
  const c01FollowUps = await prisma.followUpSheet.count({
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
        urbanFollowUp,
        c01: {
          studyVersion: study.version,
          planRevision: plan.revisionNumber,
          studyVersionAtGeneration: plan.studyVersionAtGeneration,
          planSyncState: planSync.state,
          transferStudyVersion: transfer?.studyVersion ?? null,
          quoteSyncState: quoteSync.state,
          visits: c01Visits,
          followUps: c01FollowUps,
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
  console.log("CTX-02C smoke URBAN: OK (lecture seule, aucune écriture)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
