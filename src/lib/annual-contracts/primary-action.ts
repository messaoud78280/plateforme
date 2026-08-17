/**
 * Actions principales / secondaires — une CTA par cycle (intervention ≠ facturation).
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
  /** Année du cycle concerné par l’action. */
  cycleYear: number | null;
  /** Facturation vs intervention. */
  cycleKind: "billing" | "intervention" | null;
};

function todayUtcDateOnly(): string {
  const n = new Date();
  return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate()))
    .toISOString()
    .slice(0, 10);
}

function yearOf(i: SerializedAnnualIntervention | null): number | null {
  return i?.plannedYear ?? null;
}

/** Intervention réalisée à facturer / en cours de facturation (pas l’open N+1). */
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

function billingAction(
  billing: SerializedAnnualIntervention,
): AnnualPrimaryAction | null {
  const y = yearOf(billing);
  const ySuffix = y != null ? ` ${y}` : "";
  if (billing.billingState === "paid" && billing.commercialInvoiceHref) {
    return {
      kind: "view_paid_invoice",
      label: y != null ? `Voir facture ${y}` : "Voir la facture encaissée",
      interventionId: billing.id,
      invoiceHref: billing.commercialInvoiceHref,
      cycleYear: y,
      cycleKind: "billing",
    };
  }
  if (billing.billingState === "invoiced" && billing.commercialInvoiceHref) {
    return {
      kind: "view_invoice",
      label: y != null ? `Voir facture ${y}` : "Voir la facture",
      interventionId: billing.id,
      invoiceHref: billing.commercialInvoiceHref,
      cycleYear: y,
      cycleKind: "billing",
    };
  }
  if (billing.billingState === "preparing") {
    return {
      kind: "continue_invoice",
      label: `Continuer la facture${ySuffix}`,
      interventionId: billing.id,
      invoiceHref: billing.commercialInvoiceHref,
      cycleYear: y,
      cycleKind: "billing",
    };
  }
  if (billing.billingState === "to_bill") {
    return {
      kind: "prepare_invoice",
      label: `Préparer la facture${ySuffix}`,
      interventionId: billing.id,
      invoiceHref: null,
      cycleYear: y,
      cycleKind: "billing",
    };
  }
  return null;
}

function interventionAction(
  open: SerializedAnnualIntervention,
): AnnualPrimaryAction {
  const y = yearOf(open);
  const ySuffix = y != null ? ` ${y}` : "";

  if (open.status === "TO_PREPARE" || !open.agendaEventId) {
    return {
      kind: "schedule",
      label: open.status === "TO_PREPARE"
        ? `Préparer${ySuffix}`
        : `Programmer${ySuffix}`,
      interventionId: open.id,
      invoiceHref: null,
      cycleYear: y,
      cycleKind: "intervention",
    };
  }

  if (open.status === "SCHEDULED") {
    const today = todayUtcDateOnly();
    const planned = open.plannedDate;
    if (planned && planned < today) {
      return {
        kind: "complete",
        label: y != null ? `Marquer réalisée ${y}` : "Marquer réalisée",
        interventionId: open.id,
        invoiceHref: null,
        cycleYear: y,
        cycleKind: "intervention",
      };
    }
    return {
      kind: "view_intervention",
      label: y != null ? `Voir intervention ${y}` : "Voir l’intervention",
      interventionId: open.id,
      invoiceHref: null,
      cycleYear: y,
      cycleKind: "intervention",
    };
  }

  if (open.status !== "COMPLETED") {
    return {
      kind: "complete",
      label: y != null ? `Marquer réalisée ${y}` : "Marquer réalisée",
      interventionId: open.id,
      invoiceHref: null,
      cycleYear: y,
      cycleKind: "intervention",
    };
  }

  return {
    kind: "none",
    label: "",
    interventionId: null,
    invoiceHref: null,
    cycleYear: null,
    cycleKind: null,
  };
}

/**
 * Priorité métier : facture à finaliser / à créer avant préparation N+1,
 * mais l’UI doit toujours montrer l’action secondaire du cycle suivant.
 */
export function resolveAnnualPrimaryAction(
  contract: SerializedAnnualContract,
  opts: { includeFinancials: boolean },
): AnnualPrimaryAction {
  const billing = resolveBillingIntervention(contract);
  const open = contract.openIntervention;

  if (opts.includeFinancials && billing) {
    const ba = billingAction(billing);
    if (
      ba &&
      (billing.billingState === "to_bill" || billing.billingState === "preparing")
    ) {
      return ba;
    }
    // Facture déjà émise/payée : prioriser l’intervention ouverte si elle existe
    if (open && open.id !== billing.id) {
      return interventionAction(open);
    }
    if (ba) return ba;
  }

  if (!open) {
    return {
      kind: "none",
      label: "Voir",
      interventionId: null,
      invoiceHref: null,
      cycleYear: null,
      cycleKind: null,
    };
  }

  return interventionAction(open);
}

/** Deuxième action (autre cycle) lorsque facturation et intervention coexistent. */
export function resolveAnnualSecondaryAction(
  contract: SerializedAnnualContract,
  opts: { includeFinancials: boolean },
): AnnualPrimaryAction | null {
  const primary = resolveAnnualPrimaryAction(contract, opts);
  const billing = resolveBillingIntervention(contract);
  const open = contract.openIntervention;

  if (primary.cycleKind === "billing" && open && open.id !== billing?.id) {
    return interventionAction(open);
  }
  if (
    primary.cycleKind === "intervention" &&
    opts.includeFinancials &&
    billing &&
    billing.id !== open?.id &&
    (billing.billingState === "to_bill" || billing.billingState === "preparing")
  ) {
    return billingAction(billing);
  }
  return null;
}

/** Action contextuelle pour une carte pilote (liée à l’intervention du bucket). */
export function resolvePilotRowAction(
  contract: SerializedAnnualContract,
  intervention: SerializedAnnualIntervention,
  opts: { includeFinancials: boolean; bucket: string },
): AnnualPrimaryAction {
  if (
    opts.bucket === "to_bill" ||
    opts.bucket === "preparing" ||
    intervention.billingState === "to_bill" ||
    intervention.billingState === "preparing"
  ) {
    if (opts.includeFinancials) {
      const ba = billingAction(intervention);
      if (ba) return ba;
    }
  }
  if (intervention.status === "COMPLETED") {
    if (opts.includeFinancials && intervention.billingState === "to_bill") {
      return {
        kind: "prepare_invoice",
        label: `Préparer la facture ${intervention.plannedYear ?? ""}`.trim(),
        interventionId: intervention.id,
        invoiceHref: null,
        cycleYear: intervention.plannedYear,
        cycleKind: "billing",
      };
    }
    return {
      kind: "none",
      label: "Voir",
      interventionId: intervention.id,
      invoiceHref: intervention.commercialInvoiceHref,
      cycleYear: intervention.plannedYear,
      cycleKind: "billing",
    };
  }
  return interventionAction(intervention);
}
