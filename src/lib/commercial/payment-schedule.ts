/**
 * DF-1B — Échéancier de paiement structuré (contrat devis).
 * Montants NON stockés : calculés depuis totalTtc (basis TTC).
 * Types métier pour DF-3 / DF-5 — ne pas déduire du libellé.
 */
import { fromCents, roundMoney, toCents } from "@/lib/commercial/money";

export const PAYMENT_SCHEDULE_TYPES = [
  "DEPOSIT",
  "PROGRESS",
  "FINAL",
  "CUSTOM",
] as const;

export type PaymentScheduleLineType = (typeof PAYMENT_SCHEDULE_TYPES)[number];

export type PaymentScheduleLine = {
  type: PaymentScheduleLineType;
  percent: number;
  label: string;
  sortOrder: number;
};

export type PaymentSchedule = {
  basis: "TTC";
  lines: PaymentScheduleLine[];
};

export type PaymentScheduleValidation =
  | { ok: true; schedule: PaymentSchedule; sumPercent: number; level: "ok" | "warn" }
  | { ok: false; error: string; sumPercent: number; level: "error" | "empty" };

export type ComputedPaymentScheduleLine = PaymentScheduleLine & {
  amountTtc: number;
};

const TYPE_SET = new Set<string>(PAYMENT_SCHEDULE_TYPES);

export const PAYMENT_SCHEDULE_PRESETS: Record<
  "30_70" | "30_40_30" | "50_50",
  PaymentSchedule
> = {
  "30_70": {
    basis: "TTC",
    lines: [
      { type: "DEPOSIT", percent: 30, label: "Acompte à la commande", sortOrder: 0 },
      { type: "FINAL", percent: 70, label: "Solde", sortOrder: 1 },
    ],
  },
  "30_40_30": {
    basis: "TTC",
    lines: [
      { type: "DEPOSIT", percent: 30, label: "Acompte à la commande", sortOrder: 0 },
      {
        type: "PROGRESS",
        percent: 40,
        label: "Situation intermédiaire",
        sortOrder: 1,
      },
      { type: "FINAL", percent: 30, label: "Solde", sortOrder: 2 },
    ],
  },
  "50_50": {
    basis: "TTC",
    lines: [
      { type: "DEPOSIT", percent: 50, label: "Acompte à la commande", sortOrder: 0 },
      { type: "FINAL", percent: 50, label: "Solde", sortOrder: 1 },
    ],
  },
};

export function defaultLabelForType(type: PaymentScheduleLineType): string {
  switch (type) {
    case "DEPOSIT":
      return "Acompte à la commande";
    case "PROGRESS":
      return "Situation intermédiaire";
    case "FINAL":
      return "Solde";
    default:
      return "Échéance";
  }
}

/** Comparaison robuste de pourcentages (centièmes de %). */
function percentToBasisPoints(p: number): number {
  return Math.round(roundMoney(p, 4) * 100);
}

export function sumSchedulePercent(lines: PaymentScheduleLine[]): number {
  const bp = lines.reduce((acc, l) => acc + percentToBasisPoints(l.percent), 0);
  return roundMoney(bp / 100, 4);
}

export function parsePaymentSchedule(raw: unknown): PaymentSchedule | null {
  if (raw == null) return null;
  if (typeof raw !== "object" || Array.isArray(raw)) return null;
  const obj = raw as Record<string, unknown>;
  if (obj.basis !== "TTC") return null;
  if (!Array.isArray(obj.lines)) return null;
  const lines: PaymentScheduleLine[] = [];
  for (let i = 0; i < obj.lines.length; i++) {
    const row = obj.lines[i];
    if (!row || typeof row !== "object" || Array.isArray(row)) return null;
    const r = row as Record<string, unknown>;
    const type = String(r.type ?? "");
    if (!TYPE_SET.has(type)) return null;
    const percent = Number(r.percent);
    if (!Number.isFinite(percent) || percent < 0 || percent > 100) return null;
    const label = String(r.label ?? "").trim();
    if (!label) return null;
    const sortOrder =
      r.sortOrder != null && Number.isFinite(Number(r.sortOrder))
        ? Number(r.sortOrder)
        : i;
    lines.push({
      type: type as PaymentScheduleLineType,
      percent: roundMoney(percent, 4),
      label,
      sortOrder,
    });
  }
  lines.sort((a, b) => a.sortOrder - b.sortOrder);
  return { basis: "TTC", lines };
}

/**
 * Valide un échéancier pour sauvegarde brouillon ou finalisation.
 * - vide / null → empty (ok pour brouillon)
 * - sum < 100 → warn (ok brouillon, bloquant si finalizeStrict)
 * - sum > 100 → error (toujours bloquant)
 * - sum = 100 → ok
 */
export function validatePaymentSchedule(
  raw: unknown,
  opts?: { finalizeStrict?: boolean },
): PaymentScheduleValidation {
  if (raw == null) {
    return { ok: true, schedule: { basis: "TTC", lines: [] }, sumPercent: 0, level: "ok" };
  }
  const schedule = parsePaymentSchedule(raw);
  if (!schedule) {
    return {
      ok: false,
      error: "Échéancier invalide — vérifiez types, pourcentages et libellés",
      sumPercent: 0,
      level: "error",
    };
  }
  if (schedule.lines.length === 0) {
    return { ok: true, schedule, sumPercent: 0, level: "ok" };
  }

  for (const line of schedule.lines) {
    if (line.percent <= 0) {
      return {
        ok: false,
        error: `Pourcentage invalide pour « ${line.label} »`,
        sumPercent: sumSchedulePercent(schedule.lines),
        level: "error",
      };
    }
  }

  const sumPercent = sumSchedulePercent(schedule.lines);
  const sumBp = percentToBasisPoints(sumPercent);
  if (sumBp > 10000) {
    return {
      ok: false,
      error: `La somme des pourcentages (${sumPercent} %) dépasse 100 %`,
      sumPercent,
      level: "error",
    };
  }
  if (sumBp < 10000) {
    if (opts?.finalizeStrict) {
      return {
        ok: false,
        error: `Échéancier incomplet : ${sumPercent} % (doit totaliser 100 %)`,
        sumPercent,
        level: "error",
      };
    }
    return { ok: true, schedule, sumPercent, level: "warn" };
  }
  return { ok: true, schedule, sumPercent, level: "ok" };
}

/**
 * Répartit totalTtc en centimes (half-up) — dernier palier ajuste le reste
 * pour éviter 0,01 € d’écart.
 */
export function computePaymentScheduleAmounts(
  schedule: PaymentSchedule | null | undefined,
  totalTtc: number,
): ComputedPaymentScheduleLine[] {
  if (!schedule?.lines.length) return [];
  const lines = [...schedule.lines].sort((a, b) => a.sortOrder - b.sortOrder);
  const totalCents = toCents(totalTtc);
  const result: ComputedPaymentScheduleLine[] = [];
  let allocated = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isLast = i === lines.length - 1;
    let cents: number;
    if (isLast) {
      cents = Math.max(0, totalCents - allocated);
    } else {
      cents = Math.round((totalCents * percentToBasisPoints(line.percent)) / 10000);
      allocated += cents;
    }
    result.push({
      ...line,
      amountTtc: fromCents(cents),
    });
  }
  return result;
}

/** Initialise un échéancier depuis un ancien depositPercent (brouillons uniquement côté UI). */
export function scheduleFromDepositPercent(depositPercent: number): PaymentSchedule {
  const dep = roundMoney(Math.min(100, Math.max(0, depositPercent)), 4);
  const rest = roundMoney(100 - dep, 4);
  const lines: PaymentScheduleLine[] = [
    {
      type: "DEPOSIT",
      percent: dep,
      label: defaultLabelForType("DEPOSIT"),
      sortOrder: 0,
    },
  ];
  if (rest > 0) {
    lines.push({
      type: "FINAL",
      percent: rest,
      label: defaultLabelForType("FINAL"),
      sortOrder: 1,
    });
  }
  return { basis: "TTC", lines };
}

export function normalizeScheduleForStorage(
  schedule: PaymentSchedule | null,
): PaymentSchedule | null {
  if (!schedule || schedule.lines.length === 0) return null;
  return {
    basis: "TTC",
    lines: [...schedule.lines]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((l, i) => ({
        type: l.type,
        percent: roundMoney(l.percent, 4),
        label: l.label.trim(),
        sortOrder: i,
      })),
  };
}

export function paymentScheduleTypeLabel(type: PaymentScheduleLineType): string {
  switch (type) {
    case "DEPOSIT":
      return "Acompte";
    case "PROGRESS":
      return "Situation";
    case "FINAL":
      return "Solde";
    default:
      return "Personnalisé";
  }
}

/** Première ligne d’un type donné (ordre sortOrder) — pour DF-3 facturation. */
export function firstScheduleLineOfType(
  raw: unknown,
  type: PaymentScheduleLineType,
): PaymentScheduleLine | null {
  const schedule = parsePaymentSchedule(raw);
  if (!schedule?.lines.length) return null;
  const sorted = [...schedule.lines].sort((a, b) => a.sortOrder - b.sortOrder);
  return sorted.find((l) => l.type === type) ?? null;
}
