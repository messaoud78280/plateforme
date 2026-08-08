/**
 * Expansion simple des récurrences pour l’affichage calendrier (sans table d’occurrences).
 */

import { addDays, addMonths, addYears } from "@/lib/agenda/dates";

export type RecurringSeed = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  type: string;
  status: string;
  startAt: Date;
  endAt: Date;
  allDay: boolean;
  projectId: string | null;
  responsibleId: string | null;
  reminderMinutes: number | null;
  recurrence: string | null;
  project: { id: string; title: string; siteCity: string | null; siteAddress: string | null } | null;
  responsible: { id: string; name: string; email: string } | null;
  createdBy: { id: string; name: string; email: string };
  attendees: { id: string; status: string; user: { id: string; name: string; email: string } }[];
};

function shiftKeepingDuration(start: Date, end: Date, nextStart: Date) {
  const duration = end.getTime() - start.getTime();
  return { startAt: nextStart, endAt: new Date(nextStart.getTime() + duration) };
}

/** Génère les occurrences visibles dans [from, to] (max 60). */
export function expandRecurrenceForRange<T extends RecurringSeed>(
  event: T,
  from: Date,
  to: Date,
): Array<T & { id: string; occurrenceStart: string }> {
  const rule = (event.recurrence ?? "NONE").toUpperCase();
  if (!rule || rule === "NONE" || rule === "CUSTOM") {
    return [
      {
        ...event,
        id: event.id,
        occurrenceStart: event.startAt.toISOString(),
      },
    ];
  }

  const duration = event.endAt.getTime() - event.startAt.getTime();
  const results: Array<T & { id: string; occurrenceStart: string }> = [];
  let cursor = new Date(event.startAt);
  let guard = 0;

  // remonter jusqu’avant la fenêtre
  while (cursor > from && guard < 400) {
    guard += 1;
    const prev =
      rule === "DAILY"
        ? addDays(cursor, -1)
        : rule === "WEEKLY"
          ? addDays(cursor, -7)
          : rule === "MONTHLY"
            ? addMonths(cursor, -1)
            : rule === "YEARLY"
              ? addYears(cursor, -1)
              : null;
    if (!prev) break;
    cursor = prev;
  }

  guard = 0;
  while (cursor <= to && guard < 400) {
    guard += 1;
    const end = new Date(cursor.getTime() + duration);
    if (end >= from && cursor <= to) {
      const shifted = shiftKeepingDuration(event.startAt, event.endAt, cursor);
      const isOriginal = cursor.getTime() === event.startAt.getTime();
      results.push({
        ...event,
        ...shifted,
        id: isOriginal ? event.id : `${event.id}__${cursor.toISOString()}`,
        occurrenceStart: cursor.toISOString(),
        startAt: shifted.startAt,
        endAt: shifted.endAt,
      });
      if (results.length >= 60) break;
    }
    cursor =
      rule === "DAILY"
        ? addDays(cursor, 1)
        : rule === "WEEKLY"
          ? addDays(cursor, 7)
          : rule === "MONTHLY"
            ? addMonths(cursor, 1)
            : addYears(cursor, 1);
  }

  return results;
}
