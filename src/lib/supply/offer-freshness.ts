/**
 * Fraîcheur dérivée d’une offre — jamais stockée.
 * Priorité : validUntil explicite → ancienneté recordedAt / observedAt.
 */
import type { SupplyOfferFreshness } from "@/lib/supply/offer-types";

export type SupplyOfferFreshnessConfig = {
  /** Jours depuis recorded/observed → encore FRESH */
  freshDays: number;
  /** Au-delà → EXPIRED (entre les deux = TO_REFRESH) */
  refreshDays: number;
};

export const DEFAULT_SUPPLY_OFFER_FRESHNESS: SupplyOfferFreshnessConfig = {
  freshDays: 14,
  refreshDays: 45,
};

export function getSupplyOfferFreshness(
  input: {
    validUntil?: Date | string | null;
    observedAt?: Date | string | null;
    recordedAt?: Date | string | null;
  },
  now: Date = new Date(),
  config: SupplyOfferFreshnessConfig = DEFAULT_SUPPLY_OFFER_FRESHNESS,
): SupplyOfferFreshness {
  const toDate = (v: Date | string | null | undefined): Date | null => {
    if (v == null || v === "") return null;
    const d = v instanceof Date ? v : new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  const validUntil = toDate(input.validUntil);
  if (validUntil) {
    if (validUntil.getTime() < now.getTime()) return "EXPIRED";
    const daysLeft =
      (validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    if (daysLeft <= 7) return "TO_REFRESH";
    return "FRESH";
  }

  const anchor = toDate(input.observedAt) ?? toDate(input.recordedAt);
  if (!anchor) return "TO_REFRESH";

  const ageDays =
    (now.getTime() - anchor.getTime()) / (1000 * 60 * 60 * 24);
  if (ageDays <= config.freshDays) return "FRESH";
  if (ageDays <= config.refreshDays) return "TO_REFRESH";
  return "EXPIRED";
}
