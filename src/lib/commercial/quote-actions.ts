/**
 * DF-1 — Actions devis selon statut (UI + tests).
 * Pas de nouvelles transitions : réutilise le graphe V1 existant.
 */
import type { CommercialQuoteStatus } from "@prisma/client";

export type QuoteActionId =
  | "edit"
  | "preview_pdf"
  | "accepted_pdf"
  | "validate"
  | "mark_sent"
  | "accept"
  | "refuse"
  | "new_version"
  | "cancel"
  | "price_check"
  | "prepare_invoice"
  | "link_project";

export type QuoteActionDef = {
  id: QuoteActionId;
  label: string;
  primary?: boolean;
  /** Transition statut si applicable */
  toStatus?: CommercialQuoteStatus;
  destructive?: boolean;
};

/**
 * Actions proposées selon statut + verrou version.
 * primary = CTA principal (un seul recommandé).
 */
export function getQuoteActionsForStatus(input: {
  status: CommercialQuoteStatus | string;
  canEdit: boolean;
  hasAcceptedPdf?: boolean;
  hasProject?: boolean;
}): { primary: QuoteActionDef | null; secondary: QuoteActionDef[] } {
  const status = input.status;
  const secondary: QuoteActionDef[] = [];
  let primary: QuoteActionDef | null = null;

  const pdf: QuoteActionDef = input.hasAcceptedPdf
    ? { id: "accepted_pdf", label: "PDF figé à l’acceptation" }
    : { id: "preview_pdf", label: "Prévisualiser PDF" };

  switch (status) {
    case "DRAFT":
    case "TO_VALIDATE":
      primary = {
        id: "validate",
        label: "Finaliser le devis",
        toStatus: "VALIDATED",
        primary: true,
      };
      secondary.push(pdf);
      if (input.canEdit) {
        secondary.push({ id: "mark_sent", label: "Marquer envoyé", toStatus: "SENT" });
        secondary.push({
          id: "cancel",
          label: "Annuler le devis",
          toStatus: "CANCELLED",
          destructive: true,
        });
      }
      secondary.push({ id: "price_check", label: "Vérifier les prix" });
      break;

    case "VALIDATED":
      primary = { id: "mark_sent", label: "Marquer envoyé", toStatus: "SENT", primary: true };
      secondary.push(pdf);
      secondary.push({ id: "new_version", label: "Nouvelle version" });
      secondary.push({ id: "price_check", label: "Vérifier les prix" });
      if (input.canEdit) {
        secondary.push({
          id: "cancel",
          label: "Annuler le devis",
          toStatus: "CANCELLED",
          destructive: true,
        });
      }
      break;

    case "SENT":
    case "VIEWED":
      primary = { id: "accept", label: "Accepter", toStatus: "ACCEPTED", primary: true };
      secondary.push(pdf);
      secondary.push({ id: "refuse", label: "Refuser", toStatus: "REFUSED", destructive: true });
      secondary.push({ id: "new_version", label: "Nouvelle version" });
      secondary.push({ id: "price_check", label: "Vérifier les prix" });
      break;

    case "ACCEPTED":
      primary = input.hasAcceptedPdf
        ? { id: "accepted_pdf", label: "PDF figé à l’acceptation", primary: true }
        : { id: "preview_pdf", label: "Aperçu PDF", primary: true };
      if (!input.hasProject) {
        secondary.push({ id: "link_project", label: "Créer / rattacher un chantier" });
      }
      secondary.push({ id: "prepare_invoice", label: "Préparer une facture" });
      secondary.push({ id: "new_version", label: "Nouvelle version" });
      break;

    case "REFUSED":
    case "EXPIRED":
    case "CANCELLED":
      primary = { id: "preview_pdf", label: "Consulter le PDF", primary: true };
      secondary.push({ id: "new_version", label: "Nouvelle version" });
      break;

    default:
      primary = pdf;
      break;
  }

  return { primary, secondary };
}
