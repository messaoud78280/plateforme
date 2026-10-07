/**
 * Moteur de calcul pur — SchedulePlan → CalculatedSchedule.
 * Aucun accès BDD / React. Si cycle détecté → erreur (ne calcule pas).
 */
import { ceilDay, ceilHalfDay } from "@/lib/preparation/schedule/duration-math";
import {
  addCalendarDays,
  buildHolidaySet,
  calendarWaitEnd,
  endInstantAfterWorkingDays,
  instantAfterEnd,
  nextWorkingHalf,
  normalizeCivilStartDate,
  type CalendarConfig,
  type Instant,
} from "@/lib/preparation/schedule/calendar";
import {
  buildDepsMapFromPredecessors,
  detectScheduleDependencyCycle,
} from "./cycle";
import type { DomainIssue, SchedulePlan } from "./schema";

export type CalculatedActivity = {
  id: string;
  name: string;
  kind: string;
  durationDays: number;
  durationMode: "FIXED" | "PRODUCTIVITY";
  calendar: "working" | "calendar";
  startDate: string | null;
  endDate: string | null;
  predecessors: Array<{ activityId: string; relation: string; lagDays: number }>;
};

export type CalculatedSchedule = {
  activities: CalculatedActivity[];
  startDate: string | null;
  endDate: string | null;
  totalDurationDays: number;
  workActivities: number;
  waitActivities: number;
  controlActivities: number;
};

export type CalculateScheduleResult =
  | { ok: true; calculated: CalculatedSchedule }
  | { ok: false; issues: DomainIssue[] };

function resolveDurationDays(
  plan: SchedulePlan,
  activityId: string,
  quantityByCode: Map<string, number | null>,
): { days: number; mode: "FIXED" | "PRODUCTIVITY"; calendar: "working" | "calendar" } {
  const act = plan.activities.find((a) => a.id === activityId)!;
  if (act.duration.mode === "FIXED") {
    return {
      days: act.duration.days,
      mode: "FIXED",
      calendar: act.duration.calendar,
    };
  }
  const qty = quantityByCode.get(act.duration.sourceCode) ?? null;
  const parallel = Math.max(1, act.duration.parallelUnits ?? 1);
  if (qty == null || qty < 0 || act.duration.rate <= 0) {
    return { days: 0, mode: "PRODUCTIVITY", calendar: "working" };
  }
  const raw = qty / (act.duration.rate * parallel);
  const rounding = act.duration.rounding ?? "ceil_half_day";
  const days =
    rounding === "none"
      ? raw
      : rounding === "ceil_day"
        ? ceilDay(raw)
        : ceilHalfDay(raw);
  return { days, mode: "PRODUCTIVITY", calendar: "working" };
}

function topoOrder(
  ids: string[],
  preds: Map<string, string[]>,
): string[] | null {
  const incoming = new Map<string, number>();
  for (const id of ids) incoming.set(id, 0);
  for (const id of ids) {
    for (const p of preds.get(id) ?? []) {
      if (!incoming.has(p)) continue;
      incoming.set(id, (incoming.get(id) ?? 0) + 1);
    }
  }
  const queue = ids.filter((id) => (incoming.get(id) ?? 0) === 0);
  const order: string[] = [];
  while (queue.length) {
    const id = queue.shift()!;
    order.push(id);
    for (const [succ, ps] of preds) {
      if (!ps.includes(id)) continue;
      incoming.set(succ, (incoming.get(succ) ?? 0) - 1);
      if (incoming.get(succ) === 0) queue.push(succ);
    }
  }
  return order.length === ids.length ? order : null;
}

function maxInstant(a: Instant, b: Instant): Instant {
  if (a.date > b.date) return a;
  if (a.date < b.date) return b;
  return a.half >= b.half ? a : b;
}

/**
 * Calcule dates et durée globale.
 * Ne calcule RIEN si cycle.
 */
export function calculateSchedule(
  plan: SchedulePlan,
  options?: {
    quantityByCode?: Map<string, number | null>;
  },
): CalculateScheduleResult {
  const depsMap = buildDepsMapFromPredecessors(plan.activities);
  const cycle = detectScheduleDependencyCycle(depsMap);
  if (cycle.hasCycle) {
    return {
      ok: false,
      issues: [
        {
          code: "DEPENDENCY_CYCLE",
          path: "activities",
          value: cycle.path,
          message: `Cycle de dépendances : ${cycle.path.join(" → ")} — aucun calcul effectué`,
          severity: "ERROR",
        },
      ],
    };
  }

  const ids = plan.activities.map((a) => a.id);
  const order = topoOrder(ids, depsMap);
  if (!order) {
    return {
      ok: false,
      issues: [
        {
          code: "DEPENDENCY_CYCLE",
          path: "activities",
          value: null,
          message: "Graphe non triable — cycle probable",
          severity: "ERROR",
        },
      ],
    };
  }

  const quantityByCode = options?.quantityByCode ?? new Map();
  const startIso =
    normalizeCivilStartDate(plan.calendar.startDate) ?? "2026-10-06";
  const year = Number(startIso.slice(0, 4));
  const cfg: CalendarConfig = {
    workingDays: plan.calendar.workingDays,
    holidaySet: buildHolidaySet(plan.calendar.holidays, [year - 1, year, year + 1]),
  };

  const byId = new Map(plan.activities.map((a) => [a.id, a]));
  const placed = new Map<
    string,
    { start: Instant; end: Instant; durationDays: number; mode: "FIXED" | "PRODUCTIVITY"; calendar: "working" | "calendar" }
  >();

  // Early start along critical path lengths (duration units)
  const earliestFinish = new Map<string, number>();

  for (const id of order) {
    const act = byId.get(id)!;
    const resolved = resolveDurationDays(plan, id, quantityByCode);
    let earliestStartUnits = 0;
    let earliest: Instant = nextWorkingHalf({ date: startIso, half: 0 }, cfg);

    for (const pred of act.predecessors) {
      const p = placed.get(pred.activityId);
      if (!p) continue;
      const lag = pred.lagDays ?? 0;
      const predFinishUnits = earliestFinish.get(pred.activityId) ?? 0;
      if (pred.relation === "SS") {
        // start-start: successor start >= pred start + lag (approx using finish-duration)
        earliestStartUnits = Math.max(
          earliestStartUnits,
          predFinishUnits - p.durationDays + lag,
        );
      } else if (pred.relation === "FF") {
        earliestStartUnits = Math.max(
          earliestStartUnits,
          predFinishUnits + lag - resolved.days,
        );
      } else {
        // FS
        earliestStartUnits = Math.max(earliestStartUnits, predFinishUnits + lag);
      }

      let cand = instantAfterEnd(p.end, cfg);
      if (lag > 0) {
        if (p.calendar === "calendar" || act.kind === "WAIT") {
          cand = {
            date: addCalendarDays(p.end.date, Math.ceil(lag)),
            half: 0,
          };
        } else {
          cand = instantAfterEnd(
            endInstantAfterWorkingDays(cand, lag, cfg),
            cfg,
          );
        }
      }
      earliest = maxInstant(earliest, cand);
    }

    let start = earliest;
    let end: Instant;
    if (resolved.calendar === "calendar" || act.kind === "WAIT") {
      const afterPred =
        act.predecessors.length > 0
          ? placed.get(act.predecessors[0]!.activityId)?.end ?? start
          : start;
      end = calendarWaitEnd(afterPred, resolved.days);
      start = { date: addCalendarDays(afterPred.date, 1), half: 0 };
    } else {
      start = nextWorkingHalf(start, cfg);
      end = endInstantAfterWorkingDays(start, resolved.days, cfg);
    }

    placed.set(id, {
      start,
      end,
      durationDays: resolved.days,
      mode: resolved.mode,
      calendar: resolved.calendar,
    });
    earliestFinish.set(id, earliestStartUnits + resolved.days);
  }

  const activities: CalculatedActivity[] = order.map((id) => {
    const act = byId.get(id)!;
    const p = placed.get(id)!;
    return {
      id,
      name: act.name,
      kind: act.kind,
      durationDays: p.durationDays,
      durationMode: p.mode,
      calendar: p.calendar,
      startDate: p.start.date,
      endDate: p.end.date,
      predecessors: act.predecessors.map((d) => ({
        activityId: d.activityId,
        relation: d.relation,
        lagDays: d.lagDays ?? 0,
      })),
    };
  });

  const totalDurationDays = Math.max(0, ...[...earliestFinish.values()]);
  let endDate: string | null = null;
  for (const p of placed.values()) {
    if (!endDate || p.end.date > endDate) endDate = p.end.date;
  }

  return {
    ok: true,
    calculated: {
      activities,
      startDate: startIso,
      endDate,
      totalDurationDays,
      workActivities: activities.filter((a) => a.kind === "WORK").length,
      waitActivities: activities.filter((a) => a.kind === "WAIT").length,
      controlActivities: activities.filter((a) => a.kind === "CONTROL").length,
    },
  };
}
