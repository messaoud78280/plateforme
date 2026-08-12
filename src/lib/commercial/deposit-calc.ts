/**
 * DF-6B — Déduction d’acomptes sur situations (calculs purs).
 */
import { roundMoney } from "@/lib/commercial/money";

export type DepositDeductionInput = {
  /** Net après RG (HT). */
  netPeriodSellHt: number;
  netPeriodVat: number;
  netPeriodTtc: number;
  /** Acomptes encore à déduire (HT). */
  remainingDepositHt: number;
};

export type DepositDeductionResult = {
  depositDeductedHt: number;
  depositDeductedVat: number;
  depositDeductedTtc: number;
  payablePeriodSellHt: number;
  payablePeriodVat: number;
  payablePeriodTtc: number;
};

/**
 * Déduit l’acompte du net après RG, sans dépasser le net ni le reste d’acompte.
 * TVA proportionnelle.
 */
export function computeDepositDeduction(
  input: DepositDeductionInput,
): DepositDeductionResult {
  const netHt = roundMoney(Math.max(0, Number(input.netPeriodSellHt) || 0), 2);
  const netVat = roundMoney(Math.max(0, Number(input.netPeriodVat) || 0), 2);
  const netTtc = roundMoney(Math.max(0, Number(input.netPeriodTtc) || 0), 2);
  const remaining = roundMoney(
    Math.max(0, Number(input.remainingDepositHt) || 0),
    2,
  );

  const depositDeductedHt = roundMoney(Math.min(netHt, remaining), 2);
  let depositDeductedVat = 0;
  if (netHt > 0 && depositDeductedHt > 0) {
    depositDeductedVat = roundMoney(netVat * (depositDeductedHt / netHt), 2);
  }
  const depositDeductedTtc = roundMoney(
    depositDeductedHt + depositDeductedVat,
    2,
  );

  const payablePeriodSellHt = roundMoney(netHt - depositDeductedHt, 2);
  const payablePeriodVat = roundMoney(netVat - depositDeductedVat, 2);
  let payablePeriodTtc = roundMoney(netTtc - depositDeductedTtc, 2);
  // Garde-fou arrondi
  if (payablePeriodTtc < 0) payablePeriodTtc = 0;

  return {
    depositDeductedHt,
    depositDeductedVat,
    depositDeductedTtc,
    payablePeriodSellHt,
    payablePeriodVat,
    payablePeriodTtc,
  };
}
