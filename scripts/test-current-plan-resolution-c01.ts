/**
 * Lecture seule — résolution planning CURRENT C-01 Fondations.
 * Aucune écriture.
 *
 * NODE_TLS_REJECT_UNAUTHORIZED=0 node --import tsx scripts/test-current-plan-resolution-c01.ts
 */
import assert from "node:assert/strict";
import { prisma } from "../src/lib/prisma";
import {
  resolveCurrentSchedulePlan,
  resolveSchedulePlanForScope,
  resolvePrepSchedulePlanForWorkspace,
} from "../src/lib/chantier/resolve-workspace-entities";

const URBAN_ORG = "cmt2nx23j00021k6btoov39gr";
const C01 = "cmuh69adc00011423ry0hhj7s";
const STUDY = "cmuh6cy4c000y1423lqo85g5v";
const SCOPE = "cmui2yaj20001dli4kof4j59b";
const EXPECTED_CURRENT = "cmus31wp300029r8m7mxw0d04";
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
          scopeId: p.scopeId,
        })),
      },
      null,
      2,
    ),
  );

  const current = resolveCurrentSchedulePlan(plans);
  assert.equal(current?.id, EXPECTED_CURRENT, "A resolveCurrentSchedulePlan");
  assert.equal(current?.status, "CURRENT");
  assert.equal(current?.revisionNumber, 2);
  assert.equal(current?.studyVersionAtGeneration, 4);

  const forScope = resolveSchedulePlanForScope({
    plans,
    scope,
    studyId: STUDY,
  });
  assert.equal(forScope?.id, EXPECTED_CURRENT, "B resolveSchedulePlanForScope");
  assert.notEqual(forScope?.id, OLD_ARCHIVED, "E pas d’ancien INITIAL");

  // Workspace global : si CURRENT est scopé, forStudy le trouve (pas de scopeId null).
  const forWs = resolvePrepSchedulePlanForWorkspace({
    plans,
    scopes: [scope],
    study: { id: STUDY, scopeId: study.scopeId },
  });
  assert.equal(forWs?.id, EXPECTED_CURRENT, "C workspace");

  assert.equal(
    forScope!.studyVersionAtGeneration,
    study.version,
    "alignement métré",
  );

  // F — stabilité : 5 résolutions identiques
  for (let i = 0; i < 5; i++) {
    assert.equal(resolveCurrentSchedulePlan(plans)?.id, EXPECTED_CURRENT);
    assert.equal(
      resolveSchedulePlanForScope({ plans, scope, studyId: STUDY })?.id,
      EXPECTED_CURRENT,
    );
  }

  const afterFp = JSON.stringify({
    ref: scope.referenceSchedulePlanId,
    plans: plans.map((p) => ({
      id: p.id,
      status: p.status,
      rev: p.revisionNumber,
      src: p.studyVersionAtGeneration,
    })),
  });
  assert.equal(beforeFp, afterFp, "H aucune écriture");

  console.log(
    "\n✅ C-01 CURRENT =",
    EXPECTED_CURRENT,
    "· navigation défaut OK · 0 écriture",
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
