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

export const HOUR_START = 6;
export const HOUR_END = 22;
export const PX_PER_HOUR = 56;

export function hoursList(): number[] {
  return Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => HOUR_START + i);
}
