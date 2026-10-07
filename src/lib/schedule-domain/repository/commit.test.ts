/**
 * Tests Repository / Commit Schedule V2 — GATE Phase 5B.
 *
 * Environnement : session pooler (voir test-db-env.ts).
 * Org / projet / études jetables — JAMAIS URBAN / ROCKMAN en écriture.
 *
 * node --import tsx --import ./src/lib/schedule-domain/repository/test-db-env.ts \
 *   src/lib/schedule-domain/repository/commit.test.ts
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { BEWORK_SCHEDULE_AI_FORMAT } from "../ai-contract";
import { parseSchedulePlan } from "../schema";
import { previewAiSchedule } from "../preview";
import { computeScheduleDraftHash } from "../draft-hash";
import { commitScheduleV2, readDomainSnapshot } from "./commit";
import { loadSourceContextFromDb } from "./load-source-context";
import { fixturePlanSingleActivity } from "../fixtures";
import { expectedDependencyCount, expectedTakeoffLinkCount } from "./mapping";
import { setScheduleV2TestFailAfterTask } from "./test-fault";

const ROCKMAN_STUDY = "cmuvgohrt0002vhqid2s811c4";
const OWNER_FALLBACK_EMAIL = "agence@exemple.com";

type Results = Record<string, "PASS" | "FAIL" | "SKIP">;

function aiBundle(activities: unknown[]) {
  return { format: BEWORK_SCHEDULE_AI_FORMAT, activities };
}

async function assertSchemaReady() {
  const cols = await prisma.$queryRawUnsafe<Array<{ column_name: string }>>(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'PrepSchedulePlan'
      AND column_name = 'domainSnapshotJson'
  `);
  if (cols.length === 0) {
    throw new Error(
      "SCHEMA_NOT_READY: colonne PrepSchedulePlan.domainSnapshotJson absente. " +
        "Appliquer explicitement prisma/migrations/add-prep-schedule-domain-snapshot-v1.sql " +
        "sur l’environnement TEST (pas d’auto-ALTER depuis les tests).",
    );
  }
}

async function createDisposableWorld(stamp: number) {
  const owner =
    (await prisma.user.findFirst({
      where: { email: OWNER_FALLBACK_EMAIL },
      select: { id: true },
    })) ??
    (await prisma.user.findFirst({
      select: { id: true },
      orderBy: { createdAt: "asc" },
    }));
  if (!owner) throw new Error("Aucun User pour owner org jetable");

  const org = await prisma.organization.create({
    data: {
      name: `[TEST] schedule-v2-gate ${stamp}`,
      kind: "DEMO",
      saasStatus: "ACTIVE",
      ownerUserId: owner.id,
    },
    select: { id: true, name: true },
  });

  const project = await prisma.project.create({
    data: {
      title: `[TEST] schedule-v2 projet ${stamp}`,
      organizationId: org.id,
      clientId: owner.id,
      status: "EN_COURS",
    },
    select: { id: true, title: true },
  });

  return { org, project, ownerId: owner.id };
}

async function createDisposableStudy(
  orgId: string,
  projectId: string,
  stamp: number,
  lineCodes: string[],
) {
  return prisma.prepStudy.create({
    data: {
      organizationId: orgId,
      projectId,
      title: `[TEST] schedule-v2 study ${stamp}`,
      trade: "GO",
      version: 1,
      dossierStatus: "BROUILLON",
      sourceFormat: "TEST",
      lines: {
        create: lineCodes.map((code, i) => ({
          organizationId: orgId,
          code,
          lot: "GO-01 TEST",
          designation: `Ligne ${code}`,
          unit: "m2",
          declaredQuantity: 10 + i,
          validatedQuantity: 10 + i,
          role: "quote",
          sortOrder: i,
          provenance: "HYPOTHESE",
        })),
      },
    },
    select: { id: true, version: true },
  });
}

async function purgePlanTree(planIds: string[]) {
  for (const planId of planIds) {
    await prisma.prepScheduleQuoteLink.deleteMany({ where: { planId } }).catch(() => {});
    await prisma.prepScheduleTakeoffLink.deleteMany({ where: { planId } });
    await prisma.prepScheduleDependency.deleteMany({ where: { planId } });
    await prisma.prepScheduleEvent.deleteMany({ where: { planId } });
    await prisma.prepScheduleTask.deleteMany({ where: { planId } });
    await prisma.prepSchedulePlan.deleteMany({ where: { id: planId } });
  }
}

async function purgeStudy(studyId: string, planIds: string[]) {
  await purgePlanTree(planIds);
  const leftover = await prisma.prepSchedulePlan.findMany({
    where: { studyId },
    select: { id: true },
  });
  await purgePlanTree(leftover.map((p) => p.id));
  await prisma.prepTakeoffLine.deleteMany({ where: { studyId } });
  await prisma.prepStudyEvent.deleteMany({ where: { studyId } }).catch(() => {});
  await prisma.prepStudy.delete({ where: { id: studyId } }).catch(() => {});
}

async function purgeWorld(orgId: string, projectId: string) {
  const plans = await prisma.prepSchedulePlan.findMany({
    where: { organizationId: orgId },
    select: { id: true },
  });
  await purgePlanTree(plans.map((p) => p.id));
  const studies = await prisma.prepStudy.findMany({
    where: { organizationId: orgId },
    select: { id: true },
  });
  for (const s of studies) {
    await prisma.prepTakeoffLine.deleteMany({ where: { studyId: s.id } });
    await prisma.prepStudyEvent.deleteMany({ where: { studyId: s.id } }).catch(() => {});
    await prisma.prepStudy.delete({ where: { id: s.id } }).catch(() => {});
  }
  await prisma.project.delete({ where: { id: projectId } }).catch(() => {});
  await prisma.organization.delete({ where: { id: orgId } }).catch(() => {});
}

async function assertInvariants(planId: string, activityCount: number) {
  const plan = await prisma.prepSchedulePlan.findUniqueOrThrow({
    where: { id: planId },
    select: {
      status: true,
      revisionKind: true,
      revisionNumber: true,
      idempotencyKey: true,
      domainSnapshotJson: true,
    },
  });
  assert.equal(plan.status, "CURRENT");
  assert.equal(plan.revisionKind, "CURRENT");
  assert.equal(plan.revisionNumber, 1);
  assert.ok(plan.idempotencyKey?.startsWith("schedule-v2:"));
  const parsed = parseSchedulePlan(plan.domainSnapshotJson);
  assert.equal(parsed.ok, true);
  if (parsed.ok) {
    assert.equal(parsed.plan.schemaVersion, 1);
    assert.equal(parsed.plan.activities.length, activityCount);
  }
  const [tasks, deps, links, events] = await Promise.all([
    prisma.prepScheduleTask.count({ where: { planId } }),
    prisma.prepScheduleDependency.count({ where: { planId } }),
    prisma.prepScheduleTakeoffLink.count({ where: { planId } }),
    prisma.prepScheduleEvent.count({ where: { planId } }),
  ]);
  assert.equal(tasks, activityCount);
  assert.equal(deps, expectedDependencyCount(parsed.ok ? parsed.plan : ({ activities: [] } as never)));
  assert.equal(links, expectedTakeoffLinkCount(parsed.ok ? parsed.plan : ({ activities: [] } as never)));
  assert.ok(events >= 1);
}

async function residualForOrg(orgId: string) {
  const [plans, tasks, deps, links, events, quoteLinks, studies] = await Promise.all([
    prisma.prepSchedulePlan.count({ where: { organizationId: orgId } }),
    prisma.prepScheduleTask.count({ where: { organizationId: orgId } }),
    prisma.prepScheduleDependency.count({ where: { organizationId: orgId } }),
    prisma.prepScheduleTakeoffLink.count({ where: { organizationId: orgId } }),
    prisma.prepScheduleEvent.count({ where: { organizationId: orgId } }),
    prisma.prepScheduleQuoteLink.count({ where: { organizationId: orgId } }),
    prisma.prepStudy.count({ where: { organizationId: orgId } }),
  ]);
  return { plans, tasks, deps, links, events, quoteLinks, studies };
}

async function main() {
  await assertSchemaReady();

  const stamp = Date.now();
  const results: Results = {};
  const mark = (k: string, ok: boolean) => {
    results[k] = ok ? "PASS" : "FAIL";
  };

  const world = await createDisposableWorld(stamp);
  const { org, project } = world;
  const ORG = org.id;
  const PROJECT = project.id;

  console.log(
    JSON.stringify({
      gate: "PHASE_5B",
      env: {
        databaseHost: (() => {
          try {
            const u = new URL(process.env.DATABASE_URL ?? "");
            return `${u.hostname}:${u.port || "5432"}`;
          } catch {
            return "?";
          }
        })(),
        forceSessionPooler: process.env.BEWORK_FORCE_SESSION_POOLER === "1",
        nodeEnv: process.env.NODE_ENV,
        disposableOrgId: ORG,
        disposableOrgName: org.name,
        disposableProjectId: PROJECT,
        rockmanWrite: false,
      },
      draftHashCoverage:
        "sourceSnapshot(projectId,takeoffStudyId,takeoffVersion,takeoffFingerprint,quote*) + calendar + resources + activities",
      concurrencyProtection:
        "pg_advisory_xact_lock(hashtext(schedule-v2-current:projectId)) + @@unique(organizationId,idempotencyKey)",
    }),
  );

  const rockmanBefore = await prisma.prepStudy.findUnique({
    where: { id: ROCKMAN_STUDY },
    select: { version: true, _count: { select: { lines: true } } },
  });

  let studyId: string | null = null;
  const planIds: string[] = [];

  try {
    // --- R1 + R8 + R9 ---
    {
      const study = await createDisposableStudy(ORG, PROJECT, stamp, ["GO-00-01", "GO-00-02"]);
      studyId = study.id;
      const loaded = await loadSourceContextFromDb({
        orgId: ORG,
        projectId: PROJECT,
        studyId,
      });
      const raw = aiBundle([
        {
          id: "P01",
          name: "Installation",
          kind: "WORK",
          duration_days: 1,
          takeoff_codes: ["GO-00-01"],
          after: [],
        },
        {
          id: "P02",
          name: "Fouilles",
          kind: "WORK",
          duration_days: 2,
          takeoff_codes: ["GO-00-02"],
          after: [{ id: "P01", type: "FS", lag_days: 0 }],
        },
      ]);
      const preview = previewAiSchedule({
        raw,
        sourceContext: loaded.sourceContext,
      });
      assert.equal(preview.ok, true, JSON.stringify(preview));
      if (!preview.ok) throw new Error("preview R1");

      // draftHash doit couvrir le contexte source
      assert.equal(preview.plan.sourceSnapshot.projectId, PROJECT);
      assert.equal(preview.plan.sourceSnapshot.takeoffStudyId, studyId);
      assert.equal(preview.plan.sourceSnapshot.takeoffVersion, loaded.sourceContext.takeoffVersion);
      assert.equal(
        preview.plan.sourceSnapshot.takeoffFingerprint,
        loaded.sourceContext.takeoffFingerprint,
      );

      const commit = await commitScheduleV2({
        orgId: ORG,
        projectId: PROJECT,
        userId: null,
        studyId,
        raw,
        draftHash: preview.draftHash,
        sourceFingerprint: preview.sourceFingerprint,
      });
      assert.equal(commit.ok, true, JSON.stringify(commit));
      if (!commit.ok) throw new Error("commit R1");
      planIds.push(commit.planId);

      assert.equal(commit.taskCount, 2);
      assert.equal(commit.dependencyCount, 1);
      assert.equal(commit.takeoffLinkCount, 2);
      assert.equal(commit.baseDurationWorkingDays, 3);
      await assertInvariants(commit.planId, 2);

      const snap = await readDomainSnapshot(commit.planId);
      assert.ok(snap);
      assert.equal(snap!.activities.length, 2);
      const re = parseSchedulePlan(snap);
      assert.equal(re.ok, true);
      if (re.ok) {
        assert.equal(computeScheduleDraftHash(re.plan), preview.draftHash);
      }
      mark("R1", true);
      mark("R9", true);

      const again = await commitScheduleV2({
        orgId: ORG,
        projectId: PROJECT,
        userId: null,
        studyId,
        raw,
        draftHash: preview.draftHash,
        sourceFingerprint: preview.sourceFingerprint,
      });
      assert.equal(again.ok, true);
      if (again.ok) {
        assert.equal(again.action, "idempotent");
        assert.equal(again.planId, commit.planId);
      }
      const planCount = await prisma.prepSchedulePlan.count({
        where: { studyId, idempotencyKey: { startsWith: "schedule-v2:" } },
      });
      assert.equal(planCount, 1);
      mark("R8", true);

      await purgeStudy(studyId, planIds.splice(0));
      studyId = null;
    }

    // --- R2 : 22 activités ---
    {
      const codes = Array.from({ length: 22 }, (_, i) => `GO-${String(i).padStart(2, "0")}-01`);
      const study = await createDisposableStudy(ORG, PROJECT, stamp + 1, codes);
      studyId = study.id;
      const loaded = await loadSourceContextFromDb({
        orgId: ORG,
        projectId: PROJECT,
        studyId,
      });
      const activities = codes.map((code, i) => ({
        id: `P${String(i + 1).padStart(2, "0")}`,
        name: `Tâche ${i + 1}`,
        kind: "WORK",
        duration_days: i < 21 ? 1 : 6,
        takeoff_codes: [code],
        after:
          i === 0
            ? []
            : [{ id: `P${String(i).padStart(2, "0")}`, type: "FS", lag_days: 0 }],
      }));
      const raw = aiBundle(activities);
      const preview = previewAiSchedule({
        raw,
        sourceContext: loaded.sourceContext,
      });
      assert.equal(preview.ok, true, JSON.stringify(preview));
      if (!preview.ok) throw new Error("preview R2");
      assert.equal(preview.stats.inputActivities, 22);
      assert.equal(preview.stats.calculatedActivities, 22);
      assert.equal(preview.stats.totalDurationDays, 27);

      const commit = await commitScheduleV2({
        orgId: ORG,
        projectId: PROJECT,
        userId: null,
        studyId,
        raw,
        draftHash: preview.draftHash,
        sourceFingerprint: preview.sourceFingerprint,
      });
      assert.equal(commit.ok, true, JSON.stringify(commit));
      if (!commit.ok) throw new Error("commit R2");
      planIds.push(commit.planId);
      assert.equal(commit.taskCount, 22);
      assert.equal(commit.baseDurationWorkingDays, 27);
      await assertInvariants(commit.planId, 22);
      mark("R2", true);

      await purgeStudy(studyId, planIds.splice(0));
      studyId = null;
    }

    // --- R3 rollback via fault injector (pas d’env prod) ---
    {
      const codes = Array.from({ length: 12 }, (_, i) => `GO-R3-${i}`);
      const study = await createDisposableStudy(ORG, PROJECT, stamp + 2, codes);
      studyId = study.id;
      const loaded = await loadSourceContextFromDb({
        orgId: ORG,
        projectId: PROJECT,
        studyId,
      });
      const activities = codes.map((code, i) => ({
        id: `R3${String(i + 1).padStart(2, "0")}`,
        name: `R3-${i + 1}`,
        kind: "WORK",
        duration_days: 1,
        takeoff_codes: [code],
        after:
          i === 0
            ? []
            : [{ id: `R3${String(i).padStart(2, "0")}`, type: "FS", lag_days: 0 }],
      }));
      const raw = aiBundle(activities);
      const preview = previewAiSchedule({
        raw,
        sourceContext: loaded.sourceContext,
      });
      assert.equal(preview.ok, true);
      if (!preview.ok) throw new Error("preview R3");

      setScheduleV2TestFailAfterTask(10);
      const commit = await commitScheduleV2({
        orgId: ORG,
        projectId: PROJECT,
        userId: null,
        studyId,
        raw,
        draftHash: preview.draftHash,
        sourceFingerprint: preview.sourceFingerprint,
      });
      setScheduleV2TestFailAfterTask(null);

      assert.equal(commit.ok, false);
      if (!commit.ok) assert.equal(commit.code, "TEST_FORCE_FAIL");

      const [plans, tasks, deps, links, events] = await Promise.all([
        prisma.prepSchedulePlan.count({ where: { studyId } }),
        prisma.prepScheduleTask.count({
          where: { organizationId: ORG, plan: { studyId } },
        }),
        prisma.prepScheduleDependency.count({
          where: { organizationId: ORG },
        }),
        prisma.prepScheduleTakeoffLink.count({
          where: { organizationId: ORG },
        }),
        prisma.prepScheduleEvent.count({
          where: { organizationId: ORG, plan: { studyId } },
        }),
      ]);
      assert.equal(plans, 0);
      assert.equal(tasks, 0);
      assert.equal(deps, 0);
      assert.equal(links, 0);
      assert.equal(events, 0);
      mark("R3", true);

      await purgeStudy(studyId, []);
      studyId = null;
    }

    // --- R4 PREVIEW_STALE ---
    {
      const study = await createDisposableStudy(ORG, PROJECT, stamp + 3, ["GO-STALE-01"]);
      studyId = study.id;
      const loaded = await loadSourceContextFromDb({
        orgId: ORG,
        projectId: PROJECT,
        studyId,
      });
      const raw = aiBundle([
        {
          id: "P01",
          name: "X",
          kind: "WORK",
          duration_days: 1,
          takeoff_codes: ["GO-STALE-01"],
          after: [],
        },
      ]);
      const preview = previewAiSchedule({
        raw,
        sourceContext: loaded.sourceContext,
      });
      assert.equal(preview.ok, true);
      if (!preview.ok) throw new Error("preview R4");
      const before = await prisma.prepSchedulePlan.count({ where: { studyId } });
      const commit = await commitScheduleV2({
        orgId: ORG,
        projectId: PROJECT,
        userId: null,
        studyId,
        raw,
        draftHash: "0".repeat(64),
        sourceFingerprint: preview.sourceFingerprint,
      });
      assert.equal(commit.ok, false);
      if (!commit.ok) assert.equal(commit.code, "PREVIEW_STALE");
      const after = await prisma.prepSchedulePlan.count({ where: { studyId } });
      assert.equal(after, before);
      mark("R4", true);
      await purgeStudy(studyId, []);
      studyId = null;
    }

    // --- R5 SOURCE_STALE fingerprint ---
    {
      const study = await createDisposableStudy(ORG, PROJECT, stamp + 4, ["GO-FP-01"]);
      studyId = study.id;
      const loaded = await loadSourceContextFromDb({
        orgId: ORG,
        projectId: PROJECT,
        studyId,
      });
      const raw = aiBundle([
        {
          id: "P01",
          name: "X",
          kind: "WORK",
          duration_days: 1,
          takeoff_codes: ["GO-FP-01"],
          after: [],
        },
      ]);
      const preview = previewAiSchedule({
        raw,
        sourceContext: loaded.sourceContext,
      });
      assert.equal(preview.ok, true);
      if (!preview.ok) throw new Error("preview R5");
      const before = await prisma.prepSchedulePlan.count({ where: { studyId } });
      const commit = await commitScheduleV2({
        orgId: ORG,
        projectId: PROJECT,
        userId: null,
        studyId,
        raw,
        draftHash: preview.draftHash,
        sourceFingerprint: "deadbeef",
      });
      assert.equal(commit.ok, false);
      if (!commit.ok) assert.equal(commit.code, "SOURCE_STALE");
      const after = await prisma.prepSchedulePlan.count({ where: { studyId } });
      assert.equal(after, before);
      mark("R5", true);
      await purgeStudy(studyId, []);
      studyId = null;
    }

    // --- R6 takeoffVersion ---
    {
      const study = await createDisposableStudy(ORG, PROJECT, stamp + 5, ["GO-VER-01"]);
      studyId = study.id;
      const loaded = await loadSourceContextFromDb({
        orgId: ORG,
        projectId: PROJECT,
        studyId,
      });
      const raw = aiBundle([
        {
          id: "P01",
          name: "X",
          kind: "WORK",
          duration_days: 1,
          takeoff_codes: ["GO-VER-01"],
          after: [],
        },
      ]);
      const preview = previewAiSchedule({
        raw,
        sourceContext: loaded.sourceContext,
      });
      assert.equal(preview.ok, true);
      if (!preview.ok) throw new Error("preview R6");

      await prisma.prepStudy.update({
        where: { id: studyId },
        data: { version: { increment: 1 } },
      });

      const before = await prisma.prepSchedulePlan.count({ where: { studyId } });
      const commit = await commitScheduleV2({
        orgId: ORG,
        projectId: PROJECT,
        userId: null,
        studyId,
        raw,
        draftHash: preview.draftHash,
        sourceFingerprint: preview.sourceFingerprint,
      });
      assert.equal(commit.ok, false);
      if (!commit.ok) assert.equal(commit.code, "SOURCE_STALE");
      const after = await prisma.prepSchedulePlan.count({ where: { studyId } });
      assert.equal(after, before);
      mark("R6", true);
      await purgeStudy(studyId, []);
      studyId = null;
    }

    // --- R7 PLAN_STATE_STALE (CURRENT après Preview) ---
    {
      const study = await createDisposableStudy(ORG, PROJECT, stamp + 6, ["GO-CUR-01"]);
      studyId = study.id;
      const loaded = await loadSourceContextFromDb({
        orgId: ORG,
        projectId: PROJECT,
        studyId,
      });
      const raw = aiBundle([
        {
          id: "P01",
          name: "X",
          kind: "WORK",
          duration_days: 1,
          takeoff_codes: ["GO-CUR-01"],
          after: [],
        },
      ]);
      const preview = previewAiSchedule({
        raw,
        sourceContext: loaded.sourceContext,
      });
      assert.equal(preview.ok, true);
      if (!preview.ok) throw new Error("preview R7");

      const blocker = await prisma.prepSchedulePlan.create({
        data: {
          organizationId: ORG,
          studyId,
          projectId: PROJECT,
          title: "blocker",
          status: "CURRENT",
          revisionKind: "CURRENT",
          revisionNumber: 1,
          studyVersionAtGeneration: 1,
          idempotencyKey: `blocker-${stamp}`,
        },
      });
      planIds.push(blocker.id);

      const commit = await commitScheduleV2({
        orgId: ORG,
        projectId: PROJECT,
        userId: null,
        studyId,
        raw,
        draftHash: preview.draftHash,
        sourceFingerprint: preview.sourceFingerprint,
      });
      assert.equal(commit.ok, false);
      if (!commit.ok) assert.equal(commit.code, "PLAN_STATE_STALE");
      mark("R7", true);
      await purgeStudy(studyId, planIds.splice(0));
      studyId = null;
    }

    // --- R10 ligne non exécutable ---
    {
      const study = await createDisposableStudy(ORG, PROJECT, stamp + 7, ["GO-IND-01"]);
      studyId = study.id;
      const loaded = await loadSourceContextFromDb({
        orgId: ORG,
        projectId: PROJECT,
        studyId,
      });
      const raw = aiBundle([
        {
          id: "P01",
          name: "X",
          kind: "WORK",
          duration_days: 1,
          takeoff_codes: ["GO-IND-01"],
          after: [],
        },
      ]);
      const preview = previewAiSchedule({
        raw,
        sourceContext: loaded.sourceContext,
      });
      assert.equal(preview.ok, true);
      if (!preview.ok) throw new Error("preview R10");

      await prisma.prepTakeoffLine.update({
        where: { studyId_code: { studyId, code: "GO-IND-01" } },
        data: { role: "indicator" },
      });

      const before = await prisma.prepSchedulePlan.count({ where: { studyId } });
      const commit = await commitScheduleV2({
        orgId: ORG,
        projectId: PROJECT,
        userId: null,
        studyId,
        raw,
        draftHash: preview.draftHash,
        sourceFingerprint: preview.sourceFingerprint,
      });
      assert.equal(commit.ok, false);
      const after = await prisma.prepSchedulePlan.count({ where: { studyId } });
      assert.equal(after, before);
      mark("R10", true);
      await purgeStudy(studyId, []);
      studyId = null;
    }

    // --- Concurrence : commits identiques ---
    {
      const study = await createDisposableStudy(ORG, PROJECT, stamp + 8, ["GO-C1-01", "GO-C1-02"]);
      studyId = study.id;
      const loaded = await loadSourceContextFromDb({
        orgId: ORG,
        projectId: PROJECT,
        studyId,
      });
      const raw = aiBundle([
        {
          id: "P01",
          name: "A",
          kind: "WORK",
          duration_days: 1,
          takeoff_codes: ["GO-C1-01"],
          after: [],
        },
        {
          id: "P02",
          name: "B",
          kind: "WORK",
          duration_days: 1,
          takeoff_codes: ["GO-C1-02"],
          after: [{ id: "P01", type: "FS", lag_days: 0 }],
        },
      ]);
      const preview = previewAiSchedule({
        raw,
        sourceContext: loaded.sourceContext,
      });
      assert.equal(preview.ok, true);
      if (!preview.ok) throw new Error("preview CONC_SAME");

      const [a, b] = await Promise.all([
        commitScheduleV2({
          orgId: ORG,
          projectId: PROJECT,
          userId: null,
          studyId,
          raw,
          draftHash: preview.draftHash,
          sourceFingerprint: preview.sourceFingerprint,
        }),
        commitScheduleV2({
          orgId: ORG,
          projectId: PROJECT,
          userId: null,
          studyId,
          raw,
          draftHash: preview.draftHash,
          sourceFingerprint: preview.sourceFingerprint,
        }),
      ]);

      assert.equal(a.ok, true, JSON.stringify(a));
      assert.equal(b.ok, true, JSON.stringify(b));
      if (a.ok && b.ok) {
        assert.equal(a.planId, b.planId);
        const actions = [a.action, b.action].sort();
        assert.ok(
          actions.includes("created") || actions.every((x) => x === "idempotent"),
          `actions=${actions.join(",")}`,
        );
      }
      const planCount = await prisma.prepSchedulePlan.count({ where: { studyId } });
      assert.equal(planCount, 1);
      const taskCount = await prisma.prepScheduleTask.count({
        where: { plan: { studyId } },
      });
      assert.equal(taskCount, 2);
      if (a.ok) planIds.push(a.planId);
      mark("CONC_SAME", true);
      await purgeStudy(studyId, planIds.splice(0));
      studyId = null;
    }

    // --- Concurrence : bundles différents, aucun CURRENT ---
    {
      // Deux études / deux projets jetables pour isoler? Non — même projet, deux bundles
      // différents prévisualisés sans CURRENT, commits simultanés → 1 CURRENT + PLAN_STATE_STALE
      const studyA = await createDisposableStudy(ORG, PROJECT, stamp + 9, ["GO-D1-01"]);
      // Deuxième étude sur même projet — loadSourceContext prend studyId explicite
      const studyB = await createDisposableStudy(ORG, PROJECT, stamp + 10, ["GO-D2-01"]);

      const loadedA = await loadSourceContextFromDb({
        orgId: ORG,
        projectId: PROJECT,
        studyId: studyA.id,
      });
      const loadedB = await loadSourceContextFromDb({
        orgId: ORG,
        projectId: PROJECT,
        studyId: studyB.id,
      });

      const rawA = aiBundle([
        {
          id: "A01",
          name: "BundleA",
          kind: "WORK",
          duration_days: 1,
          takeoff_codes: ["GO-D1-01"],
          after: [],
        },
      ]);
      const rawB = aiBundle([
        {
          id: "B01",
          name: "BundleB",
          kind: "WORK",
          duration_days: 2,
          takeoff_codes: ["GO-D2-01"],
          after: [],
        },
      ]);
      const prevA = previewAiSchedule({ raw: rawA, sourceContext: loadedA.sourceContext });
      const prevB = previewAiSchedule({ raw: rawB, sourceContext: loadedB.sourceContext });
      assert.equal(prevA.ok, true);
      assert.equal(prevB.ok, true);
      if (!prevA.ok || !prevB.ok) throw new Error("preview CONC_DIFF");
      assert.notEqual(prevA.draftHash, prevB.draftHash);

      const [cA, cB] = await Promise.all([
        commitScheduleV2({
          orgId: ORG,
          projectId: PROJECT,
          userId: null,
          studyId: studyA.id,
          raw: rawA,
          draftHash: prevA.draftHash,
          sourceFingerprint: prevA.sourceFingerprint,
        }),
        commitScheduleV2({
          orgId: ORG,
          projectId: PROJECT,
          userId: null,
          studyId: studyB.id,
          raw: rawB,
          draftHash: prevB.draftHash,
          sourceFingerprint: prevB.sourceFingerprint,
        }),
      ]);

      const oks = [cA, cB].filter((c) => c.ok);
      const fails = [cA, cB].filter((c) => !c.ok);
      assert.equal(oks.length, 1, JSON.stringify({ cA, cB }));
      assert.equal(fails.length, 1);
      if (!fails[0]!.ok) assert.equal(fails[0]!.code, "PLAN_STATE_STALE");

      const currentCount = await prisma.prepSchedulePlan.count({
        where: {
          projectId: PROJECT,
          status: { in: ["CURRENT", "INITIAL"] },
        },
      });
      assert.equal(currentCount, 1);

      const winnerId = oks[0]!.ok ? oks[0].planId : "";
      planIds.push(winnerId);
      mark("CONC_DIFF", true);

      await purgeStudy(studyA.id, planIds.splice(0));
      await purgeStudy(studyB.id, []);
      studyId = null;
    }

    // Fixture ROCKMAN-like mémoire uniquement
    {
      const lines = Array.from({ length: 22 }, (_, i) => ({
        code: `GO-${String(i).padStart(2, "0")}-01`,
        executable: true,
        role: "quote",
        quantity_for_planning: 10,
        validated_quantity: 10,
        declared_quantity: 10,
        computed_quantity: 10,
      }));
      const activities = lines.map((l, i) => ({
        id: `P${String(i + 1).padStart(2, "0")}`,
        name: `GO ${i + 1}`,
        kind: "WORK",
        duration_days: i < 21 ? 1 : 6,
        takeoff_codes: [l.code],
        after:
          i === 0
            ? []
            : [{ id: `P${String(i).padStart(2, "0")}`, type: "FS", lag_days: 0 }],
      }));
      const preview = previewAiSchedule({
        raw: aiBundle(activities),
        sourceContext: {
          projectId: "rockman-fixture",
          takeoffStudyId: "rockman-fixture-study",
          takeoffVersion: 4,
          takeoffFingerprint: "rockman-fixture-fp",
          lines,
        },
      });
      assert.equal(preview.ok, true, JSON.stringify(preview));
      if (preview.ok) {
        assert.equal(preview.stats.totalDurationDays, 27);
        assert.equal(expectedDependencyCount(preview.plan), 21);
        assert.equal(expectedTakeoffLinkCount(preview.plan), 22);
      }
    }

    const rockmanAfter = await prisma.prepStudy.findUnique({
      where: { id: ROCKMAN_STUDY },
      select: { version: true, _count: { select: { lines: true } } },
    });
    assert.deepEqual(rockmanAfter, rockmanBefore);

    // draftHash : projectId dans sourceSnapshot → pas de collision entre projets
    {
      const hA = computeScheduleDraftHash(
        fixturePlanSingleActivity({
          sourceSnapshot: {
            projectId: "proj-A",
            takeoffStudyId: "study-A",
            takeoffVersion: 1,
            takeoffFingerprint: "fp",
            quoteId: null,
            quoteVersion: null,
          },
        }),
      );
      const hB = computeScheduleDraftHash(
        fixturePlanSingleActivity({
          sourceSnapshot: {
            projectId: "proj-B",
            takeoffStudyId: "study-A",
            takeoffVersion: 1,
            takeoffFingerprint: "fp",
            quoteId: null,
            quoteVersion: null,
          },
        }),
      );
      assert.notEqual(hA, hB);
      assert.equal(createHash("sha256").update("x").digest("hex").length, 64);
    }

    await purgeWorld(ORG, PROJECT);
    const leftovers = await residualForOrg(ORG);
    const residualZero =
      leftovers.plans +
        leftovers.tasks +
        leftovers.deps +
        leftovers.links +
        leftovers.events +
        leftovers.quoteLinks +
        leftovers.studies ===
      0;

    console.log(
      JSON.stringify(
        {
          ok: true,
          suite: "repository/commit.test.ts",
          results,
          residualAfterCleanup: leftovers,
          residualZero,
          rockmanUntouched: true,
          migrationAutoAlter: false,
          faultInjection: "test-fault.ts hook (no env var)",
        },
        null,
        2,
      ),
    );

    const failed = Object.entries(results).filter(([, v]) => v !== "PASS");
    if (failed.length || !residualZero) {
      process.exitCode = 1;
    }
  } catch (e) {
    console.error(e);
    console.log(JSON.stringify({ ok: false, results }, null, 2));
    process.exitCode = 1;
    if (studyId) await purgeStudy(studyId, planIds).catch(() => {});
    await purgeWorld(ORG, PROJECT).catch(() => {});
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
