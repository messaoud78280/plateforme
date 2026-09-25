/**
 * Calendrier ouvrés / calendaires + jours fériés FR (calcul Pâques).
 */

export type DayHalf = 0 | 1; // 0 = matin, 1 = après-midi

export type Instant = {
  /** Date civile YYYY-MM-DD */
  date: string;
  half: DayHalf;
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function toIsoDate(d: Date): string {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

export function parseIsoDate(iso: string): Date {
  const [y, m, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, day));
}

export function addCalendarDays(iso: string, days: number): string {
  const d = parseIsoDate(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return toIsoDate(d);
}

/** 1 = lundi … 7 = dimanche (ISO). */
export function isoWeekday(iso: string): number {
  const d = parseIsoDate(iso);
  const js = d.getUTCDay(); // 0=dim
  return js === 0 ? 7 : js;
}

/** Algorithme de Meeus/Jones/Butcher — Pâques occidentale. */
export function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

export function frenchMetropoleHolidays(year: number): Set<string> {
  const easter = easterSunday(year);
  const add = (base: Date, offset: number) => {
    const x = new Date(base);
    x.setUTCDate(x.getUTCDate() + offset);
    return toIsoDate(x);
  };
  const fixed = [
    `${year}-01-01`,
    `${year}-05-01`,
    `${year}-05-08`,
    `${year}-07-14`,
    `${year}-08-15`,
    `${year}-11-01`,
    `${year}-11-11`,
    `${year}-12-25`,
  ];
  return new Set([
    ...fixed,
    add(easter, 1), // lundi de Pâques
    add(easter, 39), // Ascension
    add(easter, 50), // lundi de Pentecôte
  ]);
}

export type CalendarConfig = {
  workingDays: number[];
  holidaySet: Set<string>;
};

export function buildHolidaySet(
  holidays: "FR_METROPOLE" | string[] | null | undefined,
  years: number[],
): Set<string> {
  const set = new Set<string>();
  if (holidays === "FR_METROPOLE") {
    for (const y of years) {
      for (const d of frenchMetropoleHolidays(y)) set.add(d);
    }
  } else if (Array.isArray(holidays)) {
    for (const d of holidays) set.add(d);
  }
  return set;
}

export function isWorkingDay(iso: string, cfg: CalendarConfig): boolean {
  if (cfg.holidaySet.has(iso)) return false;
  return cfg.workingDays.includes(isoWeekday(iso));
}

/** Avance d'une demi-journée ouvrée (ou reste sur le même créneau si déjà ouvré). */
export function nextWorkingHalf(from: Instant, cfg: CalendarConfig): Instant {
  let date = from.date;
  let half = from.half;
  // Si on est déjà sur un jour ouvré, on reste.
  if (isWorkingDay(date, cfg)) return { date, half };
  // Sinon avancer jusqu'au prochain jour ouvré, matin.
  for (let i = 0; i < 370; i++) {
    date = addCalendarDays(date, 1);
    if (isWorkingDay(date, cfg)) return { date, half: 0 };
  }
  return { date, half: 0 };
}

/** Ajoute `halfDays` demi-journées ouvrées à partir de `start` (début inclusif). */
export function addWorkingHalfDays(start: Instant, halfDays: number, cfg: CalendarConfig): Instant {
  if (halfDays <= 0) return nextWorkingHalf(start, cfg);
  let cur = nextWorkingHalf(start, cfg);
  let remaining = halfDays;
  while (remaining > 0) {
    remaining -= 1;
    if (remaining <= 0) break;
    if (cur.half === 0) {
      cur = { date: cur.date, half: 1 };
    } else {
      let date = addCalendarDays(cur.date, 1);
      while (!isWorkingDay(date, cfg)) date = addCalendarDays(date, 1);
      cur = { date, half: 0 };
    }
  }
  return cur;
}

/**
 * Fin exclusive → dernière demi-journée consommée.
 * Ex. 2 j ouvrés depuis lun matin → fin jeu soir = demi-journée d'indice +3.
 */
export function endInstantAfterWorkingDays(
  start: Instant,
  durationDays: number,
  cfg: CalendarConfig,
): Instant {
  const halves = Math.round(durationDays * 2);
  if (halves <= 0) return nextWorkingHalf(start, cfg);
  return addWorkingHalfDays(start, halves, cfg);
}

/** Instant juste après la fin d'une tâche (début possible suivant). */
export function instantAfterEnd(end: Instant, cfg: CalendarConfig): Instant {
  if (end.half === 0) {
    return nextWorkingHalf({ date: end.date, half: 1 }, cfg);
  }
  let date = addCalendarDays(end.date, 1);
  while (!isWorkingDay(date, cfg)) date = addCalendarDays(date, 1);
  return { date, half: 0 };
}

/** Alignement début de journée ouvrée. */
export function alignDayStart(inst: Instant, cfg: CalendarConfig): Instant {
  const base = nextWorkingHalf(inst, cfg);
  if (base.half === 0) return base;
  let date = addCalendarDays(base.date, 1);
  while (!isWorkingDay(date, cfg)) date = addCalendarDays(date, 1);
  return { date, half: 0 };
}

/**
 * Attente calendaire : démarre juste après `afterEnd` (calendaire, pas ouvré),
 * dure `days` jours calendaires, se termine à la fin du dernier jour.
 */
export function calendarWaitEnd(afterEnd: Instant, days: number): Instant {
  // La cure commence le calendrier civil suivant la fin de tâche.
  const startCal = addCalendarDays(afterEnd.date, 1);
  const endCal = addCalendarDays(startCal, Math.max(0, Math.ceil(days) - 1));
  return { date: endCal, half: 1 };
}

/** Compte les demi-journées ouvrées de start à end inclus. */
export function countWorkingDaysInclusive(start: Instant, end: Instant, cfg: CalendarConfig): number {
  let cur = nextWorkingHalf(start, cfg);
  const endN = nextWorkingHalf(end, cfg);
  let halves = 0;
  for (let i = 0; i < 2000; i++) {
    halves += 1;
    if (cur.date === endN.date && cur.half === endN.half) break;
    cur = instantAfterEnd(cur, cfg);
    // instantAfterEnd moves past cur; we need to walk half by half
  }
  // Recalcul plus sûr : marche demi par demi
  cur = nextWorkingHalf(start, cfg);
  halves = 0;
  for (let i = 0; i < 2000; i++) {
    halves += 1;
    if (cur.date > endN.date || (cur.date === endN.date && cur.half > endN.half)) {
      halves -= 1;
      break;
    }
    if (cur.date === endN.date && cur.half === endN.half) break;
    if (cur.half === 0) cur = { date: cur.date, half: 1 };
    else {
      let date = addCalendarDays(cur.date, 1);
      while (!isWorkingDay(date, cfg)) date = addCalendarDays(date, 1);
      cur = { date, half: 0 };
    }
  }
  return halves / 2;
}

export function formatInstant(inst: Instant): string {
  return `${inst.date}${inst.half === 0 ? "T matin" : "T après-midi"}`;
}
