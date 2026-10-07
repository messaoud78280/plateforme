/**
 * View-model présentation Planning — pure, sans I/O.
 * Réutilise les helpers moteur (pas de logique métier dupliquée).
 */
import type { SchedulePlanViewPayload } from "@/lib/preparation/schedule/transfer";
import {
  analyzeScheduleConsistency,
  type ConsistencyIssue,
  type ConsistencySeverity,
} from "@/lib/preparation/schedule/consistency";
import {
  resolveCanonicalPhase,
  type CanonicalPhase,
  UNCLASSIFIED_PHASE,
} from "@/lib/preparation/schedule/phase";
import { parseCrewJson } from "@/lib/preparation/schedule/crew";
import {
  formatProductivityDisplay,
  isMissingProductivity,
} from "@/lib/preparation/schedule/productivity";

export type PlanningViewTab = "planning" | "resources" | "preparation";

export type PlanningFilterId =
  | "all"
  | "incomplete"
  | "no_crew"
  | "no_rate"
  | "with_alert"
  | "controls"
  | "handover";

export type TaskVisualKind =
  | "work"
  | "control"
  | "wait"
  | "handover"
  | "incomplete"
  | "blocked";

export type PlanningTaskVM = {
  id: string;
  stepCode: string;
  name: string;
  kind: string;
  phase: CanonicalPhase;
  phaseLabel: string;
  startDate: string | null;
  endDate: string | null;
  startHalf: number;
  endHalf: number;
  durationDays: number;
  durationCalendar: string;
  durationMode: string;
  durationModeLabel: string;
  durationLabel: string;
  quantitySnapshot: number | null;
  quantityUnit: string | null;
  driverTakeoffCode: string | null;
  rateValue: number | null;
  rateUnit: string | null;
  ratePerLabel: string | null;
  parallelUnits: number;
  quantityDisplay: string;
  rateDisplay: string;
  crewId: string | null;
  crewSize: number | null;
  crewMembers: Array<{ labor_id: string; count: number; label: string }>;
  crewDisplay: string;
  workloadPersonDays: number | null;
  workloadSource: "PROVIDED" | "DERIVED" | null;
  workloadDisplay: string;
  dependsOn: Array<{ stepId: string; type: string; name?: string }>;
  successors: Array<{ stepId: string; type: string; name?: string }>;
  preconditions: string[];
  controls: string[];
  constraints: string[];
  safety: string[];
  proofs: string[];
  assumptions: string[];
  technicalReferences: SchedulePlanViewPayload["tasks"][number]["technicalReferences"];
  durationBasis: SchedulePlanViewPayload["tasks"][number]["durationBasis"];
  equipment: Array<{ equipment_id: string; count: number; label: string }>;
  supplies: Array<{ supply_id: string; count?: number; label: string }>;
  description: string | null;
  sellHtSnapshot: number | null;
  costHtSnapshot: number | null;
  holdPoint: boolean;
  holdPointStatus: string | null;
  holdPointBlocksNext: boolean;
  conditional: boolean;
  conditionalConditions: string[];
  blockingReason: string | null;
  readiness: "BLOCKING" | "TO_VALIDATE" | "READY";
  readinessReasons: string[];
  dateState: "PAST" | "CONFIRMED" | "UNCONFIRMED";
  visualKind: TaskVisualKind;
  missing: {
    crew: boolean;
    rate: boolean;
    quantity: boolean;
    preconditions: boolean;
    controls: boolean;
    equipment: boolean;
    unclassifiedPhase: boolean;
  };
  issueCodes: string[];
  raw: SchedulePlanViewPayload["tasks"][number];
};

export type PlanningPhaseVM = {
  key: string;
  label: string;
  order: number;
  role: string;
  tasks: PlanningTaskVM[];
  taskCount: number;
  startDate: string | null;
  endDate: string | null;
  durationDays: number;
};

export type QualityGroup = {
  code: string;
  severity: ConsistencySeverity;
  title: string;
  count: number;
  stepCodes: string[];
  message: string;
};

export type ResourceCrewVM = {
  crewId: string;
  label: string;
  crewSize: number | null;
  taskCount: number;
  workloadPersonDays: number | null;
  startDate: string | null;
  endDate: string | null;
  stepCodes: string[];
};

export type PlanningSummaryVM = {
  startDate: string | null;
  endDate: string | null;
  workingSpanDays: number | null;
  durationCumulatedDays: number;
  workloadKnownHj: number | null;
  taskCount: number;
  crewsFilled: number;
  dependencyCount: number;
  blockerCount: number;
  incompleteCount: number;
  readyCount: number;
  toValidateCount: number;
};

export type PlanningViewModel = {
  summary: PlanningSummaryVM;
  quality: {
    blockers: QualityGroup[];
    warnings: QualityGroup[];
    infos: QualityGroup[];
    blockerCount: number;
    incompleteCount: number;
    infoCount: number;
  };
  phases: PlanningPhaseVM[];
  tasks: PlanningTaskVM[];
  resources: ResourceCrewVM[];
  preparation: {
    noCrew: string[];
    noRate: string[];
    noPreconditions: string[];
    noControls: string[];
    noEquipment: string[];
    unclassified: string[];
    withAlert: string[];
  };
  sourceWarning: string | null;
  metreSync: {
    needsUpdate: boolean;
    studyVersionAtGeneration: number;
    currentStudyVersion: number;
  };
};

function durationModeLabel(mode: string | undefined): string {
  switch ((mode ?? "fixed").toLowerCase()) {
    case "computed":
      return "Calculée (quantité / rendement)";
    case "computed_workload":
    case "workload":
      return "Calculée (charge / effectif)";
    case "manual":
      return "Manuelle";
    default:
      return "Fixe";
  }
}

function formatDurationDays(n: number): string {
  const v = Math.round(n * 10) / 10;
  return Number.isInteger(v) ? `${v} j` : `${v.toLocaleString("fr-FR")} j`;
}

function emptyState(kind: "crew" | "rate" | "quantity" | "generic"): string {
  switch (kind) {
    case "crew":
      return "Équipe à renseigner";
    case "rate":
      return "Rendement à renseigner";
    case "quantity":
      return "À renseigner";
    default:
      return "Non renseigné";
  }
}

function minDate(dates: Array<string | null>): string | null {
  const ok = dates.filter((d): d is string => !!d);
  if (!ok.length) return null;
  return ok.reduce((a, b) => (a < b ? a : b));
}

function maxDate(dates: Array<string | null>): string | null {
  const ok = dates.filter((d): d is string => !!d);
  if (!ok.length) return null;
  return ok.reduce((a, b) => (a > b ? a : b));
}

function groupIssues(issues: ConsistencyIssue[]): QualityGroup[] {
  const map = new Map<string, QualityGroup>();
  for (const issue of issues) {
    const cur = map.get(issue.code);
    if (cur) {
      cur.count += 1;
      for (const s of issue.stepCodes ?? []) {
        if (!cur.stepCodes.includes(s)) cur.stepCodes.push(s);
      }
    } else {
      map.set(issue.code, {
        code: issue.code,
        severity: issue.severity,
        title: humanIssueTitle(issue.code),
        count: 1,
        stepCodes: [...(issue.stepCodes ?? [])],
        message: issue.message,
      });
    }
  }
  return [...map.values()].sort((a, b) => {
    const rank = { BLOCKER: 0, WARNING: 1, INFO: 2 } as const;
    return rank[a.severity] - rank[b.severity] || b.count - a.count;
  });
}

function humanIssueTitle(code: string): string {
  switch (code) {
    case "DEP_CYCLE":
      return "Cycle de dépendances";
    case "DEP_DATE_VIOLATION":
      return "Dépendance non respectée";
    case "CREW_OVERLAP":
      return "Équipe en chevauchement";
    case "RESOURCE_OVERLAP":
      return "Ressource en chevauchement";
    case "CONTROL_BEFORE_WORK":
      return "Contrôle avant travaux";
    case "HANDOVER_BEFORE_WORK":
      return "Remise trop tôt";
    case "PHASE_IS_TASK_NAME":
      return "Phase = désignation tâche";
    case "PHASE_UNCLASSIFIED":
      return "Phase à classer";
    case "PRODUCTIVITY_INCOMPLETE":
      return "Rendement incomplet";
    case "WORKLOAD_INCOMPLETE":
      return "Charge / effectif incomplets";
    case "CREW_ABSENT":
      return "Équipe absente";
    case "RATE_ABSENT":
      return "Rendement non renseigné";
    case "UNEXPLAINED_PARALLEL":
      return "Parallélisme non justifié";
    default:
      return code;
  }
}

/** Alerte sémantique légère — affichage seul, aucune correction. */
export function detectSemanticSourceWarning(
  plan: SchedulePlanViewPayload,
): string | null {
  const project = (plan.project.title ?? "").toLowerCase();
  const quote = (plan.quote?.subject ?? "").toLowerCase();
  const study = (plan.study.title ?? "").toLowerCase();
  const blob = `${quote} ${study}`;
  const house =
    /maison|r\+1|r\s*\+\s*1|120\s*m/.test(project) ||
    /maison|r\+1|120\s*m/.test(study);
  const flat =
    /appartement|t3|65\s*m|rénovation électrique|renovation electrique/.test(
      blob,
    );
  if (house && flat) {
    return "Certaines informations du dossier source (métré / devis) ne semblent pas correspondre aux informations générales du chantier.";
  }
  return null;
}

function visualKindFor(task: {
  kind: string;
  phase: CanonicalPhase;
  missing: PlanningTaskVM["missing"];
  issueCodes: string[];
}): TaskVisualKind {
  if (task.issueCodes.some((c) =>
    ["DEP_CYCLE", "CREW_OVERLAP", "CONTROL_BEFORE_WORK", "HANDOVER_BEFORE_WORK", "DEP_DATE_VIOLATION"].includes(c),
  )) {
    return "blocked";
  }
  if (task.phase.role === "handover") return "handover";
  if (task.kind === "control" || task.phase.role === "controls") return "control";
  if (task.kind === "wait") return "wait";
  if (task.missing.crew || task.missing.rate || task.missing.unclassifiedPhase) {
    return "incomplete";
  }
  return "work";
}

export function buildPlanningViewModel(
  plan: SchedulePlanViewPayload,
  todayIso = new Date().toISOString().slice(0, 10),
): PlanningViewModel {
  const consistency = analyzeScheduleConsistency(
    plan.tasks.map((t) => ({
      stepCode: t.stepCode,
      name: t.name,
      lot: t.lot,
      kind: t.kind,
      description: t.description,
      startDate: t.startDate,
      endDate: t.endDate,
      startHalf: t.startHalf,
      endHalf: t.endHalf,
      durationDays: t.durationDays,
      durationMode: t.durationMode,
      quantitySnapshot: t.quantitySnapshot,
      rateValue: t.rateValue,
      crewJson: null,
      crewId: t.crewId,
      resourceKey: t.crewId ? `CREW:${t.crewId}` : null,
      dependsOn: t.dependsOn.map((d) => {
        const typ = d.type === "SS" || d.type === "FF" ? d.type : "FS";
        return { step_id: d.stepId, type: typ as "FS" | "SS" | "FF" };
      }),
      parallelizable: t.parallelizable,
    })),
  );

  const issuesByStep = new Map<string, string[]>();
  for (const issue of [
    ...consistency.blockers,
    ...consistency.warnings,
    ...consistency.infos,
  ]) {
    for (const code of issue.stepCodes ?? []) {
      const list = issuesByStep.get(code) ?? [];
      if (!list.includes(issue.code)) list.push(issue.code);
      issuesByStep.set(code, list);
    }
  }

  const nameByStep = new Map(plan.tasks.map((t) => [t.stepCode, t.name]));

  const tasks: PlanningTaskVM[] = plan.tasks.map((t) => {
    const constraints = t.constraints ?? [];
    const proofs = t.proofs ?? [];
    const assumptions = t.assumptions ?? [];
    const technicalReferences = t.technicalReferences ?? [];
    const durationBasis = t.durationBasis ?? null;
    const phase = resolveCanonicalPhase({
      lot: t.lot,
      name: t.name,
      kind: t.kind,
      description: t.description,
    });
    const crewParsed = parseCrewJson(
      t.crewId || t.crewSize != null || t.crew.length
        ? {
            crew_id: t.crewId,
            crew_size: t.crewSize,
            members: t.crew.map((c) => ({
              labor_id: c.labor_id,
              count: c.count,
              label: c.label,
            })),
            workload_person_days: t.workloadPersonDays,
            workload_source: t.workloadSource,
          }
        : null,
    );
    const crewSize = t.crewSize ?? crewParsed.crewSize;
    const crewId = t.crewId ?? crewParsed.crewId;
    const missing = {
      crew: !(crewId || (crewSize != null && crewSize > 0) || t.crew.length),
      rate: isMissingProductivity({
        rateValue: t.rateValue,
        durationMode: t.durationMode,
        kind: t.kind,
        phaseRole: phase.role,
      }),
      quantity: t.quantitySnapshot == null,
      preconditions: t.preconditions.length === 0,
      controls: t.controls.length === 0,
      equipment: t.equipment.length === 0,
      unclassifiedPhase:
        phase.label === UNCLASSIFIED_PHASE || phase.wasDesignationFallback,
    };
    const issueCodes = issuesByStep.get(t.stepCode) ?? [];
    const successors = plan.dependencies
      .filter((d) => d.predecessorStepCode === t.stepCode)
      .map((d) => ({
        stepId: d.successorStepCode,
        type: d.type,
        name: nameByStep.get(d.successorStepCode),
      }));

    let crewDisplay: string;
    if (crewId && crewSize != null) {
      crewDisplay = `${crewId} · ${crewSize} pers.`;
    } else if (crewId) {
      crewDisplay = `Équipe ${crewId}`;
    } else if (t.crew.length) {
      crewDisplay = t.crew.map((c) => `${c.count}× ${c.label}`).join(", ");
    } else if (crewSize != null) {
      crewDisplay = `${crewSize} pers.`;
    } else {
      crewDisplay = emptyState("crew");
    }

    let quantityDisplay: string;
    if (t.quantitySnapshot != null) {
      quantityDisplay = `${t.quantitySnapshot} ${t.quantityUnit ?? ""}`.trim();
    } else {
      quantityDisplay = emptyState("quantity");
    }

    const rateDisplay = formatProductivityDisplay({
      rateValue: t.rateValue,
      rateUnit: t.rateUnit,
      ratePerLabel: t.ratePerLabel,
      quantityUnit: t.quantityUnit,
      durationMode: t.durationMode,
      kind: t.kind,
      phaseRole: phase.role,
    });

    let workloadDisplay: string;
    if (t.workloadPersonDays != null) {
      workloadDisplay =
        t.workloadSource === "DERIVED"
          ? `${t.workloadPersonDays} h.j · calculée`
          : `${t.workloadPersonDays} h.j`;
    } else {
      workloadDisplay = "—";
    }

    const vmBase = {
      missing,
      issueCodes,
      phase,
      kind: t.kind,
    };
    const readinessReasons: string[] = [];
    if (t.blockingReason) readinessReasons.push(t.blockingReason);
    if (t.holdPoint && t.holdPointBlocksNext) {
      readinessReasons.push("Point d’arrêt non levé");
    }
    if (t.preconditions.length === 0 && t.kind === "work") {
      readinessReasons.push("Prérequis à préciser");
    }
    if (t.controls.length === 0 && (t.kind === "work" || t.holdPoint)) {
      readinessReasons.push("Contrôles à préciser");
    }
    if (assumptions.length) readinessReasons.push("Hypothèses à valider");
    if (durationBasis?.toValidate) {
      readinessReasons.push("Base de durée à valider");
    }
    if (technicalReferences.some((ref) => ref.applicability === "TO_CONFIRM")) {
      readinessReasons.push("Références techniques à confirmer");
    }
    const blocking =
      Boolean(t.blockingReason) || (t.holdPoint && t.holdPointBlocksNext);
    const readiness = blocking
      ? "BLOCKING"
      : readinessReasons.length
        ? "TO_VALIDATE"
        : "READY";
    const dateState =
      !t.startDate || !t.endDate
        ? "UNCONFIRMED"
        : t.endDate.slice(0, 10) < todayIso
          ? "PAST"
          : "CONFIRMED";

    return {
      id: t.id,
      stepCode: t.stepCode,
      name: t.name,
      kind: t.kind,
      phase,
      phaseLabel: phase.label,
      startDate: t.startDate,
      endDate: t.endDate,
      startHalf: t.startHalf,
      endHalf: t.endHalf,
      durationDays: t.durationDays,
      durationCalendar: t.durationCalendar,
      durationMode: t.durationMode,
      durationModeLabel: durationModeLabel(t.durationMode),
      durationLabel: formatDurationDays(t.durationDays),
      quantitySnapshot: t.quantitySnapshot,
      quantityUnit: t.quantityUnit,
      driverTakeoffCode: t.driverTakeoffCode,
      rateValue: t.rateValue,
      rateUnit: t.rateUnit,
      ratePerLabel: t.ratePerLabel,
      parallelUnits: t.parallelUnits,
      quantityDisplay,
      rateDisplay,
      crewId,
      crewSize,
      crewMembers: t.crew,
      crewDisplay,
      workloadPersonDays: t.workloadPersonDays,
      workloadSource: t.workloadSource,
      workloadDisplay,
      dependsOn: t.dependsOn.map((d) => ({
        stepId: d.stepId,
        type: d.type,
        name: nameByStep.get(d.stepId),
      })),
      successors,
      preconditions: t.preconditions,
      controls: t.controls,
      constraints,
      safety: t.safety ?? [],
      proofs,
      assumptions,
      technicalReferences,
      durationBasis,
      equipment: t.equipment,
      supplies: t.supplies,
      description: t.description,
      sellHtSnapshot: t.sellHtSnapshot,
      costHtSnapshot: t.costHtSnapshot,
      holdPoint: t.holdPoint,
      holdPointStatus: t.holdPointStatus,
      holdPointBlocksNext: t.holdPointBlocksNext,
      conditional: t.conditional,
      conditionalConditions: t.conditionalConditions,
      blockingReason: t.blockingReason,
      readiness,
      readinessReasons: [...new Set(readinessReasons)],
      dateState,
      visualKind: visualKindFor(vmBase),
      missing,
      issueCodes,
      raw: t,
    };
  });

  const phaseMap = new Map<string, PlanningPhaseVM>();
  for (const t of tasks) {
    const key = t.phaseLabel;
    const cur = phaseMap.get(key);
    if (cur) {
      cur.tasks.push(t);
    } else {
      phaseMap.set(key, {
        key,
        label: t.phaseLabel,
        order: t.phase.order,
        role: t.phase.role,
        tasks: [t],
        taskCount: 0,
        startDate: null,
        endDate: null,
        durationDays: 0,
      });
    }
  }
  const phases = [...phaseMap.values()]
    .map((p) => ({
      ...p,
      taskCount: p.tasks.length,
      startDate: minDate(p.tasks.map((t) => t.startDate)),
      endDate: maxDate(p.tasks.map((t) => t.endDate)),
      durationDays: p.tasks.reduce((s, t) => s + t.durationDays, 0),
    }))
    .sort((a, b) => a.order - b.order || a.label.localeCompare(b.label, "fr"));

  const crewMap = new Map<string, ResourceCrewVM>();
  for (const t of tasks) {
    if (!t.crewId) continue;
    const cur = crewMap.get(t.crewId);
    if (cur) {
      cur.taskCount += 1;
      cur.stepCodes.push(t.stepCode);
      if (t.workloadPersonDays != null) {
        cur.workloadPersonDays =
          (cur.workloadPersonDays ?? 0) + t.workloadPersonDays;
      }
      cur.startDate = minDate([cur.startDate, t.startDate]);
      cur.endDate = maxDate([cur.endDate, t.endDate]);
      if (t.crewSize != null) cur.crewSize = t.crewSize;
    } else {
      crewMap.set(t.crewId, {
        crewId: t.crewId,
        label: t.crewId,
        crewSize: t.crewSize,
        taskCount: 1,
        workloadPersonDays: t.workloadPersonDays,
        startDate: t.startDate,
        endDate: t.endDate,
        stepCodes: [t.stepCode],
      });
    }
  }

  const blockers = groupIssues(consistency.blockers);
  const warnings = groupIssues(consistency.warnings);
  const infos = groupIssues(consistency.infos);

  const incompleteCount = tasks.filter(
    (t) => t.missing.crew || t.missing.rate || t.missing.unclassifiedPhase,
  ).length;

  const wlKnown = tasks
    .filter((t) => t.workloadPersonDays != null)
    .reduce((s, t) => s + (t.workloadPersonDays ?? 0), 0);

  return {
    summary: {
      startDate: plan.startDate,
      endDate: plan.endDateBase,
      workingSpanDays: plan.indicators.workingSpanDays,
      durationCumulatedDays: plan.indicators.workloadDays,
      workloadKnownHj: wlKnown > 0 ? Math.round(wlKnown * 10) / 10 : null,
      taskCount: tasks.length,
      crewsFilled: tasks.filter((t) => !t.missing.crew).length,
      dependencyCount: plan.dependencies.length,
      blockerCount: consistency.blockers.length,
      incompleteCount,
      readyCount: tasks.filter((task) => task.readiness === "READY").length,
      toValidateCount: tasks.filter((task) => task.readiness === "TO_VALIDATE").length,
    },
    quality: {
      blockers,
      warnings,
      infos,
      blockerCount: consistency.blockers.length,
      incompleteCount,
      infoCount: consistency.infos.length,
    },
    phases,
    tasks,
    resources: [...crewMap.values()].sort((a, b) =>
      a.crewId.localeCompare(b.crewId, "fr"),
    ),
    preparation: {
      noCrew: tasks.filter((t) => t.missing.crew).map((t) => t.stepCode),
      noRate: tasks.filter((t) => t.missing.rate).map((t) => t.stepCode),
      noPreconditions: tasks
        .filter((t) => t.missing.preconditions)
        .map((t) => t.stepCode),
      noControls: tasks.filter((t) => t.missing.controls).map((t) => t.stepCode),
      noEquipment: tasks
        .filter((t) => t.missing.equipment)
        .map((t) => t.stepCode),
      unclassified: tasks
        .filter((t) => t.missing.unclassifiedPhase)
        .map((t) => t.stepCode),
      withAlert: tasks
        .filter((t) => t.issueCodes.length > 0 || t.visualKind === "blocked")
        .map((t) => t.stepCode),
    },
    sourceWarning: detectSemanticSourceWarning(plan),
    metreSync: {
      needsUpdate: plan.studyVersionAtGeneration < plan.study.version,
      studyVersionAtGeneration: plan.studyVersionAtGeneration,
      currentStudyVersion: plan.study.version,
    },
  };
}

export function filterPlanningTasks(
  tasks: PlanningTaskVM[],
  filter: PlanningFilterId,
  query: string,
): PlanningTaskVM[] {
  const q = query.trim().toLowerCase();
  let list = tasks;
  switch (filter) {
    case "incomplete":
      list = list.filter(
        (t) => t.missing.crew || t.missing.rate || t.missing.unclassifiedPhase,
      );
      break;
    case "no_crew":
      list = list.filter((t) => t.missing.crew);
      break;
    case "no_rate":
      list = list.filter((t) => t.missing.rate);
      break;
    case "with_alert":
      list = list.filter(
        (t) => t.issueCodes.length > 0 || t.readiness !== "READY",
      );
      break;
    case "controls":
      list = list.filter(
        (t) => t.visualKind === "control" || t.phase.role === "controls",
      );
      break;
    case "handover":
      list = list.filter((t) => t.phase.role === "handover");
      break;
    default:
      break;
  }
  if (!q) return list;
  return list.filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      t.stepCode.toLowerCase().includes(q) ||
      t.phaseLabel.toLowerCase().includes(q) ||
      (t.crewId ?? "").toLowerCase().includes(q),
  );
}

export { formatDurationDays, emptyState, durationModeLabel };
