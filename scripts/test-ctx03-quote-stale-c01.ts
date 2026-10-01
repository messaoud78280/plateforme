/**
 * Smoke CTX-03 lecture seule — URBAN C-01.
 * Aucune sync devis / planning.
 *
 * Usage:
 *   npx @railway/cli run --service plateforme --environment production -- \
 *     node --import tsx scripts/test-ctx03-quote-stale-c01.ts
 */
import assert from "node:assert/strict";
import { prisma } from "../src/lib/prisma";
import { buildProjectContext } from "../src/lib/bework-context";
import { evaluateQuoteStudySyncState } from "../src/lib/preparation/quote-bridge/quote-sync-state";
import { evaluatePlanningStudyVersionSync } from "../src/lib/preparation/schedule/planning-sync-state";

const ORG = "cmt2nx23j00021k6btoov39gr";
const C01 = "cmuh69adc00011423ry0hhj7s";

async function fingerprint() {
  const [study, quote, transfer, plan] = await Promise.all([
    prisma.prepStudy.findFirst({
      where: { projectId: C01, organizationId: ORG, archivedAt: null },
      select: { id: true, version: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.commercialQuote.findFirst({
      where: { projectId: C01, organizationId: ORG, number: "DEMO-2026-0002" },
      select: { id: true, status: true, updatedAt: true, totalSellHt: true },
    }),
    prisma.prepQuoteTransfer.findFirst({
      where: { organizationId: ORG, quote: { number: "DEMO-2026-0002" } },
      orderBy: { createdAt: "desc" },
      select: { id: true, studyVersion: true, createdAt: true, quoteId: true },
    }),
    prisma.prepSchedulePlan.findFirst({
      where: { projectId: C01, organizationId: ORG },
      select: {
        id: true,
        studyVersionAtGeneration: true,
        revisionNumber: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  return JSON.stringify({ study, quote, transfer, plan });
}

async function main() {
  const before = await fingerprint();

  const snap = await buildProjectContext(C01, ORG);
  assert.ok(snap);

  const takeoff = snap!.takeoffs[0];
  const quote = snap!.quotes.find((q) => q.number === "DEMO-2026-0002");
  const schedule = snap!.schedules[0];
  assert.ok(takeoff);
  assert.ok(quote);
  assert.ok(schedule);

  assert.equal(takeoff!.version, 4);
  assert.equal(quote!.transfer?.studyVersion, 3);
  assert.equal(schedule!.studyVersionAtGeneration, 3);
  assert.equal(schedule!.revisionNumber, 1);

  const quoteEval = evaluateQuoteStudySyncState({
    hasQuote: true,
    hasMetreProvenance: !!quote!.transfer,
    currentStudyVersion: takeoff!.version,
    transferStudyVersion: quote!.transfer?.studyVersion ?? null,
  });
  assert.equal(quoteEval.syncState, "MODIFICATION_DISPONIBLE");

  const planEval = evaluatePlanningStudyVersionSync({
    hasPlan: true,
    currentStudyVersion: takeoff!.version,
    studyVersionAtGeneration: schedule!.studyVersionAtGeneration,
  });
  assert.equal(planEval.syncState, "MODIFICATION_DISPONIBLE");

  const after = await fingerprint();
  assert.equal(after, before, "aucune écriture");

  console.log(
    JSON.stringify(
      {
        org: snap!.organization.name,
        projectId: snap!.project.id,
        study: { id: takeoff!.id, version: takeoff!.version },
        quote: {
          number: quote!.number,
          status: quote!.status,
          transferStudyVersion: quote!.transfer?.studyVersion ?? null,
          isScopeReference: quote!.isScopeReference,
          syncState: quoteEval.syncState,
          label: "À revalider",
        },
        planning: {
          studyVersionAtGeneration: schedule!.studyVersionAtGeneration,
          revisionNumber: schedule!.revisionNumber,
          syncState: planEval.syncState,
        },
        noWrite: true,
      },
      null,
      2,
    ),
  );
  console.log("test-ctx03-quote-stale-c01.ts: ok");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
