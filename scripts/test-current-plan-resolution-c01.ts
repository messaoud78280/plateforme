/**
 * Lecture seule — résolution planning CURRENT C-01 Fondations.
 * Aucune écriture.
 *
 * NODE_TLS_REJECT_UNAUTHORIZED=0 node --import tsx scripts/test-current-plan-resolution-c01.ts
 */
import assert from "node:assert/strict";
import { prisma } from "../src/lib/prisma";
import {
  resolveSchedulePlanForScope,
  resolvePrepSchedulePlanForWorkspace,
} from "../src/lib/chantier/resolve-workspace-entities";

const URBAN_ORG = "cmt2nx23j00021k6btoov39gr";
const C01 = "cmuh69adc00011423ry0hhj7s";
const STUDY = "cmuh6cy4c000y1423lqo85g5v";
const SCOPE = "cmui2yaj20001dli4kof4j59b";
const EXPECTED_CURRENT = "cmus2gpmm003ivfsmad3hafw2";
const OLD_ARCHIVED = "cmui103dx0002scx8q99joufl";

async function main() {
  const org = await prisma.organization.findFirst({
    where: { id: URBAN_ORG },
    select: { name: true },
  });
  assert.ok(org && /urban/i.test(org.name), "URBAN uniquement");

  const [scope, plans, study] = await Promise.all([
    prisma.projectScope.findFirst({
      where: { id: SCOPE, organizationId: URBAN_ORG },
      select: {
        id: true,
        referenceStudyId: true,
        referenceQuoteId: true,
        referenceSchedulePlanId: true,
      },
    }),
    prisma.prepSchedulePlan.findMany({
      where: {
        organizationId: URBAN_ORG,
        projectId: C01,
        studyId: STUDY,
      },
      select: {
        id: true,
        studyId: true,
        scopeId: true,
        status: true,
        revisionKind: true,
        revisionNumber: true,
        studyVersionAtGeneration: true,
        createdAt: true,
      },
      orderBy: [{ revisionNumber: "desc" }, { createdAt: "desc" }],
    }),
    prisma.prepStudy.findFirst({
      where: { id: STUDY, organizationId: URBAN_ORG },
      select: { id: true, version: true, scopeId: true },
    }),
  ]);

  assert.ok(scope && study);
  const beforeFp = JSON.stringify({
    ref: scope.referenceSchedulePlanId,
    plans: plans.map((p) => ({
      id: p.id,
      status: p.status,
      rev: p.revisionNumber,
      src: p.studyVersionAtGeneration,
    })),
  });

  console.log(
    JSON.stringify(
      {
        referenceSchedulePlanId: scope.referenceSchedulePlanId,
        studyVersion: study.version,
        plans: plans.map((p) => ({
          id: p.id,
          status: p.status,
          revisionKind: p.revisionKind,
          revisionNumber: p.revisionNumber,
          studyVersionAtGeneration: p.studyVersionAtGeneration,
        })),
      },
      null,
      2,
    ),
  );

  assert.equal(
    scope.referenceSchedulePlanId,
    OLD_ARCHIVED,
    "pointeur scope encore stale (attendu — pas de backfill)",
  );

  const forScope = resolveSchedulePlanForScope({
    plans,
    scope,
    studyId: STUDY,
  });
  assert.equal(forScope?.id, EXPECTED_CURRENT);
  assert.equal(forScope?.status, "CURRENT");
  assert.equal(forScope?.studyVersionAtGeneration, 4);
  assert.notEqual(forScope?.id, OLD_ARCHIVED);

  const forWs = resolvePrepSchedulePlanForWorkspace({
    plans,
    scopes: [scope],
    study: { id: STUDY, scopeId: study.scopeId },
  });
  assert.equal(forWs?.id, EXPECTED_CURRENT);

  // Sync hint : source v4 == study v4 → à jour
  assert.equal(forScope!.studyVersionAtGeneration, study.version);

  const afterFp = JSON.stringify({
    ref: scope.referenceSchedulePlanId,
    plans: plans.map((p) => ({
      id: p.id,
      status: p.status,
      rev: p.revisionNumber,
      src: p.studyVersionAtGeneration,
    })),
  });
  assert.equal(beforeFp, afterFp, "aucune écriture");

  console.log(
    "\n✅ C-01 résolution CURRENT =",
    EXPECTED_CURRENT,
    "· référence stale ignorée · 0 écriture",
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
