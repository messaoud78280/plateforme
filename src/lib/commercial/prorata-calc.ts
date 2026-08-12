/**
 * DF-6C — Calculs purs provision / retenue compte prorata.
 * Pas une remise commerciale.
 */
import { roundMoney } from "@/lib/commercial/money";

export type ProrataBaseMode = "PERIOD_WORK_HT";

export const PRORATA_BASE_MODE_LABELS: Record<ProrataBaseMode, string> = {
  PERIOD_WORK_HT: "Travaux HT bruts de la période",
};

export function resolveProrataBaseAmount(
  mode: ProrataBaseMode | string,
  input: { periodSellHt: number },
): number {
  switch (mode) {
    case "PERIOD_WORK_HT":
    default:
      return roundMoney(Math.max(0, Number(input.periodSellHt) || 0), 2);
  }
}

export type ProrataComputeInput = {
  enabled: boolean;
  ratePercent: number;
  baseMode: ProrataBaseMode | string;
  periodSellHt: number;
  previousProrataHt: number;
  /** Net après RG — assiette de déduction (TVA proportionnelle). */
  netAfterRetentionSellHt: number;
  netAfterRetentionVat: number;
  netAfterRetentionTtc: number;
};

export type ProrataComputeResult = {
  enabled: boolean;
  ratePercent: number;
  baseMode: ProrataBaseMode | string;
  prorataBaseAmountHt: number;
  prorataPreviousHt: number;
  prorataPeriodHt: number;
  prorataCumulativeHt: number;
  prorataPeriodVat: number;
  prorataPeriodTtc: number;
  postProrataPeriodSellHt: number;
  postProrataPeriodVat: number;
  postProrataPeriodTtc: number;
};

/**
 * Provision période = min(base × taux, net après RG).
 * Déduite du net après RG ; TVA proportionnelle.
 */
export function computeProrataProvision(
  input: ProrataComputeInput,
): ProrataComputeResult {
  const enabled = Boolean(input.enabled);
  const rate = roundMoney(
    Math.min(100, Math.max(0, Number(input.ratePercent) || 0)),
    4,
  );
  const baseMode = input.baseMode || "PERIOD_WORK_HT";
  const base = enabled
    ? resolveProrataBaseAmount(baseMode, {
        periodSellHt: input.periodSellHt,
      })
    : 0;

  const netHt = roundMoney(
    Math.max(0, Number(input.netAfterRetentionSellHt) || 0),
    2,
  );
  const netVat = roundMoney(
    Math.max(0, Number(input.netAfterRetentionVat) || 0),
    2,
  );
  const netTtc = roundMoney(
    Math.max(0, Number(input.netAfterRetentionTtc) || 0),
    2,
  );
  const previous = roundMoney(
    Math.max(0, Number(input.previousProrataHt) || 0),
    2,
  );

  let raw = 0;
  if (enabled && rate > 0 && base > 0) {
    raw = roundMoney(base * (rate / 100), 2);
  }
  const prorataPeriodHt = roundMoney(Math.min(raw, netHt), 2);

  let prorataPeriodVat = 0;
  if (netHt > 0 && prorataPeriodHt > 0) {
    prorataPeriodVat = roundMoney(netVat * (prorataPeriodHt / netHt), 2);
  }
  const prorataPeriodTtc = roundMoney(prorataPeriodHt + prorataPeriodVat, 2);

  const postProrataPeriodSellHt = roundMoney(netHt - prorataPeriodHt, 2);
  const postProrataPeriodVat = roundMoney(netVat - prorataPeriodVat, 2);
  let postProrataPeriodTtc = roundMoney(netTtc - prorataPeriodTtc, 2);
  if (postProrataPeriodTtc < 0) postProrataPeriodTtc = 0;

  return {
    enabled,
    ratePercent: enabled ? rate : 0,
    baseMode,
    prorataBaseAmountHt: base,
    prorataPreviousHt: previous,
    prorataPeriodHt,
    prorataCumulativeHt: roundMoney(previous + prorataPeriodHt, 2),
    prorataPeriodVat,
    prorataPeriodTtc,
    postProrataPeriodSellHt,
    postProrataPeriodVat,
    postProrataPeriodTtc,
  };
}
