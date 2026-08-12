/**
 * DF-6A — Calculs purs retenue de garantie (pas de Prisma).
 */
import { roundMoney } from "@/lib/commercial/money";

export type RetentionComputeInput = {
  periodSellHt: number;
  periodVat: number;
  periodTtc: number;
  ratePercent: number;
  marketSellHt: number;
  previousRetentionHt: number;
};

export type RetentionComputeResult = {
  ratePercent: number;
  retentionCapHt: number;
  retentionPreviousHt: number;
  retentionPeriodHt: number;
  retentionCumulativeHt: number;
  retentionRemainingCapHt: number;
  netPeriodSellHt: number;
  netPeriodVat: number;
  netPeriodTtc: number;
  retentionPeriodVat: number;
  retentionPeriodTtc: number;
};

/** Plafond RG = marché HT × taux. */
export function retentionCapFromMarket(
  marketSellHt: number,
  ratePercent: number,
): number {
  const rate = Math.min(100, Math.max(0, Number(ratePercent) || 0));
  return roundMoney((Number(marketSellHt) || 0) * (rate / 100), 2);
}

/**
 * RG période = min(période × taux, plafond − déjà retenu).
 * Net = période − RG (TVA proportionnelle).
 */
export function computeRetentionForPeriod(
  input: RetentionComputeInput,
): RetentionComputeResult {
  const rate = roundMoney(Math.min(100, Math.max(0, Number(input.ratePercent) || 0)), 4);
  const periodHt = roundMoney(Number(input.periodSellHt) || 0, 2);
  const periodVat = roundMoney(Number(input.periodVat) || 0, 2);
  const periodTtc = roundMoney(Number(input.periodTtc) || 0, 2);
  const previous = roundMoney(Math.max(0, Number(input.previousRetentionHt) || 0), 2);
  const cap = retentionCapFromMarket(input.marketSellHt, rate);

  let retentionPeriodHt = 0;
  if (rate > 0 && periodHt > 0) {
    const raw = roundMoney(periodHt * (rate / 100), 2);
    const room = roundMoney(Math.max(0, cap - previous), 2);
    retentionPeriodHt = roundMoney(Math.min(raw, room), 2);
  }

  const retentionCumulativeHt = roundMoney(previous + retentionPeriodHt, 2);
  const retentionRemainingCapHt = roundMoney(Math.max(0, cap - retentionCumulativeHt), 2);

  const netPeriodSellHt = roundMoney(Math.max(0, periodHt - retentionPeriodHt), 2);
  // TVA proportionnelle au HT net (évite double logique TVA)
  let netPeriodVat = 0;
  let retentionPeriodVat = 0;
  if (periodHt > 0) {
    const ratio = netPeriodSellHt / periodHt;
    netPeriodVat = roundMoney(periodVat * ratio, 2);
    retentionPeriodVat = roundMoney(periodVat - netPeriodVat, 2);
  }
  const netPeriodTtc = roundMoney(netPeriodSellHt + netPeriodVat, 2);
  const retentionPeriodTtc = roundMoney(retentionPeriodHt + retentionPeriodVat, 2);

  // Garde-fou somme TTC
  const check = roundMoney(netPeriodTtc + retentionPeriodTtc, 2);
  if (Math.abs(check - periodTtc) > 0.02 && periodTtc > 0) {
    // Ajuste le net TTC pour coller au période TTC
    const adjustedNetTtc = roundMoney(periodTtc - retentionPeriodTtc, 2);
    return {
      ratePercent: rate,
      retentionCapHt: cap,
      retentionPreviousHt: previous,
      retentionPeriodHt,
      retentionCumulativeHt,
      retentionRemainingCapHt,
      netPeriodSellHt,
      netPeriodVat: roundMoney(adjustedNetTtc - netPeriodSellHt, 2),
      netPeriodTtc: adjustedNetTtc,
      retentionPeriodVat,
      retentionPeriodTtc,
    };
  }

  return {
    ratePercent: rate,
    retentionCapHt: cap,
    retentionPreviousHt: previous,
    retentionPeriodHt,
    retentionCumulativeHt,
    retentionRemainingCapHt,
    netPeriodSellHt,
    netPeriodVat,
    netPeriodTtc,
    retentionPeriodVat,
    retentionPeriodTtc,
  };
}

export const RETENTION_STATUS_LABELS: Record<string, string> = {
  HELD: "Retenue",
  DUE: "À libérer",
  RELEASED: "Libérée",
  SETTLED: "Encaissée",
};

/** À la lecture : HELD + date prévue passée → DUE (affichage). */
export function effectiveRetentionStatus(
  status: string,
  plannedReleaseDate: Date | string | null | undefined,
  now = new Date(),
): string {
  if (status !== "HELD") return status;
  if (!plannedReleaseDate) return status;
  const d =
    typeof plannedReleaseDate === "string"
      ? new Date(plannedReleaseDate)
      : plannedReleaseDate;
  if (Number.isNaN(d.getTime())) return status;
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const due = new Date(d);
  due.setHours(0, 0, 0, 0);
  return due <= today ? "DUE" : "HELD";
}
