/**
 * Source de vérité — état workflow devis côté préparation chantier.
 *
 * Brouillon ≠ Prêt ≠ Accepté.
 * L’existence d’un CommercialQuote ne signifie pas que l’étape est terminée.
 *
 * Statut backend réutilisé pour « Prêt » : VALIDATED
 * (pas ACCEPTED — réservé à l’acceptation client réelle).
 */

export type QuotePreparationPhase =
  | "none"
  | "draft"
  | "ready"
  | "accepted"
  | "closed";

const READY_STATUSES = new Set([
  "VALIDATED",
  "SENT",
  "VIEWED",
  "ACCEPTED",
]);

const CLOSED_STATUSES = new Set(["REFUSED", "EXPIRED", "CANCELLED"]);

/** Étape devis considérée terminée pour le compteur / coche chantier. */
export function isQuotePreparationReady(
  status: string | null | undefined,
): boolean {
  if (!status) return false;
  return READY_STATUSES.has(status);
}

export function getQuotePreparationPhase(
  status: string | null | undefined,
): QuotePreparationPhase {
  if (!status) return "none";
  if (status === "ACCEPTED") return "accepted";
  if (CLOSED_STATUSES.has(status)) return "closed";
  if (READY_STATUSES.has(status)) return "ready";
  return "draft";
}

/** Libellé court pour bandeau / cartes / modules préparation. */
export function quotePreparationStateLabel(
  status: string | null | undefined,
): string {
  const phase = getQuotePreparationPhase(status);
  switch (phase) {
    case "none":
      return "À préparer";
    case "draft":
      return "Brouillon";
    case "ready":
      if (status === "SENT" || status === "VIEWED") return "Émis";
      return "Prêt";
    case "accepted":
      return "Accepté";
    case "closed":
      if (status === "REFUSED") return "Refusé";
      if (status === "EXPIRED") return "Expiré";
      return "Annulé";
  }
}

/** Lien éditeur devis — avec intent finalize si encore brouillon. */
export function quoteEditorHref(
  quoteId: string,
  status: string | null | undefined,
): string {
  const base = `/dashboard/devis-facturation/devis/${quoteId}`;
  if (!isQuotePreparationReady(status)) {
    return `${base}?intent=finalize`;
  }
  return base;
}

export function quoteWorkflowActionLabel(
  status: string | null | undefined,
): string {
  if (!status) return "Créer un devis";
  if (!isQuotePreparationReady(status)) return "Finaliser le devis";
  return "Ouvrir";
}
