/**
 * Simulation planning — copie mémoire + recalcul durée / dates (aucune écriture).
 */
import type { ImpactPlan, ImpactScheduleTask } from "@/lib/bework-patch/impact/types";

function ceilHalfDay(days: number): number {
  return Math.ceil(days * 2) / 2;
}

function addWorkingDays(iso: string | null, days: number): string | null {
  if (!iso || !Number.isFinite(days)) return iso;
  // Approximation V1 : jours calendaires (le moteur complet gère les jours ouvrés).
  const d = new Date(`${iso.slice(0, 10)}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  d.setUTCDate(d.getUTCDate() + Math.round(days));
  return d.toISOString().slice(0, 10);
}

export type TaskDurationSim = {
  taskId: string;
  stepCode: string;
  name: string;
  beforeDuration: number;
  afterDuration: number;
  beforeQty: number | null;
  afterQty: number | null;
  quantityUnit: string | null;
  mode: "rate" | "scale" | "direct" | "locked" | "unchanged";
};

export type PlanSimResult = {
  tasks: TaskDurationSim[];
  beforeDurationWorkingDays: number | null;
  afterDurationWorkingDays: number | null;
  beforeEndDate: string | null;
  afterEndDate: string | null;
};

/** Recalcule la durée d’une tâche à partir d’une nouvelle quantité pilote. */
export function simulateTaskDurationFromQty(
  task: ImpactScheduleTask,
  newQty: number | null,
): TaskDurationSim {
  const beforeQty = task.quantitySnapshot;
  const base: TaskDurationSim = {
    taskId: task.id,
    stepCode: task.stepCode,
    name: task.name,
    beforeDuration: task.durationDays,
    afterDuration: task.durationDays,
    beforeQty,
    afterQty: newQty,
    quantityUnit: task.quantityUnit,
    mode: "unchanged",
  };

  if (task.durationLockedByUser) {
    return { ...base, mode: "locked" };
  }

  if (
    task.durationMode === "computed" &&
    task.rateValue != null &&
    task.rateValue > 0 &&
    newQty != null &&
    newQty >= 0
  ) {
    const productive = task.rateValue * Math.max(1, task.parallelUnits || 1);
    const raw = newQty / productive;
    return {
      ...base,
      afterDuration: ceilHalfDay(raw),
      mode: "rate",
    };
  }

  if (
    beforeQty != null &&
    beforeQty > 0 &&
    newQty != null &&
    newQty >= 0 &&
    Math.abs(beforeQty - newQty) > 1e-9
  ) {
    const scale = newQty / beforeQty;
    return {
      ...base,
      afterDuration: Math.round(task.durationDays * scale * 10000) / 10000,
      mode: "scale",
    };
  }

  return base;
}

export function simulatePlanFromQuantityMap(
  plan: ImpactPlan,
  qtyByTakeoffCode: Map<string, number | null>,
  durationOverrides?: Map<string, number>,
): PlanSimResult {
  const tasks: TaskDurationSim[] = [];
  let deltaDays = 0;

  for (const task of plan.tasks) {
    const direct = durationOverrides?.get(task.id) ?? durationOverrides?.get(task.stepCode);
    if (direct != null) {
      const sim: TaskDurationSim = {
        taskId: task.id,
        stepCode: task.stepCode,
        name: task.name,
        beforeDuration: task.durationDays,
        afterDuration: direct,
        beforeQty: task.quantitySnapshot,
        afterQty: task.quantitySnapshot,
        quantityUnit: task.quantityUnit,
        mode: "direct",
      };
      tasks.push(sim);
      deltaDays += sim.afterDuration - sim.beforeDuration;
      continue;
    }

    const codes = plan.takeoffLinks
      .filter((l) => l.taskId === task.id)
      .map((l) => l.studyLineCode);
    const driver = task.driverTakeoffCode ?? codes[0] ?? null;
    const newQty = driver != null && qtyByTakeoffCode.has(driver)
      ? qtyByTakeoffCode.get(driver)!
      : null;

    const sim =
      newQty != null
        ? simulateTaskDurationFromQty(task, newQty)
        : simulateTaskDurationFromQty(task, task.quantitySnapshot);

    tasks.push(sim);
    if (sim.mode !== "unchanged" && sim.mode !== "locked") {
      deltaDays += sim.afterDuration - sim.beforeDuration;
    }
  }

  const beforeDur = plan.baseDurationWorkingDays;
  const afterDur =
    beforeDur != null
      ? Math.round((beforeDur + deltaDays) * 100) / 100
      : tasks.reduce((s, t) => s + t.afterDuration, 0);

  return {
    tasks,
    beforeDurationWorkingDays: beforeDur,
    afterDurationWorkingDays: afterDur,
    beforeEndDate: plan.endDateBase,
    afterEndDate: addWorkingDays(plan.endDateBase, deltaDays),
  };
}
