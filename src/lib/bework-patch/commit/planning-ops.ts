/**
 * CTX-02A — Opérations PLANNING supportées au commit universel.
 * Sous-ensemble conservateur : pas d’add/remove/dépendances.
 */
import type { Prisma } from "@prisma/client";
import type { BeworkPatchV1 } from "@/lib/bework-patch/types";
import type { AnalyzePatchImpactResult } from "@/lib/bework-patch/impact/types";
import type { ImpactPlan } from "@/lib/bework-patch/impact/types";
import { simulatePlanFromQuantityMap } from "@/lib/bework-patch/impact/simulate-planning";

export const PLANNING_COMMIT_SUPPORTED_OPS = [
  "update_task",
  "update_duration",
] as const;

export type PlanningCommitSupportedOp =
  (typeof PLANNING_COMMIT_SUPPORTED_OPS)[number];

export function isPlanningCommitSupportedOp(
  op: string,
): op is PlanningCommitSupportedOp {
  return (PLANNING_COMMIT_SUPPORTED_OPS as readonly string[]).includes(op);
}

/** Ops annoncées au catalogue mais non commitables CTX-02A. */
export const PLANNING_COMMIT_UNSUPPORTED_OPS = [
  "update_productivity",
  "update_crew",
  "update_dependency",
  "update_start_date",
  "update_workload",
  "add_task",
  "remove_task",
  "update_progress",
] as const;

/**
 * Applique un patch PLANNING local dans une transaction.
 * - Vérifie org / project / revision (base_version)
 * - N’incrémente revisionNumber qu’une fois
 * - Ne touche PAS studyVersionAtGeneration (édition ≠ sync métré CTX-04)
 */
export async function applyPlanningDirectInTx(
  tx: Prisma.TransactionClient,
  input: {
    orgId: string;
    projectId: string;
    patch: BeworkPatchV1;
    impact: AnalyzePatchImpactResult;
    plans: ImpactPlan[];
    expectedRevision: number;
  },
): Promise<{
  updated: boolean;
  planId: string;
  studyId: string;
  studyVersionAtGeneration: number;
}> {
  const planId = input.patch.origin.entity_id;
  const plan = await tx.prepSchedulePlan.findFirst({
    where: {
      id: planId,
      organizationId: input.orgId,
      projectId: input.projectId,
    },
    select: {
      id: true,
      studyId: true,
      revisionNumber: true,
      studyVersionAtGeneration: true,
      startDate: true,
    },
  });
  if (!plan) {
    throw Object.assign(new Error("Planning introuvable"), {
      code: "TARGET_NOT_FOUND",
    });
  }
  if (plan.revisionNumber !== input.expectedRevision) {
    throw Object.assign(
      new Error(
        "Le planning a été modifié depuis la génération de ce patch. Copiez un nouveau contexte et recommencez.",
      ),
      { code: "PREVIEW_STALE" },
    );
  }
  if (input.patch.origin.base_version !== plan.revisionNumber) {
    throw Object.assign(
      new Error(
        "Le planning a été modifié depuis la génération de ce patch. Copiez un nouveau contexte et recommencez.",
      ),
      { code: "VERSION_CONFLICT" },
    );
  }

  const subgraphPlan = input.plans.find((p) => p.id === plan.id) ?? null;
  if (!subgraphPlan) {
    throw Object.assign(new Error("Sous-graphe planning incohérent"), {
      code: "TARGET_NOT_FOUND",
    });
  }

  let touched = false;
  const durationOverrides = new Map<string, number>();

  for (const op of input.patch.operations) {
    if (!isPlanningCommitSupportedOp(op.op)) {
      throw Object.assign(
        new Error(`Opération ${op.op} non supportée pour le commit PLANNING.`),
        { code: "OPERATION_NOT_ALLOWED_FOR_SECTION" },
      );
    }

    if (op.target.plan_id && op.target.plan_id !== plan.id) {
      throw Object.assign(
        new Error("Tâche hors planning ciblé — commit refusé."),
        { code: "PROJECT_MISMATCH" },
      );
    }

    if (op.op === "update_task") {
      const task = subgraphPlan.tasks.find(
        (t) =>
          t.id === op.target.task_id ||
          t.id === op.target.id ||
          t.stepCode === op.target.step_code ||
          t.stepCode === op.target.code,
      );
      if (!task) {
        throw Object.assign(new Error("Tâche introuvable sur ce planning."), {
          code: "TARGET_NOT_FOUND",
        });
      }
      const data: Prisma.PrepScheduleTaskUpdateInput = {};
      if (op.changes.name !== undefined) data.name = op.changes.name;
      if (op.changes.description !== undefined) {
        data.description = op.changes.description;
      }
      if (op.changes.lot !== undefined) data.lot = op.changes.lot;
      if (Object.keys(data).length === 0) continue;
      await tx.prepScheduleTask.update({
        where: { id: task.id },
        data,
      });
      touched = true;
    }

    if (op.op === "update_duration") {
      const task = subgraphPlan.tasks.find(
        (t) =>
          t.id === op.target.task_id ||
          t.id === op.target.id ||
          t.stepCode === op.target.step_code ||
          t.stepCode === op.target.code,
      );
      if (!task) {
        throw Object.assign(new Error("Tâche introuvable sur ce planning."), {
          code: "TARGET_NOT_FOUND",
        });
      }
      const days = op.changes.duration_days;
      if (!Number.isFinite(days) || days <= 0) {
        throw Object.assign(new Error("Durée invalide (doit être > 0)."), {
          code: "INVALID_FIELD",
        });
      }
      await tx.prepScheduleTask.update({
        where: { id: task.id },
        data: {
          durationDays: days,
          computedDurationDays: days,
          durationMode: "manual",
          durationLockedByUser: true,
        },
      });
      durationOverrides.set(task.id, days);
      durationOverrides.set(task.stepCode, days);
      touched = true;
    }
  }

  if (!touched) {
    throw Object.assign(new Error("Aucune modification planning applicable."), {
      code: "EMPTY_OPERATIONS",
    });
  }

  const planData: Prisma.PrepSchedulePlanUpdateInput = {
    revisionNumber: { increment: 1 },
  };

  if (durationOverrides.size > 0) {
    const sim = simulatePlanFromQuantityMap(
      subgraphPlan,
      new Map(),
      durationOverrides,
    );
    if (sim.afterDurationWorkingDays != null) {
      planData.baseDurationWorkingDays = sim.afterDurationWorkingDays;
    }
    if (plan.startDate && sim.afterEndDate) {
      planData.endDateBase = new Date(`${sim.afterEndDate}T12:00:00.000Z`);
    }
  }

  await tx.prepSchedulePlan.update({
    where: { id: plan.id },
    data: planData,
  });

  return {
    updated: true,
    planId: plan.id,
    studyId: plan.studyId,
    studyVersionAtGeneration: plan.studyVersionAtGeneration,
  };
}
