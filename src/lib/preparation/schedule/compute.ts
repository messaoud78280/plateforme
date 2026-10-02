/**
 * Moteur de planification : durées (qty ÷ rendement) + dates + dépendances + resource leveling.
 * Ne multiplie jamais un rendement « équipe » par le nombre d'ouvriers.
 * Ne divise jamais duration_days par crew_size.
 */
import {
  addCalendarDays,
  alignDayStart,
  buildHolidaySet,
  calendarWaitEnd,
  countWorkingDaysInclusive,
  endInstantAfterWorkingDays,
  instantAfterEnd,
  nextWorkingHalf,
  normalizeCivilStartDate,
  type CalendarConfig,
  type Instant,
} from "@/lib/preparation/schedule/calendar";
import { ceilDay, ceilHalfDay } from "@/lib/preparation/schedule/duration-math";
import {
  isDesignationLikeLot,
  phaseResourceGroupKey,
  resolveCanonicalPhase,
} from "@/lib/preparation/schedule/phase";
import { buildStructuralDependencies } from "@/lib/preparation/schedule/dependencies";
import type {
  PrepResourcesDTO,
  PrepScheduleDTO,
  PrepScheduleTaskDTO,
  PrepWorkflowStepDTO,
} from "@/lib/preparation/schedule/types";
import { RATE_PER_LABELS, STEP_KIND_LABELS } from "@/lib/preparation/schedule/types";

export type QuantityResolver = (code: string) => number | null;

export type ComputedTaskDuration = {
  stepId: string;
  durationDays: number;
  calendar: "working" | "calendar";
  mode: "computed" | "fixed";
  quantity: number | null;
  quantityUnit: string | null;
  driverItem: string | null;
  rateId: string | null;
  rateValue: number | null;
  rateUnit: string | null;
  ratePer: "engin" | "equipe" | null;
  parallelUnits: number;
  rawDays: number | null;
  warnings: string[];
};

export type ScheduleResourceKeySource = "crew_id" | "lot" | "default";

export type ScheduleResourceKey = {
  /** Clé interne d’ordonnancement (jamais inventée en donnée métier persistée). */
  key: string;
  /** crew_id explicite si fourni, sinon null (fallback lot/default non écrit en bundle). */
  crewId: string | null;
  source: ScheduleResourceKeySource;
  /** true → la ressource est exclusive (pas de chevauchement). */
  exclusive: boolean;
};

export type PlacedTask = {
  stepId: string;
  name: string;
  kind: PrepWorkflowStepDTO["kind"];
  kindLabel: string;
  order: number;
  lot: string | null;
  description: string | null;
  includeInBase: boolean;
  holdPoint: boolean;
  conditional: boolean;
  conditionalConditions: string[];
  start: Instant;
  end: Instant;
  /** Date civile ISO — null si aucune date de démarrage n’a été fournie (jamais 1970). */
  startDate: string | null;
  endDate: string | null;
  duration: ComputedTaskDuration;
  crew: PrepWorkflowStepDTO["crew"];
  crewId: string | null;
  crewSize: number | null;
  workloadPersonDays: number | null;
  parallelizable: boolean;
  /** Ressource logique utilisée pour le leveling (interne). */
  resourceKey: string;
  resourceKeySource: ScheduleResourceKeySource;
  equipment: PrepWorkflowStepDTO["equipment"];
  supplies: string[];
  preconditions: string[];
  controlsBeforeNext: string[];
  constraints: string[];
  safety: string[];
  proofs: string[];
  takeoffIds: string[];
  dependsOn: Array<{
    stepId: string;
    type: "FS" | "SS" | "FF";
    lagDays: number;
  }>;
  blockingReason: string | null;
};

export type ScheduleComputeResult = {
  startDate: string | null;
  placed: PlacedTask[];
  baseEnd: Instant | null;
  baseDurationWorkingDays: number | null;
  withConditionalDurationWorkingDays: number | null;
  warnings: string[];
  errors: string[];
};

/** Normalise un libellé de lot pour une clé de ressource stable. */
export function normalizeLotResourceLabel(lot: string): string {
  return lot
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/[^A-Z0-9_:-]/g, "")
    .slice(0, 80);
}

/**
 * Résout la ressource logique d’ordonnancement.
 * Priorité : crew_id → groupe de phase stable → DEFAULT-A.
 * INTERDIT : désignation de tâche comme ressource exclusive.
 */
export function resolveScheduleResourceKey(
  step: PrepWorkflowStepDTO,
  sched?: PrepScheduleTaskDTO | null,
  opts?: { forceDefault?: boolean },
): ScheduleResourceKey {
  const explicit =
    (sched?.crew_id && sched.crew_id.trim()) ||
    (step.crew_id && step.crew_id.trim()) ||
    null;
  if (explicit) {
    return {
      key: `CREW:${explicit.trim()}`,
      crewId: explicit.trim(),
      source: "crew_id",
      exclusive: true,
    };
  }
  if (opts?.forceDefault) {
    return {
      key: "DEFAULT-A",
      crewId: null,
      source: "default",
      exclusive: true,
    };
  }

  const phase = resolveCanonicalPhase({
    lot: step.lot,
    name: step.name,
    kind: step.kind,
    description: step.description,
  });
  // Désignation unique / non classée → une seule ressource logique
  if (
    phase.wasDesignationFallback ||
    phase.role === "unclassified" ||
    isDesignationLikeLot(step.lot, step.name)
  ) {
    return {
      key: "DEFAULT-A",
      crewId: null,
      source: "default",
      exclusive: true,
    };
  }

  const group = phaseResourceGroupKey(phase);
  if (group.startsWith("LOT:") || group.startsWith("ROLE:")) {
    return {
      key: group,
      crewId: null,
      source: "lot",
      exclusive: true,
    };
  }
  return {
    key: "DEFAULT-A",
    crewId: null,
    source: "default",
    exclusive: true,
  };
}

/**
 * Détecte un découpage lot = désignation (1 lot / tâche) qui simulerait
 * autant d’équipes que de postes. Dans ce cas → resource DEFAULT-A unique.
 */
export function detectFragmentedLotFallback(
  steps: PrepWorkflowStepDTO[],
  scheduleTasks: PrepScheduleTaskDTO[],
): boolean {
  const schedById = new Map(scheduleTasks.map((t) => [t.step_id, t]));
  const withoutCrew = steps.filter((s) => {
    const sched = schedById.get(s.id);
    const crew =
      (sched?.crew_id && sched.crew_id.trim()) ||
      (s.crew_id && s.crew_id.trim()) ||
      null;
    return !crew;
  });
  if (withoutCrew.length < 4) return false;

  const designationLike = withoutCrew.filter((s) =>
    isDesignationLikeLot(s.lot, s.name),
  );
  if (designationLike.length >= Math.ceil(withoutCrew.length * 0.3)) {
    return true;
  }

  const lots = withoutCrew
    .map((s) => {
      if (isDesignationLikeLot(s.lot, s.name)) return "";
      return resolveCanonicalPhase({
        lot: s.lot,
        name: s.name,
        kind: s.kind,
        description: s.description,
      }).label;
    })
    .filter(Boolean);
  if (lots.length < 4) return false;
  const unique = new Set(lots);
  // ≥ 50 % de lots distincts → fragmentation
  return unique.size >= Math.max(3, Math.ceil(lots.length * 0.5));
}

export function computeStepDuration(
  step: PrepWorkflowStepDTO,
  resources: PrepResourcesDTO,
  qtyOf: QuantityResolver,
): ComputedTaskDuration {
  const warnings: string[] = [];
  const base: ComputedTaskDuration = {
    stepId: step.id,
    durationDays: 0,
    calendar: "working",
    mode: "fixed",
    quantity: null,
    quantityUnit: null,
    driverItem: null,
    rateId: null,
    rateValue: null,
    rateUnit: null,
    ratePer: null,
    parallelUnits: 1,
    rawDays: null,
    warnings,
  };

  if (step.duration.mode === "fixed") {
    base.durationDays = step.duration.days;
    base.calendar = step.duration.calendar;
    base.mode = "fixed";
    return base;
  }

  const computed = step.duration;
  const rate = resources.rates.find((r) => r.id === computed.rate_id);
  const qty = qtyOf(computed.driver_item);
  base.mode = "computed";
  base.driverItem = computed.driver_item;
  base.rateId = computed.rate_id;
  base.parallelUnits = Math.max(1, computed.parallel_units ?? 1);
  base.quantity = qty;

  if (!rate) {
    warnings.push(`Rendement ${computed.rate_id} introuvable`);
    base.durationDays = 0;
    return base;
  }
  if (qty == null || qty < 0) {
    warnings.push(`Quantité pilote ${computed.driver_item} indisponible`);
    base.durationDays = 0;
    return base;
  }
  if (rate.value <= 0) {
    warnings.push(`Rendement ${rate.id} invalide`);
    base.durationDays = 0;
    return base;
  }

  base.rateValue = rate.value;
  base.rateUnit = rate.unit;
  base.ratePer = rate.per;
  // Important : rate.per = equipe → le rendement est déjà celui de l'équipe.
  // On ne multiplie PAS par le nombre d'ouvriers. parallel_units = engins/équipes en parallèle.
  // On ne divise JAMAIS duration_days par crew_size.
  const productive = rate.value * base.parallelUnits;
  const raw = qty / productive;
  base.rawDays = raw;
  const rounding = computed.rounding ?? "ceil_half_day";
  base.durationDays =
    rounding === "none" ? raw : rounding === "ceil_day" ? ceilDay(raw) : ceilHalfDay(raw);
  base.calendar = "working";

  if (base.parallelUnits > 1) {
    const eqCount = step.equipment.reduce((s, e) => s + e.count, 0);
    if (rate.per === "engin" && eqCount > 0 && eqCount < base.parallelUnits) {
      warnings.push(
        `parallel_units=${base.parallelUnits} mais ${eqCount} engin(s) prévu(s) — à vérifier`,
      );
    }
  }

  return base;
}

function topoSort(
  taskIds: string[],
  deps: Map<string, string[]>,
): { order: string[]; error: string | null } {
  const incoming = new Map<string, number>();
  for (const id of taskIds) incoming.set(id, 0);
  for (const id of taskIds) {
    for (const p of deps.get(id) ?? []) {
      if (!incoming.has(p)) continue;
      incoming.set(id, (incoming.get(id) ?? 0) + 1);
    }
  }
  const queue = taskIds.filter((id) => (incoming.get(id) ?? 0) === 0);
  const order: string[] = [];
  while (queue.length) {
    const id = queue.shift()!;
    order.push(id);
    for (const [succ, preds] of deps) {
      if (!preds.includes(id)) continue;
      incoming.set(succ, (incoming.get(succ) ?? 0) - 1);
      if (incoming.get(succ) === 0) queue.push(succ);
    }
  }
  if (order.length !== taskIds.length) {
    return { order: [], error: "Cycle de dépendances détecté dans le planning" };
  }
  return { order, error: null };
}

function maxInstant(a: Instant, b: Instant): Instant {
  if (a.date > b.date) return a;
  if (a.date < b.date) return b;
  return a.half >= b.half ? a : b;
}

export function computeSchedule(input: {
  workflowSteps: PrepWorkflowStepDTO[];
  schedule: PrepScheduleDTO;
  resources: PrepResourcesDTO;
  qtyOf: QuantityResolver;
  qtyUnitOf?: (code: string) => string | null;
  /** overrides manuels { stepId: durationDays } — durationLocked */
  durationOverrides?: Record<string, number>;
}): ScheduleComputeResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  const stepById = new Map(input.workflowSteps.map((s) => [s.id, s]));
  const scheduleTasks = input.schedule.tasks.filter((t) => stepById.has(t.step_id));
  const startIso = normalizeCivilStartDate(input.schedule.start_date);

  if (!scheduleTasks.length) {
    return {
      startDate: startIso,
      placed: [],
      baseEnd: null,
      baseDurationWorkingDays: null,
      withConditionalDurationWorkingDays: null,
      warnings: ["Aucune tâche de planning liée au mode opératoire"],
      errors: [],
    };
  }

  const year = startIso ? Number(startIso.slice(0, 4)) : new Date().getFullYear();
  const cfg: CalendarConfig = {
    workingDays: input.schedule.calendar.working_days,
    holidaySet: buildHolidaySet(input.schedule.calendar.holidays, [year - 1, year, year + 1]),
  };

  // Enrichir depends_on avec dépendances structurelles (phases / contrôles / remise)
  const structural = buildStructuralDependencies(
    input.workflowSteps
      .filter((s) => scheduleTasks.some((t) => t.step_id === s.id))
      .map((s) => {
        const sched = scheduleTasks.find((t) => t.step_id === s.id);
        return {
          id: s.id,
          name: s.name,
          lot: s.lot,
          kind: s.kind,
          description: s.description,
          order: s.order,
          depends_on: (sched?.depends_on ?? []).map((d) => ({
            step_id: d.step_id,
            type: d.type,
            lag_days: d.lag_days,
          })),
        };
      }),
  );

  const enrichedScheduleTasks = scheduleTasks.map((t) => {
    const extra = structural.get(t.step_id) ?? t.depends_on;
    return {
      ...t,
      depends_on: extra.map((d) => ({
        step_id: d.step_id,
        type: d.type ?? "FS",
        lag_days: d.lag_days ?? 0,
        lag_calendar: "working" as const,
      })),
    };
  });

  const preds = new Map<string, string[]>();
  for (const t of enrichedScheduleTasks) {
    preds.set(
      t.step_id,
      t.depends_on.map((d) => d.step_id).filter((id) => stepById.has(id)),
    );
  }
  const { order, error } = topoSort(
    enrichedScheduleTasks.map((t) => t.step_id),
    preds,
  );
  if (error) {
    return {
      startDate: startIso,
      placed: [],
      baseEnd: null,
      baseDurationWorkingDays: null,
      withConditionalDurationWorkingDays: null,
      warnings,
      errors: [error],
    };
  }

  // Ancre relative interne uniquement — jamais exposée ni persistée comme date civile.
  const RELATIVE_ANCHOR = "2000-01-03"; // lundi fixe, calendrier FR
  const hasCivilStart = Boolean(startIso);
  const planStart: Instant = hasCivilStart
    ? nextWorkingHalf({ date: startIso!, half: 0 }, cfg)
    : { date: RELATIVE_ANCHOR, half: 0 };

  const placedMap = new Map<string, PlacedTask>();
  const schedById = new Map(enrichedScheduleTasks.map((t) => [t.step_id, t]));
  /** Prochaine disponibilité par ressource exclusive. */
  const resourceNextFree = new Map<string, Instant>();
  const forceDefaultResource = detectFragmentedLotFallback(
    input.workflowSteps.filter((s) =>
      enrichedScheduleTasks.some((t) => t.step_id === s.id),
    ),
    enrichedScheduleTasks,
  );
  if (forceDefaultResource) {
    warnings.push(
      "Lots trop fragmentés (quasi 1 lot / tâche) — resource leveling sur ressource logique unique DEFAULT-A (pas d’équipes inventées)",
    );
  }

  for (const stepId of order) {
    const step = stepById.get(stepId)!;
    const sched = schedById.get(stepId)!;
    let duration = computeStepDuration(step, input.resources, input.qtyOf);
    if (input.qtyUnitOf && duration.driverItem) {
      duration = {
        ...duration,
        quantityUnit: input.qtyUnitOf(duration.driverItem),
      };
    }
    const override = input.durationOverrides?.[stepId];
    if (override != null && Number.isFinite(override) && override >= 0) {
      duration = {
        ...duration,
        durationDays: override,
        warnings: [...duration.warnings, "Durée verrouillée manuellement"],
      };
    }
    warnings.push(...duration.warnings.map((w) => `${stepId} : ${w}`));

    const includeInBase =
      sched.include_in_base !== false && !step.conditional;
    const isConditional = !!step.conditional || sched.include_in_base === false;

    const resource = resolveScheduleResourceKey(step, sched, {
      forceDefault: forceDefaultResource,
    });
    const parallelizable =
      sched.parallelizable === true || step.parallelizable === true;

    let earliest: Instant = planStart;
    for (const dep of sched.depends_on) {
      const pred = placedMap.get(dep.step_id);
      if (!pred) continue;
      let cand: Instant;
      if (dep.type === "SS") {
        cand = pred.start;
      } else if (dep.type === "FF") {
        // FF : fin >= fin préd + lag — traité après placement ; ici borne basse = début plan
        cand = planStart;
      } else {
        // FS
        cand = instantAfterEnd(pred.end, cfg);
      }
      const lag = dep.lag_days ?? 0;
      if (lag > 0) {
        if ((dep.lag_calendar ?? "working") === "calendar") {
          cand = {
            date: addCalendarDays(cand.date, Math.ceil(lag)),
            half: cand.half,
          };
          cand = nextWorkingHalf(cand, cfg);
        } else {
          cand = instantAfterEnd(
            endInstantAfterWorkingDays(cand, lag, cfg),
            cfg,
          );
        }
      }
      earliest = maxInstant(earliest, cand);
    }

    // Resource leveling : même ressource exclusive → pas de chevauchement.
    // parallelizable=true n’autorise PAS le chevauchement d’une même équipe physique.
    // Attentes calendaires (wait) ne consomment pas l’équipe.
    const consumesResource = step.kind !== "wait" && resource.exclusive;
    if (consumesResource) {
      const free = resourceNextFree.get(resource.key);
      if (free) earliest = maxInstant(earliest, free);
    }

    if (sched.start_alignment === "day_start") {
      earliest = alignDayStart(earliest, cfg);
    }

    let start = earliest;
    let end: Instant;
    if (duration.calendar === "calendar" || step.kind === "wait") {
      const afterPred = sched.depends_on.length
        ? (() => {
            const pred = placedMap.get(sched.depends_on[0]!.step_id);
            return pred ? pred.end : start;
          })()
        : start;
      end = calendarWaitEnd(afterPred, duration.durationDays);
      // Début affiché = lendemain de la fin préd
      start = { date: addCalendarDays(afterPred.date, 1), half: 0 };
    } else {
      start = nextWorkingHalf(start, cfg);
      end = endInstantAfterWorkingDays(start, duration.durationDays, cfg);
    }

    // FF constraints
    for (const dep of sched.depends_on) {
      if (dep.type !== "FF") continue;
      const pred = placedMap.get(dep.step_id);
      if (!pred) continue;
      if (end.date < pred.end.date || (end.date === pred.end.date && end.half < pred.end.half)) {
        end = pred.end;
      }
    }

    if (consumesResource) {
      resourceNextFree.set(resource.key, instantAfterEnd(end, cfg));
    }

    let blockingReason: string | null = null;
    if (step.hold_point) {
      blockingReason = "Point d'arrêt — levée requise avant la suite";
    }
    if (isConditional) {
      blockingReason = blockingReason
        ? `${blockingReason} · Tâche conditionnelle`
        : "Tâche conditionnelle — hors durée de base";
    }

    const phase = resolveCanonicalPhase({
      lot: step.lot,
      name: step.name,
      kind: step.kind,
      description: step.description,
    });

    placedMap.set(stepId, {
      stepId,
      name: step.name,
      kind: step.kind,
      kindLabel: STEP_KIND_LABELS[step.kind],
      order: step.order,
      lot: phase.label,
      description: step.description ?? null,
      includeInBase,
      holdPoint: !!step.hold_point,
      conditional: isConditional,
      conditionalConditions: step.conditional?.conditions ?? [],
      start,
      end,
      startDate: hasCivilStart ? start.date : null,
      endDate: hasCivilStart ? end.date : null,
      duration,
      crew: step.crew,
      crewId: resource.crewId,
      crewSize: step.crew_size ?? null,
      workloadPersonDays: step.workload_person_days ?? null,
      parallelizable,
      resourceKey: resource.key,
      resourceKeySource: resource.source,
      equipment: step.equipment,
      supplies: step.supplies,
      preconditions: step.preconditions,
      controlsBeforeNext: step.controls_before_next,
      constraints: step.constraints,
      safety: step.safety,
      proofs: step.proofs,
      takeoffIds: step.takeoff_ids,
      dependsOn: sched.depends_on.map((d) => ({
        stepId: d.step_id,
        type: d.type,
        lagDays: d.lag_days ?? 0,
      })),
      blockingReason,
    });
  }

  const placed = order.map((id) => placedMap.get(id)!).filter(Boolean);
  const baseWorkControl = placed.filter(
    (t) => t.includeInBase && (t.kind === "work" || t.kind === "control"),
  );
  const baseEnd = baseWorkControl.reduce<Instant | null>((acc, t) => {
    if (!acc) return t.end;
    return maxInstant(acc, t.end);
  }, null);
  const allEnd = placed.reduce<Instant | null>((acc, t) => {
    if (!acc) return t.end;
    return maxInstant(acc, t.end);
  }, null);

  // Durées relatives calculables même sans date civile de démarrage.
  const baseDurationWorkingDays = baseEnd
    ? countWorkingDaysInclusive(planStart, baseEnd, cfg)
    : null;
  const withConditionalDurationWorkingDays = allEnd
    ? countWorkingDaysInclusive(planStart, allEnd, cfg)
    : null;

  return {
    startDate: startIso,
    placed,
    baseEnd,
    baseDurationWorkingDays,
    withConditionalDurationWorkingDays,
    warnings,
    errors,
  };
}

export function ratePerLabel(per: "engin" | "equipe" | null): string {
  if (!per) return "";
  return RATE_PER_LABELS[per];
}
