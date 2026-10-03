/**
 * Layout Gantt V1 + indicateurs planning (purs, sans I/O).
 * Ne recalcule pas le moteur 3A/3B — positionne les dates déjà persistées.
 */

import { addCalendarDays, isoWeekday, parseIsoDate, toIsoDate } from "./calendar";

export type GanttZoom = "day" | "week" | "3weeks" | "month";

export type GanttTaskInput = {
  id: string;
  stepCode: string;
  startDate: string | null;
  endDate: string | null;
  startHalf: number;
  endHalf: number;
  durationDays: number;
  durationCalendar: string;
  kind: string;
  includeInBase: boolean;
  holdPoint: boolean;
  conditional: boolean;
};

export type GanttDayColumn = {
  iso: string;
  label: string;
  weekdayLabel: string;
  isWeekend: boolean;
  isHoliday: boolean;
};

export type GanttBar = {
  taskId: string;
  stepCode: string;
  leftPx: number;
  widthPx: number;
  startHalf: 0 | 1;
  endHalf: 0 | 1;
};

export type PlanIndicators = {
  /** A — somme des durées work/control du chemin de base (charge cumulée). */
  workloadDays: number;
  /** B — durée ouvrée du planning (span début → fin de base). */
  workingSpanDays: number | null;
  /** C — délai calendaire inclusif démarrage → fin de base. */
  calendarSpanDays: number | null;
  /** D — somme des attentes / délais techniques (jours calendaires déclarés). */
  waitDays: number;
};

const DAY_WIDTH: Record<GanttZoom, number> = {
  day: 56,
  week: 28,
  "3weeks": 20,
  month: 12,
};

/** Semaine ISO (lundi → dimanche) — affichage axe uniquement. */
export function isoWeekNumber(iso: string): number {
  const d = new Date(`${iso.slice(0, 10)}T12:00:00Z`);
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
}

export type GanttWeekBand = {
  week: number;
  year: number;
  startIso: string;
  endIso: string;
  dayCount: number;
};

export function groupDaysByIsoWeek(
  days: Array<{ iso: string }>,
): GanttWeekBand[] {
  const bands: GanttWeekBand[] = [];
  for (const day of days) {
    const week = isoWeekNumber(day.iso);
    const year = Number(day.iso.slice(0, 4));
    const last = bands[bands.length - 1];
    if (last && last.week === week && last.year === year) {
      last.endIso = day.iso;
      last.dayCount += 1;
    } else {
      bands.push({
        week,
        year,
        startIso: day.iso,
        endIso: day.iso,
        dayCount: 1,
      });
    }
  }
  return bands;
}

export function dayWidthForZoom(zoom: GanttZoom): number {
  return DAY_WIDTH[zoom];
}

export function enumerateCalendarDays(
  fromIso: string,
  toIso: string,
  holidaySet?: Set<string>,
): GanttDayColumn[] {
  const out: GanttDayColumn[] = [];
  let cur = fromIso;
  const end = toIso;
  const labels = ["lu", "ma", "me", "je", "ve", "sa", "di"];
  for (let i = 0; i < 400; i++) {
    const wd = isoWeekday(cur);
    const isWeekend = wd >= 6;
    out.push({
      iso: cur,
      label: `${cur.slice(8, 10)}/${cur.slice(5, 7)}`,
      weekdayLabel: labels[wd - 1] ?? "",
      isWeekend,
      isHoliday: holidaySet?.has(cur) ?? false,
    });
    if (cur === end) break;
    cur = addCalendarDays(cur, 1);
  }
  return out;
}

/** Index demi-journée sur l'axe calendaire (0 = matin du 1er jour). */
export function halfIndexOnAxis(
  axisStartIso: string,
  dateIso: string,
  half: number,
): number {
  const start = parseIsoDate(axisStartIso).getTime();
  const d = parseIsoDate(dateIso).getTime();
  const dayIndex = Math.round((d - start) / 86_400_000);
  const h = half >= 1 ? 1 : 0;
  return dayIndex * 2 + h;
}

export function barGeometry(
  axisStartIso: string,
  task: Pick<GanttTaskInput, "startDate" | "endDate" | "startHalf" | "endHalf">,
  dayWidth: number,
): { leftPx: number; widthPx: number; startHalf: 0 | 1; endHalf: 0 | 1 } | null {
  if (!task.startDate || !task.endDate) return null;
  const sh = (task.startHalf >= 1 ? 1 : 0) as 0 | 1;
  const eh = (task.endHalf >= 1 ? 1 : 0) as 0 | 1;
  const startIdx = halfIndexOnAxis(axisStartIso, task.startDate, sh);
  const endIdx = halfIndexOnAxis(axisStartIso, task.endDate, eh);
  const halfW = dayWidth / 2;
  const leftPx = startIdx * halfW;
  const widthPx = Math.max(halfW, (endIdx - startIdx + 1) * halfW);
  return { leftPx, widthPx, startHalf: sh, endHalf: eh };
}

export function buildGanttBars(
  tasks: GanttTaskInput[],
  axisStartIso: string,
  dayWidth: number,
): GanttBar[] {
  const bars: GanttBar[] = [];
  for (const t of tasks) {
    const g = barGeometry(axisStartIso, t, dayWidth);
    if (!g) continue;
    bars.push({
      taskId: t.id,
      stepCode: t.stepCode,
      leftPx: g.leftPx,
      widthPx: g.widthPx,
      startHalf: g.startHalf,
      endHalf: g.endHalf,
    });
  }
  return bars;
}

export function calendarDaysInclusive(fromIso: string, toIso: string): number {
  const a = parseIsoDate(fromIso).getTime();
  const b = parseIsoDate(toIso).getTime();
  return Math.floor((b - a) / 86_400_000) + 1;
}

export function computePlanIndicators(input: {
  tasks: GanttTaskInput[];
  startDate: string | null;
  endDateBase: string | null;
  baseDurationWorkingDays: number | null;
}): PlanIndicators {
  const base = input.tasks.filter((t) => t.includeInBase);
  const workloadDays = round1(
    base
      .filter((t) => t.kind === "work" || t.kind === "control")
      .reduce((s, t) => s + t.durationDays, 0),
  );
  const waitDays = round1(
    base.filter((t) => t.kind === "wait").reduce((s, t) => s + t.durationDays, 0),
  );
  const calendarSpanDays =
    input.startDate && input.endDateBase
      ? calendarDaysInclusive(input.startDate, input.endDateBase)
      : null;
  return {
    workloadDays,
    workingSpanDays: input.baseDurationWorkingDays,
    calendarSpanDays,
    waitDays,
  };
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

export function halfLabel(half: number): string {
  return half >= 1 ? "Après-midi" : "Matin";
}

export function formatAxisRangeLabel(fromIso: string, toIso: string): string {
  return `${toIsoDate(parseIsoDate(fromIso))} → ${toIsoDate(parseIsoDate(toIso))}`;
}

export type HoldPointStatus = "A_CONTROLER" | "VALIDE" | "RESERVES";

export function normalizeHoldPointStatus(
  raw: string | null | undefined,
  holdPoint: boolean,
): HoldPointStatus | null {
  if (!holdPoint) return null;
  if (raw === "VALIDE" || raw === "RESERVES" || raw === "A_CONTROLER") return raw;
  return "A_CONTROLER";
}

export function holdPointBlocksSuccessor(
  holdPoint: boolean,
  status: HoldPointStatus | null,
): boolean {
  if (!holdPoint) return false;
  return status !== "VALIDE";
}
