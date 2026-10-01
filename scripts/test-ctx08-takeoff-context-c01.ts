/**
 * Smoke CTX-08 — contexte TAKEOFF C-01 (lecture seule, Railway/prod).
 * Aucune écriture.
 *
 * Usage:
 *   npx @railway/cli run --service plateforme --environment production -- \
 *     node --import tsx scripts/test-ctx08-takeoff-context-c01.ts
 */
import { prisma } from "../src/lib/prisma";
import { buildUniversalPatchContext } from "../src/lib/bework-patch/build-context";
import { evaluateQuoteStudySyncState } from "../src/lib/preparation/quote-bridge/quote-sync-state";
import { evaluatePlanningStudyVersionSync } from "../src/lib/preparation/schedule/planning-sync-state";

const ORG_ID = "cmt2nx23j00021k6btoov39gr";
const PROJECT_ID = "cmuh69adc00011423ry0hhj7s";
const SCOPE_ID = "cmui2yaj20001dli4kof4j59b";

async function main() {
  const study = await prisma.prepStudy.findFirst({
    where: {
      organizationId: ORG_ID,
      projectId: PROJECT_ID,
      scopeId: SCOPE_ID,
      archivedAt: null,
    },
    select: {
      id: true,
      title: true,
      version: true,
      _count: { select: { parameters: true, lines: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
  if (!study) throw new Error("Étude FONDATIONS introuvable");

  const ctx = await buildUniversalPatchContext({
    orgId: ORG_ID,
    section: "TAKEOFF",
    projectId: PROJECT_ID,
    entityId: study.id,
  });
  if (!ctx) throw new Error("Contexte TAKEOFF null");

  const data = ctx.data as {
    counts?: { parameters: number; lines: number; sources: number };
    parameters?: unknown[];
    lines?: unknown[];
    sources?: Array<{
      id: string;
      ged?: { name?: string } | null;
      filename?: string | null;
    }>;
  };

  const params = data.counts?.parameters ?? data.parameters?.length ?? 0;
  const lines = data.counts?.lines ?? data.lines?.length ?? 0;
  const sources = data.counts?.sources ?? data.sources?.length ?? 0;
  const src0 = data.sources?.[0];
  const gedName = src0?.ged?.name ?? src0?.filename ?? null;
  const json = JSON.stringify(ctx);
  const bytes = Buffer.byteLength(json, "utf8");

  const wrong = await buildUniversalPatchContext({
    orgId: "org-does-not-exist",
    section: "TAKEOFF",
    projectId: PROJECT_ID,
    entityId: study.id,
  });

  const quote = await prisma.commercialQuote.findFirst({
    where: {
      organizationId: ORG_ID,
      projectId: PROJECT_ID,
      number: "DEMO-2026-0002",
    },
    select: {
      id: true,
      number: true,
      status: true,
    },
  });
  const transfer = await prisma.prepQuoteTransfer.findFirst({
    where: {
      organizationId: ORG_ID,
      quote: { number: "DEMO-2026-0002" },
    },
    orderBy: { createdAt: "desc" },
    select: { studyVersion: true, studyId: true },
  });
  const quoteSync = evaluateQuoteStudySyncState({
    hasQuote: Boolean(quote),
    hasMetreProvenance: Boolean(transfer),
    currentStudyVersion: study.version,
    transferStudyVersion: transfer?.studyVersion ?? null,
  });

  const plan = await prisma.prepSchedulePlan.findFirst({
    where: {
      organizationId: ORG_ID,
      projectId: PROJECT_ID,
      studyId: study.id,
    },
    select: {
      id: true,
      revisionNumber: true,
      studyVersionAtGeneration: true,
    },
    orderBy: { updatedAt: "desc" },
  });
  const planSync = evaluatePlanningStudyVersionSync({
    hasPlan: Boolean(plan),
    currentStudyVersion: study.version,
    studyVersionAtGeneration: plan?.studyVersionAtGeneration ?? null,
  });

  const report = {
    type: ctx.type,
    organization: ctx.organization?.name ?? null,
    project: ctx.project.title,
    scope: ctx.scope?.name ?? null,
    studyId: ctx.target.id,
    studyVersion: ctx.target.version,
    base_version: ctx.target.base_version ?? ctx.target.version,
    sourceId: src0?.id ?? null,
    ged: gedName,
    parameters: params,
    lines,
    sources,
    payloadBytes: bytes,
    expectedOutput: ctx.expected_output,
    wrongOrgNull: wrong === null,
    noBinary: !json.includes("base64") && !/data:application\/pdf/.test(json),
    nonRegression: {
      studyVersion: study.version,
      quoteNumber: quote?.number ?? null,
      quoteStatus: quote?.status ?? null,
      transferStudyVersion: transfer?.studyVersion ?? null,
      quoteSyncState: quoteSync.syncState,
      planRevision: plan?.revisionNumber ?? null,
      planStudyVersionAtGeneration: plan?.studyVersionAtGeneration ?? null,
      planSyncState: planSync.syncState,
    },
  };

  console.log(JSON.stringify(report, null, 2));

  if (ctx.type !== "bework_chatgpt_context_v1") throw new Error("type");
  if (ctx.organization?.name !== "URBAN AMÉNAGEMENTS") throw new Error("org");
  if (!ctx.project.title.includes("C-01")) throw new Error("project");
  if (ctx.scope?.name !== "FONDATIONS") throw new Error("scope");
  if (ctx.target.version !== 4) throw new Error("version");
  if (params !== 28) throw new Error(`params=${params}`);
  if (lines !== 32) throw new Error(`lines=${lines}`);
  if (src0?.id !== "SRC-C01") throw new Error(`source=${src0?.id}`);
  if (gedName !== "plan de fondation.pdf") throw new Error(`ged=${gedName}`);
  if (wrong !== null) throw new Error("wrong org");
  if (quoteSync.syncState !== "MODIFICATION_DISPONIBLE") {
    throw new Error(`quote sync=${quoteSync.syncState}`);
  }
  if (planSync.syncState !== "MODIFICATION_DISPONIBLE") {
    throw new Error(`plan sync=${planSync.syncState}`);
  }

  console.log("CTX-08 smoke C-01: OK (lecture seule)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
