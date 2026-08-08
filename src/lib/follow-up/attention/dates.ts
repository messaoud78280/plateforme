/** Convention projet : jour calendaire en heure locale (setHours 0), pas UTC minuit. */

export function startOfLocalDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function toDate(value: Date | string | null | undefined): Date | null {
  if (value == null) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Jours calendaires de `from` vers `to` (négatif si to < from). */
export function calendarDaysBetween(from: Date, to: Date): number {
  return Math.round(
    (startOfLocalDay(to).getTime() - startOfLocalDay(from).getTime()) / 86400000,
  );
}

export function hoursBetween(from: Date, to: Date): number {
  return (to.getTime() - from.getTime()) / (1000 * 60 * 60);
}

export function formatDaysFr(days: number): string {
  if (days <= 0) return "aujourd’hui";
  if (days === 1) return "1 jour";
  return `${days} jours`;
}
