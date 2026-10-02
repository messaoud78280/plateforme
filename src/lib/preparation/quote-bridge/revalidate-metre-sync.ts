/**
 * CTX-03 — Éligibilité à la revalidation devis ↔ métré.
 * Réutilise evaluateQuoteStudySyncState (pas de deuxième définition de stale).
 *
 * Revalidation ≠ modification commerciale :
 * confirme que le devis a été contrôlé vs la version courante du métré
 * et qu’aucun écart quantitatif significatif ne subsiste.
 */
import {
  evaluateQuoteStudySyncState,
  type QuoteStudySyncDetectState,
} from "@/lib/preparation/quote-bridge/quote-sync-state";

export const QUOTE_REVALIDABLE_STATUSES = [
  "DRAFT",
  "TO_VALIDATE",
  "VALIDATED",
] as const;

export const QUOTE_REVALIDATION_LOCKED_STATUSES = [
  "SENT",
  "VIEWED",
  "ACCEPTED",
  "REFUSED",
  "EXPIRED",
  "CANCELLED",
] as const;

export type QuoteRevalidationReason =
  | "ELIGIBLE"
  | "NOT_STALE"
  | "NO_METRE_PROVENANCE"
  | "NO_TRANSFER"
  | "QUANTITY_DIFFS"
  | "STATUS_LOCKED"
  | "FINANCIAL_LOCKED"
  | "VERSION_CHANGED";

export type QuoteRevalidationEligibility = {
  needsRevalidation: boolean;
  eligible: boolean;
  reason: QuoteRevalidationReason;
  syncState: QuoteStudySyncDetectState;
  currentStudyVersion: number | null;
  transferStudyVersion: number | null;
  hasSignificantQuantityDiffs: boolean | null;
  blockingStatus: string | null;
  blockingFinancialState: boolean;
  /** Libellé CTA UI selon statut. */
  actionLabel: string | null;
  /** Message bloquant / guidage UI. */
  userMessage: string | null;
};

export function evaluateQuoteRevalidationEligibility(input: {
  commercialStatus: string;
  hasMetreProvenance: boolean;
  hasTransfer: boolean;
  currentStudyVersion: number | null | undefined;
  transferStudyVersion: number | null | undefined;
  hasSignificantQuantityDiffs?: boolean | null;
  /** Facture émise / acompte / encaissement. */
  hasFinancialLock?: boolean;
}): QuoteRevalidationEligibility {
  const sync = evaluateQuoteStudySyncState({
    hasQuote: true,
    hasMetreProvenance: input.hasMetreProvenance,
    currentStudyVersion: input.currentStudyVersion,
    transferStudyVersion: input.transferStudyVersion,
    hasSignificantQuantityDiffs: input.hasSignificantQuantityDiffs,
  });

  const needsRevalidation = sync.syncState === "MODIFICATION_DISPONIBLE";
  const status = String(input.commercialStatus ?? "");
  const financialLocked = input.hasFinancialLock === true;
  const statusLocked = (QUOTE_REVALIDATION_LOCKED_STATUSES as readonly string[]).includes(
    status,
  );
  const statusAllowed = (QUOTE_REVALIDABLE_STATUSES as readonly string[]).includes(status);

  const base = {
    needsRevalidation,
    syncState: sync.syncState,
    currentStudyVersion:
      input.currentStudyVersion != null && Number.isFinite(Number(input.currentStudyVersion))
        ? Number(input.currentStudyVersion)
        : null,
    transferStudyVersion:
      input.transferStudyVersion != null && Number.isFinite(Number(input.transferStudyVersion))
        ? Number(input.transferStudyVersion)
        : null,
    hasSignificantQuantityDiffs:
      input.hasSignificantQuantityDiffs === undefined
        ? null
        : input.hasSignificantQuantityDiffs,
    blockingStatus: statusLocked ? status : null,
    blockingFinancialState: financialLocked,
  };

  if (!input.hasMetreProvenance) {
    return {
      ...base,
      eligible: false,
      reason: "NO_METRE_PROVENANCE",
      actionLabel: null,
      userMessage: null,
    };
  }

  if (!input.hasTransfer) {
    return {
      ...base,
      eligible: false,
      reason: "NO_TRANSFER",
      actionLabel: null,
      userMessage: "Aucun transfert métré lié à ce devis.",
    };
  }

  if (!needsRevalidation) {
    return {
      ...base,
      eligible: false,
      reason: "NOT_STALE",
      actionLabel: null,
      userMessage: null,
    };
  }

  if (financialLocked) {
    return {
      ...base,
      eligible: false,
      reason: "FINANCIAL_LOCKED",
      actionLabel: null,
      userMessage:
        "Ce devis est engagé en facturation ou acompte — la revalidation automatique est bloquée.",
    };
  }

  if (statusLocked || !statusAllowed) {
    const msg =
      status === "ACCEPTED"
        ? "Le métré a changé après acceptation. Le devis accepté n'est pas modifié."
        : status === "SENT" || status === "VIEWED"
          ? "Le métré a changé depuis l'envoi de ce devis. Une révision du devis est nécessaire."
          : `Revalidation impossible pour un devis au statut ${status}.`;
    return {
      ...base,
      eligible: false,
      reason: "STATUS_LOCKED",
      actionLabel: null,
      userMessage: msg,
    };
  }

  if (input.hasSignificantQuantityDiffs === true) {
    return {
      ...base,
      eligible: false,
      reason: "QUANTITY_DIFFS",
      actionLabel: null,
      userMessage:
        "Des quantités du devis diffèrent du métré. Mettez d'abord le devis à jour avant de le revalider.",
    };
  }

  const actionLabel =
    status === "VALIDATED" ? "Revalider le devis" : "Mettre à jour la référence métré";

  return {
    ...base,
    eligible: true,
    reason: "ELIGIBLE",
    actionLabel,
    userMessage:
      status === "VALIDATED"
        ? "Cette action confirme que le devis a été contrôlé par rapport à la version actuelle du métré."
        : "Cette action aligne la référence métré du devis sur la version courante, sans modifier le contenu commercial.",
  };
}
