/**
 * Parse rapide FR pour création agenda (ex. "réunion demain 10h Victor Hugo").
 */

export type ParsedQuickAgenda = {
  title: string;
  startAt: Date;
  endAt: Date;
  allDay: boolean;
};

function atLocal(base: Date, hours: number, minutes = 0): Date {
  const d = new Date(base);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

export function parseFrenchAgendaQuick(input: string, now = new Date()): ParsedQuickAgenda | null {
  const raw = input.trim();
  if (!raw) return null;

  const lower = raw.toLowerCase();
  let day = new Date(now);
  day.setHours(0, 0, 0, 0);

  if (/\baprès[- ]?demain\b/.test(lower)) {
    day.setDate(day.getDate() + 2);
  } else if (/\bdemain\b/.test(lower)) {
    day.setDate(day.getDate() + 1);
  } else if (/\baujourd['’]?hui\b/.test(lower)) {
    /* today */
  }

  const timeMatch = lower.match(/\b(\d{1,2})\s*[h:]\s*(\d{2})?\b/);
  let hours = 9;
  let minutes = 0;
  let allDay = true;
  if (timeMatch) {
    hours = Math.min(23, Number(timeMatch[1]));
    minutes = timeMatch[2] ? Math.min(59, Number(timeMatch[2])) : 0;
    allDay = false;
  }

  const title = raw
    .replace(/\b(après[- ]?demain|demain|aujourd['’]?hui)\b/gi, "")
    .replace(/\b\d{1,2}\s*[h:]\s*\d{0,2}\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim() || "Nouvel événement";

  const startAt = allDay ? atLocal(day, 9, 0) : atLocal(day, hours, minutes);
  const endAt = new Date(startAt.getTime() + (allDay ? 60 : 60) * 60 * 1000);

  return { title, startAt, endAt, allDay };
}
