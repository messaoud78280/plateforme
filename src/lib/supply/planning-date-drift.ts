/**
 * Planning → approvisionnement : écart de date, lecture seule.
 * Ne modifie ni commande, ni offre, ni prix, ni quantité.
 *
 * Seul le début des tâches liées est comparé à la date du besoin.
 * Une fin de tâche, une durée ou un avancement sans nouveau début
 * ne crée pas d’alerte.
 */

export type PlanningSupplyDateGap = {
  id: string;
  label: string;
  detail: string;
  neededAt: string;
  taskId: string;
  taskName: string;
  taskStart: string;
  deltaDays: number;
};

const MONTHS = [
  "janv.",
  "févr.",
  "mars",
  "avr.",
  "mai",
  "juin",
  "juil.",
  "août",
  "sept.",
  "oct.",
  "nov.",
  "déc.",
];

export function utcDay(value: Date | string | null | undefined): string | null {
  if (value == null || value === "") return null;
  if (typeof value === "string") {
    const day = /^(\d{4}-\d{2}-\d{2})/.exec(value.trim());
    if (day) return day[1]!;
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function dayNumber(iso: string): number {
  const [year, month, day] = iso.split("-").map(Number);
  return Math.round(Date.UTC(year!, (month ?? 1) - 1, day ?? 1) / 86_400_000);
}

function formatDay(iso: string): string {
  const [, month, day] = iso.split("-");
  const index = Number(month) - 1;
  const label = MONTHS[index] ?? month;
  return `${Number(day)} ${label}`;
}

export function describePlanningDateGap(input: {
  neededAt: string;
  taskName: string;
  taskStart: string;
  deltaDays: number;
}): string {
  const sign =
    input.deltaDays > 0 ? `+${input.deltaDays}` : String(input.deltaDays);
  return `Besoin le ${formatDay(input.neededAt)}, tâche « ${input.taskName} » le ${formatDay(input.taskStart)} (${sign} j)`;
}

export function scheduleTaskIdList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

/**
 * Besoins liés à des tâches dont le début n’est plus la date du besoin.
 * Besoin sans date, tâche sans début, besoin annulé ou non lié : pas d’alerte.
 */
export function evaluatePlanningSupplyDateDrift(input: {
  needs: Array<{
    id: string;
    label: string;
    status: string;
    neededAt: Date | string | null;
    scheduleTaskIds: readonly string[];
  }>;
  tasks: Array<{
    id: string;
    name: string;
    startDate: Date | string | null;
  }>;
}): PlanningSupplyDateGap[] {
  const byId = new Map(input.tasks.map((task) => [task.id, task]));
  const gaps: PlanningSupplyDateGap[] = [];

  for (const need of input.needs) {
    if (need.status === "CANCELLED") continue;
    if (need.scheduleTaskIds.length === 0) continue;
    const neededAt = utcDay(need.neededAt);
    if (!neededAt) continue;

    let earliest: { id: string; name: string; start: string } | null = null;
    for (const taskId of need.scheduleTaskIds) {
      const task = byId.get(taskId);
      const start = utcDay(task?.startDate);
      if (!task || !start) continue;
      if (!earliest || start < earliest.start || (start === earliest.start && task.id < earliest.id)) {
        earliest = { id: task.id, name: task.name.trim() || "Tâche", start };
      }
    }
    if (!earliest || earliest.start === neededAt) continue;

    const deltaDays = dayNumber(earliest.start) - dayNumber(neededAt);
    if (deltaDays === 0) continue;
    gaps.push({
      id: need.id,
      label: need.label.trim() || "Besoin",
      neededAt,
      taskId: earliest.id,
      taskName: earliest.name,
      taskStart: earliest.start,
      deltaDays,
      detail: describePlanningDateGap({
        neededAt,
        taskName: earliest.name,
        taskStart: earliest.start,
        deltaDays,
      }),
    });
  }

  return gaps;
}
