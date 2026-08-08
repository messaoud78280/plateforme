import type { PurchaseOrderStatus } from "@prisma/client";

export const PURCHASE_ORDER_STATUS_LABELS: Record<PurchaseOrderStatus, string> = {
  BROUILLON: "Brouillon",
  A_VALIDER: "À valider",
  VALIDEE: "Validée",
  ENVOYEE_FOURNISSEUR: "Envoyée fournisseur",
  A_CONFIRMER: "À confirmer",
  CONFIRMEE: "Confirmée",
  LIVRAISON_PROGRAMMEE: "Livraison programmée",
  PARTIELLEMENT_RECUE: "Partiellement reçue",
  RECUE: "Reçue",
  CLOTUREE: "Clôturée",
  ANNULEE: "Annulée",
  REFUSEE: "Refusée",
};

/** Transitions autorisées (CDE-1 — simple). */
const TRANSITIONS: Partial<Record<PurchaseOrderStatus, PurchaseOrderStatus[]>> = {
  BROUILLON: ["A_VALIDER", "A_CONFIRMER", "ANNULEE"],
  A_VALIDER: ["VALIDEE", "REFUSEE", "BROUILLON", "ANNULEE"],
  VALIDEE: ["ENVOYEE_FOURNISSEUR", "A_CONFIRMER", "ANNULEE"],
  ENVOYEE_FOURNISSEUR: ["A_CONFIRMER", "CONFIRMEE", "ANNULEE"],
  A_CONFIRMER: ["CONFIRMEE", "LIVRAISON_PROGRAMMEE", "ANNULEE", "REFUSEE"],
  CONFIRMEE: ["LIVRAISON_PROGRAMMEE", "PARTIELLEMENT_RECUE", "RECUE", "ANNULEE"],
  LIVRAISON_PROGRAMMEE: ["PARTIELLEMENT_RECUE", "RECUE", "ANNULEE"],
  PARTIELLEMENT_RECUE: ["RECUE", "CLOTUREE"],
  RECUE: ["CLOTUREE"],
  CLOTUREE: [],
  ANNULEE: [],
  REFUSEE: ["BROUILLON"],
};

export function canTransitionPurchaseOrder(
  from: PurchaseOrderStatus,
  to: PurchaseOrderStatus,
): boolean {
  if (from === to) return true;
  return (TRANSITIONS[from] ?? []).includes(to);
}

export type PurchaseOrderAction =
  | "submit_validation"
  | "validate"
  | "refuse"
  | "send_supplier"
  | "mark_to_confirm"
  | "confirm_delivery"
  | "schedule_delivery"
  | "partial_receive"
  | "receive"
  | "close"
  | "cancel"
  | "accept_proposal"
  | "refuse_proposal";

export function actionsForPurchaseOrderStatus(
  status: PurchaseOrderStatus,
): { action: PurchaseOrderAction; label: string; next: PurchaseOrderStatus }[] {
  const all: {
    action: PurchaseOrderAction;
    label: string;
    next: PurchaseOrderStatus;
    from: PurchaseOrderStatus[];
  }[] = [
    {
      action: "submit_validation",
      label: "Soumettre à validation",
      next: "A_VALIDER",
      from: ["BROUILLON"],
    },
    { action: "validate", label: "Valider", next: "VALIDEE", from: ["A_VALIDER"] },
    { action: "refuse", label: "Refuser", next: "REFUSEE", from: ["A_VALIDER", "A_CONFIRMER"] },
    {
      action: "send_supplier",
      label: "Partager avec le fournisseur",
      next: "A_CONFIRMER",
      from: ["VALIDEE", "BROUILLON", "ENVOYEE_FOURNISSEUR", "A_CONFIRMER"],
    },
    {
      action: "mark_to_confirm",
      label: "Marquer à confirmer",
      next: "A_CONFIRMER",
      from: ["BROUILLON", "VALIDEE", "ENVOYEE_FOURNISSEUR"],
    },
    {
      action: "confirm_delivery",
      label: "Confirmer la livraison",
      next: "CONFIRMEE",
      from: ["A_CONFIRMER", "ENVOYEE_FOURNISSEUR"],
    },
    {
      action: "schedule_delivery",
      label: "Livraison programmée",
      next: "LIVRAISON_PROGRAMMEE",
      from: ["CONFIRMEE", "A_CONFIRMER"],
    },
    // CDE-3A : réception réelle via /reception (plus de bouton statut seul)
    {
      action: "partial_receive",
      label: "Marquer partiellement reçue",
      next: "PARTIELLEMENT_RECUE",
      from: [],
    },
    {
      action: "receive",
      label: "Marquer reçue",
      next: "RECUE",
      from: [],
    },
    {
      action: "close",
      label: "Clôturer",
      next: "CLOTUREE",
      from: ["RECUE", "PARTIELLEMENT_RECUE"],
    },
    {
      action: "cancel",
      label: "Annuler",
      next: "ANNULEE",
      from: [
        "BROUILLON",
        "A_VALIDER",
        "VALIDEE",
        "ENVOYEE_FOURNISSEUR",
        "A_CONFIRMER",
        "CONFIRMEE",
        "LIVRAISON_PROGRAMMEE",
      ],
    },
  ];
  return all
    .filter((a) => a.from.includes(status))
    .map(({ action, label, next }) => ({ action, label, next }));
}
