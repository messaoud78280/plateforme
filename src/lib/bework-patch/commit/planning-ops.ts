/**
 * CTX-02A — Opérations PLANNING supportées au commit universel.
 * Phase 1 : update_task | update_duration | update_crew | update_productivity | update_workload
 * + update_dependency (écritures batchées pour rester dans la fenêtre transactionnelle).
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
import { detectDependencyCycle } from "@/lib/preparation/schedule/dependencies";
import { d } from "@/lib/commercial/decimal";
import { syncScheduleDomainSnapshotInTx } from "@/lib/schedule-domain/repository/sync-snapshot";

export {
  PLANNING_COMMIT_SUPPORTED_OPS,
  PLANNING_COMMIT_UNSUPPORTED_OPS,
  isPlanningCommitSupportedOp,
};
export type { PlanningCommitSupportedOp };

type DepEdge = { stepId: string; type: "FS" | "SS" | "FF"; lagDays: number };

type PendingDepWrite = {
  taskId: string;
  stepCode: string;
  dependsOn: DepEdge[];
};

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

function parsePersistedDeps(raw: unknown): Array<{ step_id: string }> {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((x) => {
      if (!x || typeof x !== "object") return null;
      const o = x as { stepId?: string; step_id?: string };
      const id = o.stepId ?? o.step_id;
      return id ? { step_id: id } : null;
    })
    .filter((x): x is { step_id: string } => !!x);
}

/**
 * Applique un patch PLANNING local dans une transaction.
 * - Vérifie org / project / revision (base_version)
 * - N’incrémente revisionNumber qu’une fois
 * - Ne touche PAS studyVersionAtGeneration (édition ≠ sync métré CTX-04)
 * - update_dependency : 1 findMany + validation cycles en mémoire + flush batch
 *   (évite N×findMany/create qui faisait expirer la tx interactive Prisma ~5s)
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

  let allTasksCache: Array<{
    id: string;
    stepCode: string;
    dependsOnJson: unknown;
  }> | null = null;
  let depsMapWorking: Map<string, Array<{ step_id: string }>> | null = null;
  const pendingDepWrites = new Map<string, PendingDepWrite>();

  const plainStrings = (raw: unknown): string[] =>
    Array.isArray(raw)
      ? raw.filter((item): item is string => typeof item === "string")
      : [];
  const typedEntries = (raw: unknown, type: string): Record<string, unknown>[] =>
    Array.isArray(raw)
      ? raw.filter(
          (item): item is Record<string, unknown> =>
            !!item &&
            typeof item === "object" &&
            !Array.isArray(item) &&
            (item as { type?: unknown }).type === type,
        )
      : [];

  const ensureDepGraph = async () => {
    if (allTasksCache && depsMapWorking) return;
    allTasksCache = await tx.prepScheduleTask.findMany({
      where: { planId: plan.id, organizationId: input.orgId },
      select: { id: true, stepCode: true, dependsOnJson: true },
    });
    depsMapWorking = new Map();
    for (const row of allTasksCache) {
      depsMapWorking.set(row.stepCode, parsePersistedDeps(row.dependsOnJson));
    }
  };

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
      if (op.changes.preconditions !== undefined) {
        data.preconditionsJson = op.changes.preconditions as Prisma.InputJsonValue;
      }
      if (op.changes.controls !== undefined) {
        data.controlsJson = op.changes.controls as Prisma.InputJsonValue;
      }
      if (
        op.changes.constraints !== undefined ||
        op.changes.assumptions !== undefined ||
        op.changes.duration_basis !== undefined
      ) {
        const current = await tx.prepScheduleTask.findUnique({
          where: { id: task.id },
          select: { constraintsJson: true },
        });
        const constraints =
          op.changes.constraints ?? plainStrings(current?.constraintsJson);
        const assumptions =
          op.changes.assumptions?.map((label) => ({ type: "ASSUMPTION", label })) ??
          typedEntries(current?.constraintsJson, "ASSUMPTION");
        const durationBasis =
          op.changes.duration_basis === undefined
            ? typedEntries(current?.constraintsJson, "DURATION_BASIS")
            : op.changes.duration_basis
              ? [{ type: "DURATION_BASIS", ...op.changes.duration_basis }]
              : [];
        const phases = typedEntries(current?.constraintsJson, "PHASE");
        data.constraintsJson = [
          ...constraints,
          ...phases,
          ...assumptions,
          ...durationBasis,
        ] as Prisma.InputJsonValue;
      }
      if (op.changes.safety !== undefined) {
        data.safetyJson = op.changes.safety as Prisma.InputJsonValue;
      }
      if (
        op.changes.proofs !== undefined ||
        op.changes.technical_references !== undefined
      ) {
        const current = await tx.prepScheduleTask.findUnique({
          where: { id: task.id },
          select: { proofsJson: true },
        });
        const proofs = op.changes.proofs ?? plainStrings(current?.proofsJson);
        const references =
          op.changes.technical_references?.map((reference) => ({
            type: "TECHNICAL_REFERENCE",
            ...reference,
          })) ?? typedEntries(current?.proofsJson, "TECHNICAL_REFERENCE");
        data.proofsJson = [...proofs, ...references] as Prisma.InputJsonValue;
      }
      if (op.changes.hold_point !== undefined) {
        data.holdPoint = op.changes.hold_point;
      }
      if (op.changes.equipment !== undefined) {
        data.equipmentJson = op.changes.equipment as Prisma.InputJsonValue;
      }
      if (op.changes.supplies !== undefined) {
        data.suppliesJson = op.changes.supplies as Prisma.InputJsonValue;
      }
      if (Object.keys(data).length === 0) continue;
      await tx.prepScheduleTask.update({
        where: { id: task.id },
        data,
      });
      touched = true;
    }

    if (op.op === "update_dependency") {
      const task = findTask(subgraphPlan, op);
      if (!task) {
        throw Object.assign(new Error("Tâche introuvable sur ce planning."), {
          code: "TARGET_NOT_FOUND",
        });
      }
      const dependsOn: DepEdge[] = (op.changes.depends_on ?? []).map((d) => ({
        stepId: d.step_id,
        type: d.type ?? "FS",
        lagDays: d.lag_days ?? 0,
      }));

      await ensureDepGraph();
      const depsMap = depsMapWorking!;
      depsMap.set(
        task.stepCode,
        dependsOn.map((d) => ({ step_id: d.stepId })),
      );
      const cycle = detectDependencyCycle(depsMap);
      if (cycle.hasCycle) {
        throw Object.assign(
          new Error(
            `Cycle de dépendances refusé : ${cycle.path.join(" → ")}`,
          ),
          { code: "DEP_CYCLE" },
        );
      }

      pendingDepWrites.set(task.id, {
        taskId: task.id,
        stepCode: task.stepCode,
        dependsOn,
      });
      needsDateRecompute = true;
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
        members: op.changes.members?.map((member) => ({
          ...member,
          count: member.count ?? 1,
        })),
      });
      const crewParsed = parseCrewJson(nextCrew);
      const data: Prisma.PrepScheduleTaskUpdateInput = {
        crewJson: nextCrew as Prisma.InputJsonValue,
      };

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
      needsDateRecompute = true;
      touched = true;
    }

    if (op.op === "update_start_date") {
      const startDate = op.changes.start_date
        ? new Date(`${op.changes.start_date}T00:00:00.000Z`)
        : null;
      if (startDate && Number.isNaN(startDate.getTime())) {
        throw Object.assign(new Error("Date de démarrage invalide."), {
          code: "INVALID_FIELD",
        });
      }
      await tx.prepSchedulePlan.update({
        where: { id: plan.id },
        data: { startDate },
      });
      needsDateRecompute = true;
      touched = true;
    }

    if (op.op === "add_task") {
      if (!Number.isFinite(op.task.duration_days) || op.task.duration_days <= 0) {
        throw Object.assign(new Error("Durée de la nouvelle tâche invalide."), {
          code: "INVALID_FIELD",
        });
      }
      await ensureDepGraph();
      if (depsMapWorking!.has(op.task.step_code)) {
        throw Object.assign(new Error(`Code tâche déjà utilisé : ${op.task.step_code}`), {
          code: "DUPLICATE_ACTIVITY_ID",
        });
      }
      const knownSteps = new Set(allTasksCache!.map((task) => task.stepCode));
      for (const dep of op.task.depends_on ?? []) {
        if (dep.step_id === op.task.step_code || !knownSteps.has(dep.step_id)) {
          throw Object.assign(
            new Error(`Prédécesseur invalide pour ${op.task.step_code} : ${dep.step_id}`),
            { code: "UNKNOWN_PREDECESSOR" },
          );
        }
      }
      const maxSort = await tx.prepScheduleTask.aggregate({
        where: { planId: plan.id, organizationId: input.orgId },
        _max: { sortOrder: true },
      });
      const crewJson =
        op.task.kind === "WAIT"
          ? { crew_id: null, crew_size: null, members: [] }
          : {
              crew_id: op.task.crew_id ?? null,
              crew_size: op.task.crew_size ?? null,
              members: op.task.members ?? [],
            };
      const constraintsJson = [
        ...(op.task.constraints ?? []),
        ...(op.task.assumptions ?? []).map((label) => ({
          type: "ASSUMPTION",
          label,
        })),
      ];
      const proofsJson = [
        ...(op.task.proofs ?? []),
        ...(op.task.technical_references ?? []).map((reference) => ({
          type: "TECHNICAL_REFERENCE",
          ...reference,
        })),
      ];
      const dependsOn: DepEdge[] = (op.task.depends_on ?? []).map((dep) => ({
        stepId: dep.step_id,
        type: dep.type ?? "FS",
        lagDays: dep.lag_days ?? 0,
      }));
      const createdTask = await tx.prepScheduleTask.create({
        data: {
          organizationId: input.orgId,
          planId: plan.id,
          stepCode: op.task.step_code,
          name: op.task.name,
          kind: (op.task.kind ?? "WORK").toLowerCase(),
          sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
          lot: op.task.lot ?? null,
          description: op.task.description ?? null,
          holdPoint: op.task.hold_point ?? false,
          durationDays: op.task.duration_days,
          computedDurationDays: op.task.duration_days,
          durationMode: "manual",
          durationCalendar: op.task.duration_calendar ?? "working",
          durationLockedByUser: true,
          crewJson: crewJson as Prisma.InputJsonValue,
          equipmentJson: [],
          suppliesJson: [],
          preconditionsJson: (op.task.preconditions ?? []) as Prisma.InputJsonValue,
          controlsJson: (op.task.controls ?? []) as Prisma.InputJsonValue,
          constraintsJson: constraintsJson as Prisma.InputJsonValue,
          safetyJson: (op.task.safety ?? []) as Prisma.InputJsonValue,
          proofsJson: proofsJson as Prisma.InputJsonValue,
          takeoffCodesJson: [],
          dependsOnJson: dependsOn as unknown as Prisma.InputJsonValue,
        },
      });
      allTasksCache!.push({
        id: createdTask.id,
        stepCode: createdTask.stepCode,
        dependsOnJson: dependsOn,
      });
      depsMapWorking!.set(
        createdTask.stepCode,
        dependsOn.map((dep) => ({ step_id: dep.stepId })),
      );
      pendingDepWrites.set(createdTask.id, {
        taskId: createdTask.id,
        stepCode: createdTask.stepCode,
        dependsOn,
      });
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

      // Contrat update_productivity : rate_id / rate_value / parallel_units uniquement.
      // Référence de production — ne jamais basculer le mode durée ni recalculer.
      await tx.prepScheduleTask.update({
        where: { id: row.id },
        data: {
          rateId: rateId ?? null,
          rateValue: rateValue,
          parallelUnits,
        },
      });
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

  if (pendingDepWrites.size > 0) {
    await flushDependencyWritesInTx(tx, {
      orgId: input.orgId,
      planId: plan.id,
      allTasks: allTasksCache ?? [],
      pending: [...pendingDepWrites.values()],
    });
  }

  if (needsDateRecompute) {
    await recomputePersistedPlanDatesInTx(tx, {
      orgId: input.orgId,
      planId: plan.id,
      durationOverrides,
    });
  }

  await syncScheduleDomainSnapshotInTx(tx, {
    orgId: input.orgId,
    planId: plan.id,
  });

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

/** Écritures relationnelles dépendances — batch, même client transactionnel. */
export async function flushDependencyWritesInTx(
  tx: Prisma.TransactionClient,
  input: {
    orgId: string;
    planId: string;
    allTasks: Array<{ id: string; stepCode: string }>;
    pending: PendingDepWrite[];
  },
): Promise<{ tasksUpdated: number; edgesCreated: number }> {
  const idByStep = new Map(input.allTasks.map((t) => [t.stepCode, t.id]));
  for (const p of input.pending) {
    idByStep.set(p.stepCode, p.taskId);
  }

  const successorIds = input.pending.map((p) => p.taskId);

  for (const p of input.pending) {
    await tx.prepScheduleTask.update({
      where: { id: p.taskId },
      data: {
        dependsOnJson: p.dependsOn as unknown as Prisma.InputJsonValue,
      },
    });
  }

  if (successorIds.length) {
    await tx.prepScheduleDependency.deleteMany({
      where: {
        planId: input.planId,
        successorId: { in: successorIds },
      },
    });
  }

  const rows: Prisma.PrepScheduleDependencyCreateManyInput[] = [];
  for (const p of input.pending) {
    for (const d of p.dependsOn) {
      const predId = idByStep.get(d.stepId);
      if (!predId) continue;
      rows.push({
        organizationId: input.orgId,
        planId: input.planId,
        predecessorId: predId,
        successorId: p.taskId,
        type: d.type,
        lagDays: d.lagDays,
      });
    }
  }

  if (rows.length) {
    await tx.prepScheduleDependency.createMany({ data: rows });
  }

  return { tasksUpdated: input.pending.length, edgesCreated: rows.length };
}
