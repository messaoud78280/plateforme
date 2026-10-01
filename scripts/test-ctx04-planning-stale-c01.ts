/**
 * Smoke CTX-04 lecture seule — URBAN C-01.
 * Aucune sync / écriture.
 *
 * Usage:
 *   npx @railway/cli run --service plateforme --environment production -- \
 *     node --import tsx scripts/test-ctx04-planning-stale-c01.ts
 */
import assert from "node:assert/strict";
import { prisma } from "../src/lib/prisma";
import { buildProjectContext } from "../src/lib/bework-context";
import { evaluatePlanningStudyVersionSync } from "../src/lib/preparation/schedule/planning-sync-state";

const ORG = "cmt2nx23j00021k6btoov39gr";
const C01 = "cmuh69adc00011423ry0hhj7s";

async function fingerprint() {
  const [study, plan] = await Promise.all([
    prisma.prepStudy.findFirst({
      where: { projectId: C01, organizationId: ORG, archivedAt: null },
      select: { id: true, version: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.prepSchedulePlan.findFirst({
      where: { projectId: C01, organizationId: ORG },
      select: {
        id: true,
        revisionNumber: true,
        studyVersionAtGeneration: true,
        updatedAt: true,
        studyId: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  return JSON.stringify({ study, plan });
}

async function main() {
  const before = await fingerprint();

  const snap = await buildProjectContext(C01, ORG);
  assert.ok(snap, "contexte C-01 requis");

  const takeoff = snap!.takeoffs[0];
  const schedule = snap!.schedules[0];
  assert.ok(takeoff, "métré attendu");
  assert.ok(schedule, "planning attendu");

  assert.equal(takeoff!.version, 4, "study doit rester v4");
  assert.equal(schedule!.revisionNumber, 1, "revision planning inchangée");
  assert.equal(
    schedule!.studyVersionAtGeneration,
    3,
    "planning source doit rester v3 (pas de sync auto)",
  );

  const evalResult = evaluatePlanningStudyVersionSync({
    hasPlan: true,
    currentStudyVersion: takeoff!.version,
    studyVersionAtGeneration: schedule!.studyVersionAtGeneration,
  });
  assert.equal(evalResult.syncState, "MODIFICATION_DISPONIBLE");

  const after = await fingerprint();
  assert.equal(after, before, "aucune écriture autorisée");

  console.log(
    JSON.stringify(
      {
        org: snap!.organization.name,
        projectId: snap!.project.id,
        study: { id: takeoff!.id, version: takeoff!.version },
        planning: {
          id: schedule!.id,
          revisionNumber: schedule!.revisionNumber,
          studyVersionAtGeneration: schedule!.studyVersionAtGeneration,
        },
        MODIFICATION_DISPONIBLE: true,
        syncState: evalResult.syncState,
        hint: evalResult.hint,
        noWrite: true,
      },
      null,
      2,
    ),
  );
  console.log("test-ctx04-planning-stale-c01.ts: ok");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
