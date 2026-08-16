/**
 * CONTRATS-ANNUELS-3 — action principale du drawer (une seule CTA forte).
 */
import type {
  SerializedAnnualContract,
  SerializedAnnualIntervention,
} from "@/lib/annual-contracts/load-board";

export type AnnualPrimaryKind =
  | "schedule"
  | "view_intervention"
  | "complete"
  | "prepare_invoice"
  | "continue_invoice"
  | "view_invoice"
  | "view_paid_invoice"
  | "none";

export type AnnualPrimaryAction = {
  kind: AnnualPrimaryKind;
  label: string;
  interventionId: string | null;
  invoiceHref: string | null;
};

function todayUtcDateOnly(): string {
  const n = new Date();
  return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate()))
    .toISOString()
    .slice(0, 10);
}

/** Intervention à facturer (réalisée) prioritaire sur l’open « N+1 ». */
export function resolveBillingIntervention(
  contract: SerializedAnnualContract,
): SerializedAnnualIntervention | null {
  const fromHistory = contract.history.find(
    (h) =>
      h.billingState === "to_bill" ||
      h.billingState === "preparing" ||
      h.billingState === "invoiced" ||
      h.billingState === "paid",
  );
  if (fromHistory) return fromHistory;
  if (
    contract.openIntervention &&
    (contract.openIntervention.billingState === "to_bill" ||
      contract.openIntervention.billingState === "preparing")
  ) {
    return contract.openIntervention;
  }
  return null;
}

export function resolveAnnualPrimaryAction(
  contract: SerializedAnnualContract,
  opts: { includeFinancials: boolean },
): AnnualPrimaryAction {
  const billing = resolveBillingIntervention(contract);
  const open = contract.openIntervention;

  if (opts.includeFinancials && billing) {
    if (billing.billingState === "paid" && billing.commercialInvoiceHref) {
      return {
        kind: "view_paid_invoice",
        label: "Voir la facture payée",
        interventionId: billing.id,
        invoiceHref: billing.commercialInvoiceHref,
      };
    }
    if (billing.billingState === "invoiced" && billing.commercialInvoiceHref) {
      return {
        kind: "view_invoice",
        label: "Voir la facture",
        interventionId: billing.id,
        invoiceHref: billing.commercialInvoiceHref,
      };
    }
    if (billing.billingState === "preparing") {
      return {
        kind: "continue_invoice",
        label: "Continuer la facture",
        interventionId: billing.id,
        invoiceHref: billing.commercialInvoiceHref,
      };
    }
    if (billing.billingState === "to_bill") {
      return {
        kind: "prepare_invoice",
        label: "Préparer la facture",
        interventionId: billing.id,
        invoiceHref: null,
      };
    }
  }

  if (!open) {
    return {
      kind: "none",
      label: "",
      interventionId: null,
      invoiceHref: null,
    };
  }

  if (open.status === "TO_PREPARE" || !open.agendaEventId) {
    return {
      kind: "schedule",
      label: "Programmer l’intervention",
      interventionId: open.id,
      invoiceHref: null,
    };
  }

  if (open.status === "SCHEDULED") {
    const today = todayUtcDateOnly();
    const planned = open.plannedDate;
    if (planned && planned < today) {
      return {
        kind: "complete",
        label: "Marquer l’intervention réalisée",
        interventionId: open.id,
        invoiceHref: null,
      };
    }
    return {
      kind: "view_intervention",
      label: "Voir / modifier l’intervention",
      interventionId: open.id,
      invoiceHref: null,
    };
  }

  if (open.status !== "COMPLETED") {
    return {
      kind: "complete",
      label: "Marquer l’intervention réalisée",
      interventionId: open.id,
      invoiceHref: null,
    };
  }

  return {
    kind: "none",
    label: "",
    interventionId: null,
    invoiceHref: null,
  };
}
