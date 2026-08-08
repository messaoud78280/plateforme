import type { PurchaseOrderStatus } from "@prisma/client";

export const REFUSE_REASONS = [
  { key: "STOCK", label: "Stock indisponible" },
  { key: "DELAY", label: "Délai impossible" },
  { key: "REF", label: "Référence indisponible" },
  { key: "OTHER", label: "Autre" },
] as const;

export type SupplierRefuseReasonKey = (typeof REFUSE_REASONS)[number]["key"];

export function supplierActionsForStatus(
  status: PurchaseOrderStatus,
  proposedStatus: string,
) {
  const canConfirm = ["A_CONFIRMER", "ENVOYEE_FOURNISSEUR"].includes(status);
  const canPropose = [
    "A_CONFIRMER",
    "ENVOYEE_FOURNISSEUR",
    "CONFIRMEE",
    "LIVRAISON_PROGRAMMEE",
  ].includes(status);
  const canRefuse = ["A_CONFIRMER", "ENVOYEE_FOURNISSEUR"].includes(status);
  return {
    canConfirm: canConfirm && proposedStatus !== "PENDING",
    canPropose,
    canRefuse,
    proposalPending: proposedStatus === "PENDING",
    proposalRefused: proposedStatus === "REFUSED",
  };
}
