/** Helpers dates agenda (semaine lundi → dimanche, locale fr). */

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function addMonths(d: Date, n: number): Date {
  const x = new Date(d);
  x.setMonth(x.getMonth() + n);
  return x;
}

export function addYears(d: Date, n: number): Date {
  const x = new Date(d);
  x.setFullYear(x.getFullYear() + n);
  return x;
}

/** Lundi de la semaine contenant `d`. */
export function startOfWeek(d: Date): Date {
  const x = startOfDay(d);
  const day = x.getDay(); // 0 dimanche
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(x, diff);
}

export function endOfWeek(d: Date): Date {
  return endOfDay(addDays(startOfWeek(d), 6));
}

export function startOfMonth(d: Date): Date {
  return startOfDay(new Date(d.getFullYear(), d.getMonth(), 1));
}

export function endOfMonth(d: Date): Date {
  return endOfDay(new Date(d.getFullYear(), d.getMonth() + 1, 0));
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

/** Numéro de semaine ISO (lundi → dimanche). */
export function isoWeekNumber(d: Date): number {
  const date = startOfDay(d);
  const day = (date.getDay() + 6) % 7; // 0 = lundi
  date.setDate(date.getDate() - day + 3);
  const firstThursday = new Date(date.getFullYear(), 0, 4);
  const firstDay = (firstThursday.getDay() + 6) % 7;
  firstThursday.setDate(firstThursday.getDate() - firstDay + 3);
  return 1 + Math.round((date.getTime() - firstThursday.getTime()) / (7 * 24 * 60 * 60 * 1000));
}

export function isoWeekLabel(d: Date): string {
  return `S${isoWeekNumber(d)}`;
}

export function isWeekend(d: Date): boolean {
  const day = d.getDay();
  return day === 0 || day === 6;
}

/** True si un événement chevauche la journée civile. */
export function eventOverlapsDay(
  startAt: string | Date,
  endAt: string | Date,
  day: Date,
): boolean {
  const s = startAt instanceof Date ? startAt : new Date(startAt);
  const e = endAt instanceof Date ? endAt : new Date(endAt);
  const dayStart = startOfDay(day);
  const dayEnd = endOfDay(day);
  return s <= dayEnd && e >= dayStart;
}

export function minutesSinceMidnight(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

export function formatMonthYear(d: Date): string {
  return d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

export function formatDayTitle(d: Date): { date: string; weekday: string } {
  return {
    date: d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }),
    weekday: d.toLocaleDateString("fr-FR", { weekday: "long" }),
  };
}

export function formatTime(d: Date): string {
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export function formatDayShort(d: Date): string {
  return d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" });
}

/** Grille mois : 6 semaines × 7 jours à partir du lundi avant le 1er. */
export function monthGrid(d: Date): Date[] {
  const first = startOfMonth(d);
  const gridStart = startOfWeek(first);
  return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
}

export function rangeForView(
  view: "day" | "week" | "month" | "year",
  cursor: Date,
): { from: Date; to: Date } {
  if (view === "day") return { from: startOfDay(cursor), to: endOfDay(cursor) };
  if (view === "week") return { from: startOfWeek(cursor), to: endOfWeek(cursor) };
  if (view === "month") {
    const days = monthGrid(cursor);
    return { from: startOfDay(days[0]!), to: endOfDay(days[41]!) };
  }
  return {
    from: startOfDay(new Date(cursor.getFullYear(), 0, 1)),
    to: endOfDay(new Date(cursor.getFullYear(), 11, 31)),
  };
}

/**
 * Horaires chantier BTP (AGENDA-V2A.2).
 * Pas de préférences entreprise en DB → défaut 07:00–19:00.
 * Plage étendue 06:00–22:00 accessible à la demande.
 */
export const WORK_HOUR_START = 7;
export const WORK_HOUR_END = 19;
export const EXTENDED_HOUR_START = 6;
export const EXTENDED_HOUR_END = 22;

/** Compat : alias de la plage travail (grille par défaut). */
export const HOUR_START = WORK_HOUR_START;
export const HOUR_END = WORK_HOUR_END;

/** Densité un peu plus haute pour une lecture opérationnelle. */
export const PX_PER_HOUR = 64;

export function hoursList(
  from: number = WORK_HOUR_START,
  to: number = WORK_HOUR_END,
): number[] {
  return Array.from({ length: to - from + 1 }, (_, i) => from + i);
}

/** True si un horaire sort de la plage travail affichée. */
export function isOutsideWorkHours(d: Date): boolean {
  const m = minutesSinceMidnight(d);
  return m < WORK_HOUR_START * 60 || m >= (WORK_HOUR_END + 1) * 60;
}
