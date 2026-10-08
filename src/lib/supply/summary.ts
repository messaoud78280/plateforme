/**
 * Indicateurs cockpit Approvisionnements — basés sur offres réelles (Phase 3).
 */
import type { MaterialCoverageState } from "@/lib/materiaux/progress";
import type { SupplyCategory } from "@/lib/supply/types";

export type SupplyNeedSummaryInput = {
  status: string;
  category?: string | null;
  sourceDrift?: string | null;
  coverageState: MaterialCoverageState;
  remainingToOrder: number;
  /** Nombre d’offres actives (non archivées) */
  offerCount?: number;
  /** Au moins une offre avec unitPrice != null */
  hasPricedOffer?: boolean;
  /** selectedOfferId renseigné */
  hasSelectedOffer?: boolean;
};

export type SupplyCockpitSummary = {
  total: number;
  toConsult: number;
  toOrder: number;
  withoutSupplier: number;
  withoutPrice: number;
  withSelectedOffer: number;
  coveredByPo: number;
  alerts: number;
  byCategory: Partial<Record<SupplyCategory, number>>;
};

export function summarizeSupplyNeeds(
  rows: SupplyNeedSummaryInput[],
): SupplyCockpitSummary {
  const active = rows.filter((r) => r.status !== "CANCELLED");
  const byCategory: Partial<Record<SupplyCategory, number>> = {};
  let toConsult = 0;
  let toOrder = 0;
  let coveredByPo = 0;
  let alerts = 0;
  let withoutSupplier = 0;
  let withoutPrice = 0;
  let withSelectedOffer = 0;

  for (const r of active) {
    const cat = (r.category ?? "MATERIAL") as SupplyCategory;
    byCategory[cat] = (byCategory[cat] ?? 0) + 1;

    if (r.status === "TO_CONSULT" || r.status === "PROPOSED") toConsult += 1;
    if (
      r.remainingToOrder > 1e-9 &&
      (r.status === "TO_ORDER" ||
        r.status === "VALIDATED" ||
        r.coverageState === "A_COMMANDER" ||
        r.coverageState === "PARTIELLEMENT_COMMANDE")
    ) {
      toOrder += 1;
    }
    if (
      r.coverageState === "COMMANDE" ||
      r.coverageState === "PARTIELLEMENT_RECU" ||
      r.coverageState === "RECU" ||
      r.coverageState === "PARTIELLEMENT_COMMANDE"
    ) {
      coveredByPo += 1;
    }
    if (r.sourceDrift && r.sourceDrift !== "NONE") alerts += 1;

    const offerCount = Math.max(0, Number(r.offerCount) || 0);
    if (offerCount === 0) withoutSupplier += 1;
    if (!r.hasPricedOffer) withoutPrice += 1;
    if (r.hasSelectedOffer) withSelectedOffer += 1;
  }

  return {
    total: active.length,
    toConsult,
    toOrder,
    withoutSupplier,
    withoutPrice,
    withSelectedOffer,
    coveredByPo,
    alerts,
    byCategory,
  };
}
