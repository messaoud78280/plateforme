/**
 * Commit serveur SchedulePlan V2.
 * Le navigateur n’est jamais source de vérité :
 * re-parse / re-validate / re-hash avant toute écriture.
 */
import { randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { previewAiSchedule } from "../preview";
import { parseSchedulePlan } from "../schema";
import { toDomainSnapshotJson } from "../versioning";
import {
  domainSnapshotForPersist,
  expectedDependencyCount,
  expectedTakeoffLinkCount,
  mapPlanTasksForPersistence,
} from "./mapping";
import {
  findExistingCurrentOrInitialPlan,
  loadSourceContextFromDb,
} from "./load-source-context";
import { maybeThrowScheduleV2TestFault } from "./test-fault";

export type CommitScheduleV2Input = {
  orgId: string;
  projectId: string;
  userId: string | null;
  studyId?: string | null;
  /** Bundle AI original (objet ou string JSON). */
  raw: unknown;
  draftHash: string;
  sourceFingerprint: string;
  title?: string | null;
};

export type CommitScheduleV2Success = {
  ok: true;
  planId: string;
  studyId: string;
  href: string;
  action: "created" | "idempotent";
  draftHash: string;
  taskCount: number;
  dependencyCount: number;
  takeoffLinkCount: number;
  baseDurationWorkingDays: number;
};

export type CommitScheduleV2Failure = {
  ok: false;
  code: string;
  error: string;
  issues?: unknown[];
  status: number;
  planId?: string;
};

function idempotencyKeyForDraft(draftHash: string): string {
  return `schedule-v2:${draftHash}`;
}

function extractRawObject(raw: unknown): unknown {
  if (typeof raw === "string") {
    const t = raw.trim();
    if (!t) throw Object.assign(new Error("JSON manquant"), { code: "PARSE_ERROR", status: 422 });
    try {
      return JSON.parse(t);
    } catch {
      const start = t.indexOf("{");
      const end = t.lastIndexOf("}");
      if (start >= 0 && end > start) return JSON.parse(t.slice(start, end + 1));
      throw Object.assign(new Error("JSON illisible"), { code: "PARSE_ERROR", status: 422 });
    }
  }
  return raw;
}

export async function commitScheduleV2(
  input: CommitScheduleV2Input,
): Promise<CommitScheduleV2Success | CommitScheduleV2Failure> {
  const clientDraftHash = input.draftHash.trim();
  const clientFingerprint = input.sourceFingerprint.trim();
  if (!clientDraftHash || !clientFingerprint) {
    return {
      ok: false,
      code: "MISSING_PREVIEW_META",
      error: "draftHash et sourceFingerprint requis",
      status: 422,
    };
  }

  let rawObj: unknown;
  try {
    rawObj = extractRawObject(input.raw);
  } catch (e) {
    const err = e as { message?: string; code?: string; status?: number };
    return {
      ok: false,
      code: err.code ?? "PARSE_ERROR",
      error: err.message ?? "JSON invalide",
      status: err.status ?? 422,
    };
  }

  // 1–2. Recharger sources actuelles
  const loaded = await loadSourceContextFromDb({
    orgId: input.orgId,
    projectId: input.projectId,
    studyId: input.studyId,
  });

  // 10. Fingerprint / version source
  if (loaded.sourceContext.takeoffFingerprint !== clientFingerprint) {
    return {
      ok: false,
      code: "SOURCE_STALE",
      error: "Les sources du chantier ont changé depuis la prévisualisation.",
      status: 409,
    };
  }

  // Idempotence d’abord (même draftHash = même clé)
  const keyEarly = idempotencyKeyForDraft(clientDraftHash);
  const priorEarly = await prisma.prepSchedulePlan.findUnique({
    where: {
      organizationId_idempotencyKey: {
        organizationId: input.orgId,
        idempotencyKey: keyEarly,
      },
    },
  });
  if (priorEarly) {
    return {
      ok: true,
      planId: priorEarly.id,
      studyId: loaded.studyId,
      href: `/dashboard/visites-metres/etudes/${loaded.studyId}/planning/${priorEarly.id}`,
      action: "idempotent",
      draftHash: clientDraftHash,
      taskCount: await prisma.prepScheduleTask.count({ where: { planId: priorEarly.id } }),
      dependencyCount: await prisma.prepScheduleDependency.count({
        where: { planId: priorEarly.id },
      }),
      takeoffLinkCount: await prisma.prepScheduleTakeoffLink.count({
        where: { planId: priorEarly.id },
      }),
      baseDurationWorkingDays:
        priorEarly.baseDurationWorkingDays != null
          ? Number(priorEarly.baseDurationWorkingDays)
          : 0,
    };
  }

  // CURRENT / INITIAL apparu depuis Preview (autre plan) ?
  // Si c’est le même draftHash (idempotence), renvoyer le plan existant.
  const existingCurrent = await findExistingCurrentOrInitialPlan({
    orgId: input.orgId,
    projectId: input.projectId,
  });
  if (existingCurrent) {
    const sameDraft = await prisma.prepSchedulePlan.findUnique({
      where: {
        organizationId_idempotencyKey: {
          organizationId: input.orgId,
          idempotencyKey: keyEarly,
        },
      },
    });
    if (sameDraft) {
      return {
        ok: true,
        planId: sameDraft.id,
        studyId: loaded.studyId,
        href: `/dashboard/visites-metres/etudes/${loaded.studyId}/planning/${sameDraft.id}`,
        action: "idempotent",
        draftHash: clientDraftHash,
        taskCount: await prisma.prepScheduleTask.count({ where: { planId: sameDraft.id } }),
        dependencyCount: await prisma.prepScheduleDependency.count({
          where: { planId: sameDraft.id },
        }),
        takeoffLinkCount: await prisma.prepScheduleTakeoffLink.count({
          where: { planId: sameDraft.id },
        }),
        baseDurationWorkingDays:
          sameDraft.baseDurationWorkingDays != null
            ? Number(sameDraft.baseDurationWorkingDays)
            : 0,
      };
    }
    return {
      ok: false,
      code: "PLAN_STATE_STALE",
      error: `Un planning existe déjà (rév. ${existingCurrent.revisionNumber}).`,
      status: 409,
      planId: existingCurrent.id,
    };
  }

  // 3–8. Même pipeline Preview
  const preview = previewAiSchedule({
    raw: rawObj,
    sourceContext: loaded.sourceContext,
    calendar: {
      workingDays: [1, 2, 3, 4, 5],
      holidays: "FR_METROPOLE",
      granularityDays: 0.5,
      startDate: null,
    },
  });

  if (!preview.ok) {
    return {
      ok: false,
      code: preview.issues[0]?.code ?? "VALIDATION_ERROR",
      error: preview.issues[0]?.message ?? "Validation échouée",
      issues: preview.issues,
      status: 422,
    };
  }

  // 9. Comparer hashes
  if (preview.draftHash !== clientDraftHash) {
    return {
      ok: false,
      code: "PREVIEW_STALE",
      error: "Le planning a changé depuis la prévisualisation (hash divergent).",
      status: 409,
    };
  }

  if (preview.sourceFingerprint !== clientFingerprint) {
    return {
      ok: false,
      code: "SOURCE_STALE",
      error: "Empreinte sources divergente après recalcul.",
      status: 409,
    };
  }

  const key = idempotencyKeyForDraft(preview.draftHash);

  const quantityByCode = new Map(
    loaded.sourceContext.lines.map((l) => [l.code, l.quantity_for_planning] as const),
  );
  const taskRows = mapPlanTasksForPersistence(
    preview.plan,
    preview.calculated,
    quantityByCode,
  );
  const expectDeps = expectedDependencyCount(preview.plan);
  const expectLinks = expectedTakeoffLinkCount(preview.plan);
  const expectTasks = preview.plan.activities.length;

  if (
    expectTasks !== preview.stats.inputActivities ||
    expectTasks !== preview.stats.calculatedActivities
  ) {
    return {
      ok: false,
      code: "ACTIVITY_COUNT_MISMATCH",
      error: "Invariant activités cassé avant écriture",
      status: 500,
    };
  }

  const isDemo = loaded.studyMode === "DEMONSTRATION";
  const title = (
    input.title?.trim() ||
    (isDemo
      ? `DÉMONSTRATION — Planning ${loaded.studyTitle}`
      : `Planning — ${loaded.studyTitle}`)
  ).slice(0, 200);

  // 11. Transaction atomique
  // Exclusivité CURRENT : pg_advisory_xact_lock(projectId) + re-check dans la TX.
  // La contrainte @@unique([organizationId, idempotencyKey]) couvre les retries
  // du même draftHash (P2002 → réponse idempotente contrôlée).
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Verrou transactionnel par projet — sérialise les CREATE CURRENT concurrents
      await tx.$executeRaw`
        SELECT pg_advisory_xact_lock(hashtext(${`schedule-v2-current:${input.projectId}`}))
      `;

      // Sous lock : recharger l’idempotence AVANT le check CURRENT
      // (commit concurrent identique → même clé, pas PLAN_STATE_STALE)
      const priorUnderLock = await tx.prepSchedulePlan.findUnique({
        where: {
          organizationId_idempotencyKey: {
            organizationId: input.orgId,
            idempotencyKey: key,
          },
        },
        select: {
          id: true,
          baseDurationWorkingDays: true,
          _count: {
            select: { tasks: true },
          },
        },
      });
      if (priorUnderLock) {
        const [dependencyCount, takeoffLinkCount] = await Promise.all([
          tx.prepScheduleDependency.count({ where: { planId: priorUnderLock.id } }),
          tx.prepScheduleTakeoffLink.count({ where: { planId: priorUnderLock.id } }),
        ]);
        return {
          planId: priorUnderLock.id,
          taskCount: priorUnderLock._count.tasks,
          dependencyCount,
          takeoffLinkCount,
          action: "idempotent" as const,
        };
      }

      // Re-check CURRENT dans la TX (sous lock) — autre draft uniquement
      const race = await tx.prepSchedulePlan.findFirst({
        where: {
          organizationId: input.orgId,
          projectId: input.projectId,
          status: { in: ["CURRENT", "INITIAL"] },
        },
        select: { id: true, revisionNumber: true },
      });
      if (race) {
        throw Object.assign(
          new Error(`Un planning existe déjà (rév. ${race.revisionNumber}).`),
          { code: "PLAN_STATE_STALE", status: 409, planId: race.id },
        );
      }

      const created = await tx.prepSchedulePlan.create({
        data: {
          organizationId: input.orgId,
          studyId: loaded.studyId,
          projectId: input.projectId,
          quoteId: loaded.sourceContext.quoteId ?? null,
          title,
          mode: isDemo ? "DEMONSTRATION" : "PROFESSIONAL",
          isDemonstration: isDemo,
          status: "CURRENT",
          revisionKind: "CURRENT",
          revisionNumber: 1,
          startDate: preview.calculated.startDate
            ? new Date(preview.calculated.startDate)
            : null,
          endDateBase: preview.calculated.endDate
            ? new Date(preview.calculated.endDate)
            : null,
          endDateWithConditional: preview.calculated.endDate
            ? new Date(preview.calculated.endDate)
            : null,
          baseDurationWorkingDays: preview.stats.totalDurationDays,
          withConditionalWorkingDays: preview.stats.totalDurationDays,
          studyVersionAtGeneration: loaded.sourceContext.takeoffVersion,
          calendarJson: preview.plan.calendar as unknown as Prisma.InputJsonValue,
          summaryJson: {
            engine: "schedule-domain-v1",
            draftHash: preview.draftHash,
            sourceFingerprint: preview.sourceFingerprint,
            stats: preview.stats,
          },
          domainSnapshotJson: domainSnapshotForPersist(preview.plan),
          idempotencyKey: key,
          createdById: input.userId,
        },
      });

      const idByStep = new Map<string, string>();
      const takeoffRows: Prisma.PrepScheduleTakeoffLinkCreateManyInput[] = [];
      const depRows: Prisma.PrepScheduleDependencyCreateManyInput[] = [];

      for (const [taskIndex, row] of taskRows.entries()) {
        maybeThrowScheduleV2TestFault(taskIndex);
        const task = await tx.prepScheduleTask.create({
          data: {
            organizationId: input.orgId,
            planId: created.id,
            stepCode: row.stepCode,
            name: row.name,
            kind: row.kind,
            sortOrder: row.sortOrder,
            description: row.description,
            startDate: row.startDate,
            endDate: row.endDate,
            startHalf: 0,
            endHalf: 1,
            durationMode: row.durationMode,
            durationDays: row.durationDays,
            durationCalendar: row.durationCalendar,
            computedDurationDays: row.computedDurationDays,
            driverTakeoffCode: row.driverTakeoffCode,
            quantitySnapshot: row.quantitySnapshot,
            rateId: row.rateId,
            rateValue: row.rateValue,
            rateUnit: row.rateUnit,
            parallelUnits: row.parallelUnits,
            takeoffCodesJson: row.takeoffCodesJson,
            crewJson: row.crewJson,
            equipmentJson: row.equipmentJson,
            suppliesJson: [],
            preconditionsJson: [],
            controlsJson: [],
            constraintsJson: [],
            safetyJson: [],
            proofsJson: [],
            dependsOnJson: row.dependsOnJson,
          },
        });
        idByStep.set(row.stepCode, task.id);

        const act = preview.plan.activities.find((a) => a.id === row.stepCode)!;
        for (const link of act.sourceLinks) {
          if (link.type !== "TAKEOFF_LINE") continue;
          const line = loaded.sourceContext.lines.find((l) => l.code === link.code);
          if (!line || !line.executable) {
            throw Object.assign(
              new Error(`Source métré invalide au commit : ${link.code}`),
              { code: "SOURCE_STALE", status: 409 },
            );
          }
          takeoffRows.push({
            id: randomUUID().replace(/-/g, "").slice(0, 25),
            organizationId: input.orgId,
            planId: created.id,
            taskId: task.id,
            studyLineCode: link.code,
            role: line.role,
          });
        }
      }

      for (const act of preview.plan.activities) {
        const succId = idByStep.get(act.id);
        if (!succId) continue;
        for (const pred of act.predecessors) {
          const predId = idByStep.get(pred.activityId);
          if (!predId) {
            throw Object.assign(
              new Error(`Dépendance orpheline : ${pred.activityId} → ${act.id}`),
              { code: "ORPHAN_DEPENDENCY", status: 500 },
            );
          }
          depRows.push({
            id: randomUUID().replace(/-/g, "").slice(0, 25),
            organizationId: input.orgId,
            planId: created.id,
            predecessorId: predId,
            successorId: succId,
            type: pred.relation,
            lagDays: pred.lagDays ?? 0,
          });
        }
      }

      if (takeoffRows.length) {
        await tx.prepScheduleTakeoffLink.createMany({ data: takeoffRows });
      }
      if (depRows.length) {
        await tx.prepScheduleDependency.createMany({ data: depRows });
      }

      await tx.prepScheduleEvent.create({
        data: {
          organizationId: input.orgId,
          planId: created.id,
          kind: "PLAN_CREATED",
          detailJson: {
            engine: "schedule-domain-v1",
            draftHash: preview.draftHash,
            taskCount: expectTasks,
            dependencyCount: expectDeps,
            takeoffLinkCount: expectLinks,
          },
          actorUserId: input.userId,
        },
      });

      // Invariants post-écriture (dans la TX)
      const taskCount = await tx.prepScheduleTask.count({
        where: { planId: created.id },
      });
      const depCount = await tx.prepScheduleDependency.count({
        where: { planId: created.id },
      });
      const linkCount = await tx.prepScheduleTakeoffLink.count({
        where: { planId: created.id },
      });
      if (
        taskCount !== expectTasks ||
        depCount !== expectDeps ||
        linkCount !== expectLinks
      ) {
        throw Object.assign(
          new Error(
            `Projection partielle : tasks=${taskCount}/${expectTasks} deps=${depCount}/${expectDeps} links=${linkCount}/${expectLinks}`,
          ),
          { code: "PERSISTENCE_INVARIANT", status: 500 },
        );
      }

      const snap = await tx.prepSchedulePlan.findUniqueOrThrow({
        where: { id: created.id },
        select: { domainSnapshotJson: true },
      });
      const parsedSnap = parseSchedulePlan(snap.domainSnapshotJson);
      if (!parsedSnap.ok || parsedSnap.plan.activities.length !== expectTasks) {
        throw Object.assign(
          new Error("domainSnapshotJson invalide après écriture"),
          { code: "SNAPSHOT_INVARIANT", status: 500 },
        );
      }

      return {
        planId: created.id,
        taskCount,
        dependencyCount: depCount,
        takeoffLinkCount: linkCount,
        action: "created" as const,
      };
    });

    return {
      ok: true,
      planId: result.planId,
      studyId: loaded.studyId,
      href: `/dashboard/visites-metres/etudes/${loaded.studyId}/planning/${result.planId}`,
      action: result.action,
      draftHash: preview.draftHash,
      taskCount: result.taskCount,
      dependencyCount: result.dependencyCount,
      takeoffLinkCount: result.takeoffLinkCount,
      baseDurationWorkingDays: preview.stats.totalDurationDays,
    };
  } catch (e) {
    const err = e as {
      message?: string;
      code?: string;
      status?: number;
      planId?: string;
    };
    // Unique violation → idempotent race
    if (
      String(err.message ?? "").includes("Unique constraint") ||
      String((err as { code?: string }).code) === "P2002"
    ) {
      const again = await prisma.prepSchedulePlan.findUnique({
        where: {
          organizationId_idempotencyKey: {
            organizationId: input.orgId,
            idempotencyKey: key,
          },
        },
      });
      if (again) {
        return {
          ok: true,
          planId: again.id,
          studyId: loaded.studyId,
          href: `/dashboard/visites-metres/etudes/${loaded.studyId}/planning/${again.id}`,
          action: "idempotent",
          draftHash: preview.draftHash,
          taskCount: expectTasks,
          dependencyCount: expectDeps,
          takeoffLinkCount: expectLinks,
          baseDurationWorkingDays: preview.stats.totalDurationDays,
        };
      }
    }
    return {
      ok: false,
      code: err.code ?? "COMMIT_FAILED",
      error: err.message ?? "Commit impossible",
      status: err.status ?? 500,
      planId: err.planId,
    };
  }
}

/** Helper tests : relire snapshot. */
export async function readDomainSnapshot(planId: string) {
  const plan = await prisma.prepSchedulePlan.findUnique({
    where: { id: planId },
    select: { domainSnapshotJson: true },
  });
  if (!plan?.domainSnapshotJson) return null;
  const parsed = parseSchedulePlan(plan.domainSnapshotJson);
  return parsed.ok ? toDomainSnapshotJson(parsed.plan) : null;
}
