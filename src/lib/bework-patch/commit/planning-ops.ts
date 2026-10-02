/**
 * CTX-02A — Opérations PLANNING supportées au commit universel.
 * Phase 1 : update_task | update_duration | update_crew | update_productivity | update_workload
 */
import type { Prisma } from "@prisma/client";
import type { BeworkPatchV1 } from "@/lib/bework-patch/types";
import type { AnalyzePatchImpactResult } from "@/lib/bework-patch/impact/types";
import type { ImpactPlan } from "@/lib/bework-patch/impact/types";
import {
  PLANNING_COMMIT_SUPPORTED_OPS,
  PLANNING_COMMIT_UNSUPPORTED_OPS,
  isPlanningCommitSupportedOp,
  type PlanningCommitSupportedOp,
} from "@/lib/bework-patch/commit/planning-capability";
import {
  applyCrewPatch,
  applyWorkloadPatch,
  parseCrewJson,
} from "@/lib/preparation/schedule/crew";
import { resolveTaskDurationDays } from "@/lib/preparation/schedule/duration-resolve";
import { recomputePersistedPlanDatesInTx } from "@/lib/preparation/schedule/recompute-plan-dates";
import { d } from "@/lib/commercial/decimal";

export {
  PLANNING_COMMIT_SUPPORTED_OPS,
  PLANNING_COMMIT_UNSUPPORTED_OPS,
  isPlanningCommitSupportedOp,
};
export type { PlanningCommitSupportedOp };

function findTask(plan: ImpactPlan, op: { target: Record<string, unknown> }) {
  const t = op.target;
  return plan.tasks.find(
    (task) =>
      task.id === t.task_id ||
      task.id === t.id ||
      task.stepCode === t.step_code ||
      task.stepCode === t.code,
  );
}

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
  let needsDateRecompute = false;
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
      const task = findTask(subgraphPlan, op);
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
      const task = findTask(subgraphPlan, op);
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
      needsDateRecompute = true;
      touched = true;
    }

    if (op.op === "update_crew") {
      const task = findTask(subgraphPlan, op);
      if (!task) {
        throw Object.assign(new Error("Tâche introuvable sur ce planning."), {
          code: "TARGET_NOT_FOUND",
        });
      }
      const row = await tx.prepScheduleTask.findFirst({
        where: { id: task.id, organizationId: input.orgId },
        select: {
          id: true,
          stepCode: true,
          crewJson: true,
          durationDays: true,
          durationMode: true,
          durationLockedByUser: true,
          quantitySnapshot: true,
          rateValue: true,
          parallelUnits: true,
        },
      });
      if (!row) {
        throw Object.assign(new Error("Tâche introuvable sur ce planning."), {
          code: "TARGET_NOT_FOUND",
        });
      }
      const nextCrew = applyCrewPatch(row.crewJson, {
        crew_id: op.changes.crew_id,
        crew_size: op.changes.crew_size,
        parallelizable: op.changes.parallelizable,
      });
      const crewParsed = parseCrewJson(nextCrew);
      const data: Prisma.PrepScheduleTaskUpdateInput = {
        crewJson: nextCrew as Prisma.InputJsonValue,
      };

      // Mode workload : l'effectif change la durée. Mode fixed : durée inchangée.
      if (
        !row.durationLockedByUser &&
        (row.durationMode === "computed_workload" ||
          row.durationMode === "workload")
      ) {
        const resolved = resolveTaskDurationDays({
          durationMode: "computed_workload",
          durationDays: d(row.durationDays),
          workloadPersonDays: crewParsed.workloadPersonDays,
          crewSize: crewParsed.crewSize,
        });
        if (resolved.modeUsed === "computed_workload") {
          data.durationDays = resolved.durationDays;
          data.computedDurationDays = resolved.durationDays;
          durationOverrides.set(row.id, resolved.durationDays);
          durationOverrides.set(row.stepCode, resolved.durationDays);
          needsDateRecompute = true;
        }
      }

      await tx.prepScheduleTask.update({ where: { id: row.id }, data });
      // Leveling crew_id peut changer le séquençage même sans durée.
      needsDateRecompute = true;
      touched = true;
    }

    if (op.op === "update_productivity") {
      const task = findTask(subgraphPlan, op);
      if (!task) {
        throw Object.assign(new Error("Tâche introuvable sur ce planning."), {
          code: "TARGET_NOT_FOUND",
        });
      }
      const row = await tx.prepScheduleTask.findFirst({
        where: { id: task.id, organizationId: input.orgId },
        select: {
          id: true,
          stepCode: true,
          durationDays: true,
          durationMode: true,
          durationLockedByUser: true,
          quantitySnapshot: true,
          rateId: true,
          rateValue: true,
          parallelUnits: true,
        },
      });
      if (!row) {
        throw Object.assign(new Error("Tâche introuvable sur ce planning."), {
          code: "TARGET_NOT_FOUND",
        });
      }
      const rateId =
        op.changes.rate_id !== undefined ? op.changes.rate_id : row.rateId;
      const rateValue =
        op.changes.rate_value !== undefined
          ? op.changes.rate_value
          : row.rateValue != null
            ? d(row.rateValue)
            : null;
      const parallelUnits =
        op.changes.parallel_units !== undefined
          ? Math.max(1, op.changes.parallel_units)
          : row.parallelUnits;

      const data: Prisma.PrepScheduleTaskUpdateInput = {
        rateId: rateId ?? null,
        rateValue: rateValue,
        parallelUnits,
      };

      const qty = row.quantitySnapshot != null ? d(row.quantitySnapshot) : null;
      const canCompute =
        !row.durationLockedByUser &&
        qty != null &&
        qty >= 0 &&
        rateValue != null &&
        rateValue > 0;

      if (canCompute) {
        const resolved = resolveTaskDurationDays({
          durationMode: "computed",
          durationDays: d(row.durationDays),
          quantitySnapshot: qty,
          rateValue,
          parallelUnits,
        });
        data.durationMode = "computed";
        data.durationDays = resolved.durationDays;
        data.computedDurationDays = resolved.durationDays;
        durationOverrides.set(row.id, resolved.durationDays);
        durationOverrides.set(row.stepCode, resolved.durationDays);
        needsDateRecompute = true;
      }

      await tx.prepScheduleTask.update({ where: { id: row.id }, data });
      touched = true;
    }

    if (op.op === "update_workload") {
      const task = findTask(subgraphPlan, op);
      if (!task) {
        throw Object.assign(new Error("Tâche introuvable sur ce planning."), {
          code: "TARGET_NOT_FOUND",
        });
      }
      const row = await tx.prepScheduleTask.findFirst({
        where: { id: task.id, organizationId: input.orgId },
        select: {
          id: true,
          stepCode: true,
          crewJson: true,
          durationDays: true,
          durationLockedByUser: true,
        },
      });
      if (!row) {
        throw Object.assign(new Error("Tâche introuvable sur ce planning."), {
          code: "TARGET_NOT_FOUND",
        });
      }
      const wl =
        op.changes.workload_person_days !== undefined
          ? op.changes.workload_person_days
          : null;
      if (wl != null && (!Number.isFinite(wl) || wl < 0)) {
        throw Object.assign(new Error("Charge hommes-jours invalide."), {
          code: "INVALID_FIELD",
        });
      }
      const nextCrew = applyWorkloadPatch(row.crewJson, wl);
      const crewParsed = parseCrewJson(nextCrew);
      const data: Prisma.PrepScheduleTaskUpdateInput = {
        crewJson: nextCrew as Prisma.InputJsonValue,
        durationMode: "computed_workload",
      };

      if (!row.durationLockedByUser && wl != null && crewParsed.crewSize) {
        const resolved = resolveTaskDurationDays({
          durationMode: "computed_workload",
          durationDays: d(row.durationDays),
          workloadPersonDays: wl,
          crewSize: crewParsed.crewSize,
        });
        if (resolved.modeUsed === "computed_workload") {
          data.durationDays = resolved.durationDays;
          data.computedDurationDays = resolved.durationDays;
          durationOverrides.set(row.id, resolved.durationDays);
          durationOverrides.set(row.stepCode, resolved.durationDays);
          needsDateRecompute = true;
        }
      }

      await tx.prepScheduleTask.update({ where: { id: row.id }, data });
      touched = true;
    }
  }

  if (!touched) {
    throw Object.assign(new Error("Aucune modification planning applicable."), {
      code: "EMPTY_OPERATIONS",
    });
  }

  if (needsDateRecompute) {
    await recomputePersistedPlanDatesInTx(tx, {
      orgId: input.orgId,
      planId: plan.id,
      durationOverrides,
    });
  }

  await tx.prepSchedulePlan.update({
    where: { id: plan.id },
    data: { revisionNumber: { increment: 1 } },
  });

  return {
    updated: true,
    planId: plan.id,
    studyId: plan.studyId,
    studyVersionAtGeneration: plan.studyVersionAtGeneration,
  };
}
