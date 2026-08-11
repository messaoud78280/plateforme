/**
 * PLANNING-V2C — charge planifiée (AgendaEvent uniquement, pas de capacité fictive).
 */
import type { AgendaEventDTO } from "@/components/agenda/agenda-types";
import { eventsForResourceOnDay } from "@/lib/planning/board";

export type PlanningWorkload = {
  assignments: number;
  /** Minutes planifiées si calculables (événements non allDay avec durée). */
  minutes: number | null;
  projectIds: string[];
};

export function formatPlanningDuration(minutes: number | null): string | null {
  if (minutes == null || minutes <= 0) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${String(m).padStart(2, "0")}`;
}

function eventMinutes(e: AgendaEventDTO): number | null {
  if (e.allDay) return null;
  const s = new Date(e.startAt).getTime();
  const en = new Date(e.endAt).getTime();
  if (!Number.isFinite(s) || !Number.isFinite(en) || en <= s) return null;
  return Math.round((en - s) / 60000);
}

/** Charge d'un collaborateur sur une liste de jours (période visible). */
export function computeResourceWorkload(
  events: AgendaEventDTO[],
  resourceId: string,
  days: Date[],
): PlanningWorkload {
  const seen = new Set<string>();
  let assignments = 0;
  let minutes = 0;
  let hasDuration = false;
  const projectIds = new Set<string>();

  for (const day of days) {
    for (const e of eventsForResourceOnDay(events, resourceId, day)) {
      if (seen.has(e.id)) continue;
      seen.add(e.id);
      assignments += 1;
      if (e.projectId) projectIds.add(e.projectId);
      const m = eventMinutes(e);
      if (m != null) {
        minutes += m;
        hasDuration = true;
      }
    }
  }

  return {
    assignments,
    minutes: hasDuration ? minutes : null,
    projectIds: Array.from(projectIds),
  };
}

export function nextAssignmentForResource(
  events: AgendaEventDTO[],
  resourceId: string,
  after: Date,
): AgendaEventDTO | null {
  const t = after.getTime();
  const list = events
    .filter((e) => {
      if (e.responsibleId !== resourceId) return false;
      return new Date(e.startAt).getTime() >= t;
    })
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  return list[0] ?? null;
}
