/**
 * FACTURATION-V1A-LITE — anti-oubli opérationnel (pas de montants inventés).
 * Source : FollowUpSheet + diagnostics BILLING_PENDING existants.
 */

export const BILLING_PIPELINE_STATUSES = [
  "TRAVAUX_TERMINES",
  "CR_A_RECUPERER",
  "A_FACTURER",
] as const;

export const BILLING_WAITING_STATUSES = ["ATTENTE_REGLEMENT"] as const;

export const BILLING_DONE_STATUSES = ["FACTURE", "TERMINE"] as const;

export type BillingPipelineStatus = (typeof BILLING_PIPELINE_STATUSES)[number];
export type BillingFilter = "all" | "a_facturer" | "en_attente" | "en_retard" | "soldes";

export type BillingKpiKey = "a_facturer" | "en_attente" | "en_retard" | "soldes";

export type BillingKpi = {
  key: BillingKpiKey;
  label: string;
  count: number;
  hint: string;
  /** Lien filtre page Facturation */
  href: string;
};

export type BillingListItem = {
  id: string;
  title: string;
  clientName: string | null;
  projectId: string | null;
  projectTitle: string | null;
  status: string;
  statusLabel: string;
  assigneeName: string | null;
  assigneeId: string | null;
  nextAction: string | null;
  sinceLabel: string | null;
  sinceDays: number | null;
  primaryAction: string;
  href: string;
  urgency: string | null;
  attentionReason: string | null;
  isOverdueAttention: boolean;
  bucket: "a_facturer" | "en_attente" | "en_retard" | "soldes" | "suivi";
};

export type BillingAttentionPreview = {
  id: string;
  title: string;
  reason: string;
  urgency: string;
  href: string;
  assigneeName: string | null;
  projectTitle: string | null;
};

export type BillingSnapshot = {
  kpis: BillingKpi[];
  attention: BillingAttentionPreview[];
  items: BillingListItem[];
  totals: {
    aFacturer: number;
    enAttente: number;
    enRetard: number;
    soldes: number;
    attention: number;
  };
  /** Invoice / WorkSituation présents (info, pas de KPI €). */
  hasInvoiceRows: boolean;
  hasSituationRows: boolean;
  invoiceCount: number;
  situationCount: number;
};

export function isBillingPipelineStatus(status: string): boolean {
  return (BILLING_PIPELINE_STATUSES as readonly string[]).includes(status);
}

export function isBillingWaitingStatus(status: string): boolean {
  return (BILLING_WAITING_STATUSES as readonly string[]).includes(status);
}

export function isBillingDoneStatus(status: string): boolean {
  return (BILLING_DONE_STATUSES as readonly string[]).includes(status);
}

export function resolveBillingPrimaryAction(status: string): string {
  switch (status) {
    case "A_FACTURER":
      return "Préparer la facturation";
    case "TRAVAUX_TERMINES":
      return "Préparer la facturation";
    case "CR_A_RECUPERER":
      return "Récupérer le CR puis facturer";
    case "ATTENTE_REGLEMENT":
      return "Relancer le suivi client";
    case "FACTURE":
    case "TERMINE":
      return "Voir le dossier";
    default:
      return "Voir la fiche";
  }
}

export function resolveBillingBucket(opts: {
  status: string;
  isOverdueAttention: boolean;
}): BillingListItem["bucket"] {
  if (opts.isOverdueAttention) return "en_retard";
  if (isBillingDoneStatus(opts.status)) return "soldes";
  if (isBillingWaitingStatus(opts.status)) return "en_attente";
  if (isBillingPipelineStatus(opts.status)) return "a_facturer";
  return "suivi";
}

export function formatSinceDays(days: number | null): string | null {
  if (days == null || days < 0) return null;
  if (days === 0) return "aujourd’hui";
  if (days === 1) return "1 jour";
  return `${days} jours`;
}
