/**
 * Projection UI détail devis — délègue CTX-03 à evaluateQuoteStudySyncState.
 * Ne recalcule pas le métier. Ne mute jamais le statut commercial.
 */

import {
  evaluateQuoteStudySyncState,
  type QuoteStudySyncDetectState,
} from "@/lib/preparation/quote-bridge/quote-sync-state";
import { COMMERCIAL_QUOTE_STATUS_LABELS } from "@/lib/commercial/money";

export type QuoteDetailSyncVariant = "ok" | "warn" | "alert" | "neutral";

export type QuoteDetailState = {
  commercialStatus: string;
  /** Libellé commercial (Validé, Brouillon…) — jamais « Prêt » pour VALIDATED. */
  commercialLabel: string;
  syncState: QuoteStudySyncDetectState;
  syncLabel: string | null;
  syncVariant: QuoteDetailSyncVariant;
  /** Message utilisateur principal si stale / à vérifier. */
  syncMessage: string | null;
  needsRevalidation: boolean;
  /**
   * Badge principal affiché en priorité.
   * Stale → sync ; sinon commercial.
   */
  primaryLabel: string;
  primaryVariant: QuoteDetailSyncVariant;
  /** Badge secondaire (commercial si sync prioritaire, ou « À jour »). */
  secondaryLabel: string | null;
};

/** Libellé commercial pour l’écran détail (distinct du sync). */
export function quoteDetailCommercialLabel(status: string): string {
  if (status === "VALIDATED") return "Validé";
  return COMMERCIAL_QUOTE_STATUS_LABELS[status] ?? status;
}

export function quoteSyncDisplayLabel(
  syncState: QuoteStudySyncDetectState,
): string | null {
  switch (syncState) {
    case "A_JOUR":
      return "À jour";
    case "MODIFICATION_DISPONIBLE":
      return "À revalider";
    case "A_VERIFIER":
      return "À vérifier";
    case "ABSENT":
      return null;
  }
}

export function quoteSyncUserMessage(
  syncState: QuoteStudySyncDetectState,
): string | null {
  switch (syncState) {
    case "MODIFICATION_DISPONIBLE":
      return "Le métré lié à ce devis a été modifié. Vérifiez le devis avant de le considérer comme à jour.";
    case "A_VERIFIER":
      return "L’alignement avec le métré n’a pas pu être confirmé. Vérifiez la provenance avant de considérer ce devis comme synchronisé.";
    default:
      return null;
  }
}

function variantForSync(
  syncState: QuoteStudySyncDetectState,
): QuoteDetailSyncVariant {
  if (syncState === "MODIFICATION_DISPONIBLE") return "alert";
  if (syncState === "A_VERIFIER") return "warn";
  if (syncState === "A_JOUR") return "ok";
  return "neutral";
}

/**
 * Construit l’état affiché sur la page détail d’UN devis.
 * Délègue exclusivement à evaluateQuoteStudySyncState (CTX-03).
 */
export function buildQuoteDetailState(input: {
  commercialStatus: string;
  hasMetreProvenance: boolean;
  currentStudyVersion: number | null | undefined;
  transferStudyVersion: number | null | undefined;
  hasSignificantQuantityDiffs?: boolean | null;
}): QuoteDetailState {
  const commercialStatus = input.commercialStatus;
  const commercialLabel = quoteDetailCommercialLabel(commercialStatus);

  const evalResult = evaluateQuoteStudySyncState({
    hasQuote: true,
    hasMetreProvenance: input.hasMetreProvenance,
    currentStudyVersion: input.currentStudyVersion,
    transferStudyVersion: input.transferStudyVersion,
    hasSignificantQuantityDiffs: input.hasSignificantQuantityDiffs,
  });

  const syncState = evalResult.syncState;
  const syncLabel = quoteSyncDisplayLabel(syncState);
  const syncVariant = variantForSync(syncState);
  const needsRevalidation = syncState === "MODIFICATION_DISPONIBLE";
  const needsVerify = syncState === "A_VERIFIER" && input.hasMetreProvenance;

  let primaryLabel = commercialLabel;
  let primaryVariant: QuoteDetailSyncVariant = "neutral";
  let secondaryLabel: string | null = null;

  if (needsRevalidation) {
    primaryLabel = "À revalider";
    primaryVariant = "alert";
    secondaryLabel = commercialLabel;
  } else if (needsVerify) {
    primaryLabel = "À vérifier";
    primaryVariant = "warn";
    secondaryLabel = commercialLabel;
  } else if (syncState === "A_JOUR" && input.hasMetreProvenance) {
    primaryLabel = commercialLabel;
    primaryVariant = "neutral";
    secondaryLabel = "À jour";
  } else {
    primaryLabel = commercialLabel;
    primaryVariant = "neutral";
    secondaryLabel = null;
  }

  return {
    commercialStatus,
    commercialLabel,
    syncState,
    syncLabel,
    syncVariant,
    syncMessage: quoteSyncUserMessage(syncState),
    needsRevalidation,
    primaryLabel,
    primaryVariant,
    secondaryLabel,
  };
}
