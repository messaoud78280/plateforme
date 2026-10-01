/**
 * Projection UI légère à partir d’un QuoteDetailState déjà calculé.
 * Ne recalcule jamais CTX-03.
 */

import type { QuoteDetailState } from "./quote-detail-state";

/** Ligne compacte : « À revalider · Validé » / « Validé · À jour » / « Brouillon ». */
export function formatQuoteSyncStatusLine(detail: QuoteDetailState): string {
  if (detail.needsRevalidation || detail.syncState === "A_VERIFIER") {
    return `${detail.primaryLabel} · ${detail.commercialLabel}`;
  }
  if (detail.secondaryLabel === "À jour") {
    return `${detail.commercialLabel} · À jour`;
  }
  return detail.commercialLabel;
}

/** Champs sync sérialisables pour listes / dashboard. */
export function quoteSyncFieldsFromDetail(detail: QuoteDetailState): {
  commercialStatus: string;
  commercialLabel: string;
  syncState: QuoteDetailState["syncState"];
  syncLabel: string | null;
  primaryLabel: string;
  secondaryLabel: string | null;
  needsRevalidation: boolean;
} {
  return {
    commercialStatus: detail.commercialStatus,
    commercialLabel: detail.commercialLabel,
    syncState: detail.syncState,
    syncLabel: detail.syncLabel,
    primaryLabel: detail.primaryLabel,
    secondaryLabel: detail.secondaryLabel,
    needsRevalidation: detail.needsRevalidation,
  };
}
