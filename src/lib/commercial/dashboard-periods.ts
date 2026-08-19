/**
 * Périodes du cockpit Devis & Facturation.
 * Comparaison = période sélectionnée vs période précédente équivalente.
 */

export type DashboardPeriodPreset =
  | "this_month"
  | "last_month"
  | "quarter"
  | "year"
  | "last_12m"
  | "custom";

export type DashboardGranularity = "day" | "week" | "month";

export type DashboardPeriod = {
  preset: DashboardPeriodPreset;
  from: Date;
  toExclusive: Date;
  previousFrom: Date;
  previousToExclusive: Date;
  granularity: DashboardGranularity;
  label: string;
  previousLabel: string;
};

const PRESETS: DashboardPeriodPreset[] = [
  "this_month",
  "last_month",
  "quarter",
  "year",
  "last_12m",
  "custom",
];

export const DASHBOARD_PERIOD_OPTIONS: Array<{
  value: DashboardPeriodPreset;
  label: string;
}> = [
  { value: "this_month", label: "Ce mois" },
  { value: "last_month", label: "Mois précédent" },
  { value: "quarter", label: "Trimestre" },
  { value: "year", label: "Année" },
  { value: "last_12m", label: "12 derniers mois" },
  { value: "custom", label: "Personnalisé" },
];

export function isDashboardPeriodPreset(
  value: string | null | undefined,
): value is DashboardPeriodPreset {
  return Boolean(value && PRESETS.includes(value as DashboardPeriodPreset));
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

function parseIsoDate(raw: string | null | undefined): Date | null {
  if (!raw) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw.trim());
  if (!m) return null;
  const dt = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (Number.isNaN(dt.getTime())) return null;
  return startOfDay(dt);
}

function monthLabel(d: Date): string {
  return d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

function rangeLabel(from: Date, toExclusive: Date): string {
  const last = new Date(toExclusive.getTime() - 1);
  return `${from.toLocaleDateString("fr-FR")} – ${last.toLocaleDateString("fr-FR")}`;
}

export function granularityForRange(
  from: Date,
  toExclusive: Date,
): DashboardGranularity {
  const days = rangeDays(from, toExclusive);
  if (days <= 45) return "day";
  if (days <= 180) return "week";
  return "month";
}

function rangeDays(from: Date, toExclusive: Date): number {
  return Math.max(
    1,
    Math.round((toExclusive.getTime() - from.getTime()) / 86_400_000),
  );
}

/**
 * Granularité selon la durée et la densité réelle d’activité.
 * Évite un graphique quotidien vide avec un seul pic.
 */
export function adaptiveGranularity(
  from: Date,
  toExclusive: Date,
  activityDates: Date[],
): DashboardGranularity {
  const days = rangeDays(from, toExclusive);
  const uniqueDays = new Set(
    activityDates
      .filter((d) => !Number.isNaN(d.getTime()))
      .map((d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`),
  ).size;

  if (days <= 14) return "day";
  if (days <= 45) {
    if (uniqueDays > 0 && uniqueDays <= 5 && days >= 20) return "week";
    return "day";
  }
  if (days <= 130) {
    if (uniqueDays <= 8) return "month";
    return "week";
  }
  return "month";
}

function previousEquivalent(
  preset: DashboardPeriodPreset,
  from: Date,
  toExclusive: Date,
): { previousFrom: Date; previousToExclusive: Date; previousLabel: string } {
  if (preset === "this_month" || preset === "last_month") {
    const previousFrom = addMonths(from, -1);
    const previousToExclusive = from;
    return {
      previousFrom,
      previousToExclusive,
      previousLabel: monthLabel(previousFrom),
    };
  }
  if (preset === "quarter") {
    const previousFrom = addMonths(from, -3);
    return {
      previousFrom,
      previousToExclusive: from,
      previousLabel: `T${Math.floor(previousFrom.getMonth() / 3) + 1} ${previousFrom.getFullYear()}`,
    };
  }
  if (preset === "year") {
    const previousFrom = new Date(from.getFullYear() - 1, 0, 1);
    return {
      previousFrom,
      previousToExclusive: from,
      previousLabel: String(from.getFullYear() - 1),
    };
  }
  const duration = toExclusive.getTime() - from.getTime();
  const previousToExclusive = from;
  const previousFrom = new Date(from.getTime() - duration);
  return {
    previousFrom,
    previousToExclusive,
    previousLabel: rangeLabel(previousFrom, previousToExclusive),
  };
}

export function resolveDashboardPeriod(input: {
  preset?: string | null;
  from?: string | null;
  to?: string | null;
  now?: Date;
}): DashboardPeriod {
  const now = input.now ?? new Date();
  const preset = isDashboardPeriodPreset(input.preset)
    ? input.preset
    : "this_month";

  let from: Date;
  let toExclusive: Date;
  let label: string;

  if (preset === "this_month") {
    from = startOfMonth(now);
    toExclusive = addMonths(from, 1);
    label = monthLabel(from);
  } else if (preset === "last_month") {
    toExclusive = startOfMonth(now);
    from = addMonths(toExclusive, -1);
    label = monthLabel(from);
  } else if (preset === "quarter") {
    const q = Math.floor(now.getMonth() / 3);
    from = new Date(now.getFullYear(), q * 3, 1);
    toExclusive = addMonths(from, 3);
    label = `T${q + 1} ${now.getFullYear()}`;
  } else if (preset === "year") {
    from = new Date(now.getFullYear(), 0, 1);
    toExclusive = new Date(now.getFullYear() + 1, 0, 1);
    label = String(now.getFullYear());
  } else if (preset === "last_12m") {
    toExclusive = addMonths(startOfMonth(now), 1);
    from = addMonths(toExclusive, -12);
    label = "12 derniers mois";
  } else {
    const parsedFrom = parseIsoDate(input.from);
    const parsedTo = parseIsoDate(input.to);
    if (parsedFrom && parsedTo && parsedTo >= parsedFrom) {
      from = parsedFrom;
      toExclusive = new Date(
        parsedTo.getFullYear(),
        parsedTo.getMonth(),
        parsedTo.getDate() + 1,
      );
      label = rangeLabel(from, toExclusive);
    } else {
      from = startOfMonth(now);
      toExclusive = addMonths(from, 1);
      label = monthLabel(from);
    }
  }

  const prev = previousEquivalent(preset, from, toExclusive);
  return {
    preset,
    from,
    toExclusive,
    previousFrom: prev.previousFrom,
    previousToExclusive: prev.previousToExclusive,
    granularity: granularityForRange(from, toExclusive),
    label,
    previousLabel: prev.previousLabel,
  };
}

export type TrendChange = {
  pct: number | null;
  kind: "up" | "down" | "flat" | "new" | "na";
  label: string;
};

/** Évolution % — jamais de division par zéro, jamais de % absurde. */
export function trendChange(current: number, previous: number): TrendChange {
  const cur = Number.isFinite(current) ? current : 0;
  const prev = Number.isFinite(previous) ? previous : 0;
  if (prev === 0 && cur === 0) {
    return { pct: null, kind: "na", label: "—" };
  }
  if (prev === 0 && cur !== 0) {
    return { pct: null, kind: "new", label: "Première période" };
  }
  const pct = ((cur - prev) / Math.abs(prev)) * 100;
  if (!Number.isFinite(pct)) {
    return { pct: null, kind: "na", label: "—" };
  }
  if (Math.abs(pct) < 0.05) {
    return { pct: 0, kind: "flat", label: "0 %" };
  }
  const rounded = Math.round(pct * 10) / 10;
  const sign = rounded > 0 ? "+" : "";
  return {
    pct: rounded,
    kind: rounded > 0 ? "up" : "down",
    label: `${sign}${rounded.toLocaleString("fr-FR", {
      minimumFractionDigits: Math.abs(rounded) >= 10 ? 0 : 1,
      maximumFractionDigits: 1,
    })} %`,
  };
}

export function bucketKey(date: Date, granularity: DashboardGranularity): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  if (granularity === "day") return `${y}-${m}-${d}`;
  if (granularity === "month") return `${y}-${m}`;
  const start = startOfDay(date);
  const weekStart = new Date(start);
  const day = (start.getDay() + 6) % 7;
  weekStart.setDate(start.getDate() - day);
  const wy = weekStart.getFullYear();
  const wm = String(weekStart.getMonth() + 1).padStart(2, "0");
  const wd = String(weekStart.getDate()).padStart(2, "0");
  return `${wy}-${wm}-${wd}`;
}

export function bucketLabel(key: string, granularity: DashboardGranularity): string {
  if (granularity === "month") {
    const [y, m] = key.split("-");
    const dt = new Date(Number(y), Number(m) - 1, 1);
    return dt.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
  }
  const [y, m, d] = key.split("-");
  const dt = new Date(Number(y), Number(m) - 1, Number(d));
  if (granularity === "week") {
    return `sem. ${dt.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`;
  }
  return dt.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export function enumerateBuckets(
  from: Date,
  toExclusive: Date,
  granularity: DashboardGranularity,
): string[] {
  const keys: string[] = [];
  const seen = new Set<string>();
  const cursor = new Date(from);
  while (cursor < toExclusive) {
    const key = bucketKey(cursor, granularity);
    if (!seen.has(key)) {
      seen.add(key);
      keys.push(key);
    }
    if (granularity === "day") cursor.setDate(cursor.getDate() + 1);
    else if (granularity === "week") cursor.setDate(cursor.getDate() + 7);
    else cursor.setMonth(cursor.getMonth() + 1);
  }
  return keys;
}
