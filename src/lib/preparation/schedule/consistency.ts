/**
 * Validateur de cohérence d'un planning placé (post computeSchedule).
 * Ne remplace pas le moteur — diagnostique BLOCKER / WARNING / INFO.
 */

import { parseCrewJson } from "@/lib/preparation/schedule/crew";
import {
  detectDependencyCycle,
  type StructuralDep,
} from "@/lib/preparation/schedule/dependencies";
import {
  isDesignationLikeLot,
  resolveCanonicalPhase,
  UNCLASSIFIED_PHASE,
} from "@/lib/preparation/schedule/phase";

export type ConsistencySeverity = "BLOCKER" | "WARNING" | "INFO";

export type ConsistencyIssue = {
  code: string;
  severity: ConsistencySeverity;
  message: string;
  stepCodes?: string[];
};

export type ConsistencyTask = {
  stepCode: string;
  name: string;
  lot: string | null;
  kind: string;
  description?: string | null;
  startDate: string | null;
  endDate: string | null;
  startHalf: number;
  endHalf: number;
  durationDays: number;
  durationMode?: string | null;
  quantitySnapshot?: number | null;
  /** Quantité validée métré liée — pour détecter snapshot manquant. */
  validatedTakeoffQuantity?: number | null;
  driverTakeoffCode?: string | null;
  rateValue?: number | null;
  crewJson?: unknown;
  crewId?: string | null;
  resourceKey?: string | null;
  dependsOn: StructuralDep[];
  parallelizable?: boolean;
};

export type ConsistencyResult = {
  ok: boolean;
  blockers: ConsistencyIssue[];
  warnings: ConsistencyIssue[];
  infos: ConsistencyIssue[];
};

function instantKey(date: string | null, half: number): string | null {
  if (!date) return null;
  return `${date}|${half}`;
}

function overlaps(
  a: ConsistencyTask,
  b: ConsistencyTask,
): boolean {
  if (!a.startDate || !a.endDate || !b.startDate || !b.endDate) return false;
  const a0 = `${a.startDate}|${a.startHalf}`;
  const a1 = `${a.endDate}|${a.endHalf}`;
  const b0 = `${b.startDate}|${b.startHalf}`;
  const b1 = `${b.endDate}|${b.endHalf}`;
  // overlap if a starts before b ends and b starts before a ends (half-day aware lexicographic)
  return a0 <= b1 && b0 <= a1;
}

function isBeforeEnd(aEnd: ConsistencyTask, bStart: ConsistencyTask): boolean {
  if (!aEnd.endDate || !bStart.startDate) return true;
  const ae = `${aEnd.endDate}|${aEnd.endHalf}`;
  const bs = `${bStart.startDate}|${bStart.startHalf}`;
  return ae < bs || ae === `${bStart.startDate}|${bStart.startHalf - 1}`;
}

export function analyzeScheduleConsistency(
  tasks: ConsistencyTask[],
): ConsistencyResult {
  const blockers: ConsistencyIssue[] = [];
  const warnings: ConsistencyIssue[] = [];
  const infos: ConsistencyIssue[] = [];

  const byCode = new Map(tasks.map((t) => [t.stepCode, t]));
  const deps = new Map<string, StructuralDep[]>();
  for (const t of tasks) deps.set(t.stepCode, t.dependsOn ?? []);

  const cycle = detectDependencyCycle(deps);
  if (cycle.hasCycle) {
    blockers.push({
      code: "DEP_CYCLE",
      severity: "BLOCKER",
      message: `Cycle de dépendances : ${cycle.path.join(" → ")}`,
      stepCodes: cycle.path,
    });
  }

  for (const t of tasks) {
    const phase = resolveCanonicalPhase({
      lot: t.lot,
      name: t.name,
      kind: t.kind,
      description: t.description,
    });

    if (isDesignationLikeLot(t.lot, t.name)) {
      warnings.push({
        code: "PHASE_IS_TASK_NAME",
        severity: "WARNING",
        message: `Phase = désignation de tâche (« ${t.name.slice(0, 60)} »)`,
        stepCodes: [t.stepCode],
      });
    }
    if (phase.label === UNCLASSIFIED_PHASE) {
      warnings.push({
        code: "PHASE_UNCLASSIFIED",
        severity: "WARNING",
        message: `Tâche sans phase exploitable : ${t.name.slice(0, 60)}`,
        stepCodes: [t.stepCode],
      });
    }

    for (const d of t.dependsOn) {
      const pred = byCode.get(d.step_id);
      if (!pred) continue;
      if (
        t.startDate &&
        pred.endDate &&
        d.type !== "SS" &&
        d.type !== "FF"
      ) {
        const predEnd = `${pred.endDate}|${pred.endHalf}`;
        const succStart = `${t.startDate}|${t.startHalf}`;
        if (succStart < predEnd) {
          blockers.push({
            code: "DEP_DATE_VIOLATION",
            severity: "BLOCKER",
            message: `${t.stepCode} commence avant la fin de ${d.step_id}`,
            stepCodes: [t.stepCode, d.step_id],
          });
        }
      }
    }

    if (
      t.durationMode === "computed" &&
      (t.quantitySnapshot == null || !(t.rateValue != null && t.rateValue > 0))
    ) {
      warnings.push({
        code: "PRODUCTIVITY_INCOMPLETE",
        severity: "WARNING",
        message: `${t.stepCode} : mode computed sans quantité/rendement complets`,
        stepCodes: [t.stepCode],
      });
    }

    if (
      t.validatedTakeoffQuantity != null &&
      t.quantitySnapshot == null &&
      (t.driverTakeoffCode || t.kind === "work")
    ) {
      warnings.push({
        code: "MISSING_QUANTITY_DESPITE_VALIDATED",
        severity: "WARNING",
        message: `${t.stepCode} : quantité validée au métré mais absente du planning`,
        stepCodes: [t.stepCode],
      });
    }

    const crew = parseCrewJson(t.crewJson);
    if (!crew.crewSize && !t.crewId) {
      infos.push({
        code: "CREW_ABSENT",
        severity: "INFO",
        message: `${t.stepCode} : aucune équipe renseignée`,
        stepCodes: [t.stepCode],
      });
    }
    if (
      t.durationMode === "computed_workload" &&
      (crew.workloadPersonDays == null || !crew.crewSize)
    ) {
      warnings.push({
        code: "WORKLOAD_INCOMPLETE",
        severity: "WARNING",
        message: `${t.stepCode} : charge/effectif incomplets`,
        stepCodes: [t.stepCode],
      });
    }

    if (t.rateValue == null && (t.durationMode === "fixed" || !t.durationMode)) {
      infos.push({
        code: "RATE_ABSENT",
        severity: "INFO",
        message: `${t.stepCode} : rendement non renseigné (durée fixed)`,
        stepCodes: [t.stepCode],
      });
    }
  }

  // Contrôle final / remise avant travaux
  for (const t of tasks) {
    const phase = resolveCanonicalPhase({
      lot: t.lot,
      name: t.name,
      kind: t.kind,
      description: t.description,
    });
    if (phase.role !== "controls" && phase.role !== "handover") continue;
    for (const other of tasks) {
      if (other.stepCode === t.stepCode) continue;
      const op = resolveCanonicalPhase({
        lot: other.lot,
        name: other.name,
        kind: other.kind,
        description: other.description,
      });
      if (
        !["networks", "installation", "finishes", "demolition"].includes(op.role)
      ) {
        continue;
      }
      if (
        t.endDate &&
        other.startDate &&
        `${t.endDate}|${t.endHalf}` < `${other.startDate}|${other.startHalf}`
      ) {
        blockers.push({
          code:
            phase.role === "handover"
              ? "HANDOVER_BEFORE_WORK"
              : "CONTROL_BEFORE_WORK",
          severity: "BLOCKER",
          message:
            phase.role === "handover"
              ? `Remise ${t.stepCode} avant travaux ${other.stepCode}`
              : `Contrôle ${t.stepCode} avant travaux ${other.stepCode}`,
          stepCodes: [t.stepCode, other.stepCode],
        });
      }
    }
  }

  // Chevauchement même crew / même resourceKey exclusive
  for (let i = 0; i < tasks.length; i++) {
    for (let j = i + 1; j < tasks.length; j++) {
      const a = tasks[i]!;
      const b = tasks[j]!;
      if (!overlaps(a, b)) continue;
      const crewA =
        a.crewId?.trim() || parseCrewJson(a.crewJson).crewId || null;
      const crewB =
        b.crewId?.trim() || parseCrewJson(b.crewJson).crewId || null;
      if (crewA && crewB && crewA === crewB) {
        blockers.push({
          code: "CREW_OVERLAP",
          severity: "BLOCKER",
          message: `Équipe ${crewA} sur ${a.stepCode} et ${b.stepCode} en même temps`,
          stepCodes: [a.stepCode, b.stepCode],
        });
        continue;
      }
      if (
        a.resourceKey &&
        b.resourceKey &&
        a.resourceKey === b.resourceKey &&
        a.resourceKey !== "SKIP"
      ) {
        blockers.push({
          code: "RESOURCE_OVERLAP",
          severity: "BLOCKER",
          message: `Ressource ${a.resourceKey} chevauchée : ${a.stepCode} / ${b.stepCode}`,
          stepCodes: [a.stepCode, b.stepCode],
        });
      }
    }
  }

  // Simultanéité sans justification
  const byHalf = new Map<string, ConsistencyTask[]>();
  for (const t of tasks) {
    if (!t.startDate || !t.endDate) continue;
    // marquage grossier : jour de début
    const k = t.startDate;
    const list = byHalf.get(k) ?? [];
    list.push(t);
    byHalf.set(k, list);
  }
  for (const [day, list] of byHalf) {
    if (list.length < 3) continue;
    const justified = list.every((t) => {
      const crew =
        t.crewId?.trim() || parseCrewJson(t.crewJson).crewId || null;
      return Boolean(crew) || t.parallelizable === true;
    });
    if (!justified) {
      warnings.push({
        code: "UNEXPLAINED_PARALLEL",
        severity: "WARNING",
        message: `${list.length} tâches démarrent le ${day} sans équipes distinctes explicites`,
        stepCodes: list.map((t) => t.stepCode),
      });
    }
  }

  void instantKey;
  void isBeforeEnd;

  return {
    ok: blockers.length === 0,
    blockers,
    warnings,
    infos,
  };
}
