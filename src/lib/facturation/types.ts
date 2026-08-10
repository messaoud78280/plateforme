/**
 * FACTURATION-V1A-LITE — anti-oubli opérationnel (pas de montants inventés).
 * Source : FollowUpSheet + diagnostics BILLING_PENDING existants.
 */

export const BILLING_PIPELINE_STATUSES = [
  "TRAVAUX_TERMINES",
  "CR_A_RECUPERER",
  "A_FACTURER",
] as const;

/** Statut fiche = suite admin après émission (pas un paiement V1B). */
export const BILLING_WAITING_STATUSES = ["ATTENTE_REGLEMENT"] as const;

/** Dossiers sortis du pipeline facturation (pas « payé / soldé » financier). */
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
  /** Niveau du diagnostic BILLING_PENDING seul (pas DUE). */
  billingLevel: string | null;
  attentionReason: string | null;
  /** URGENT / CRITIQUE sur BILLING_PENDING uniquement. */
  isOverdueAttention: boolean;
  /** A_SURVEILLER / IMPORTANT sur BILLING_PENDING. */
  isWatchAttention: boolean;
  bucket: "a_facturer" | "en_attente" | "en_retard" | "soldes" | "suivi";
};

export type BillingAttentionPreview = {
  id: string;
  title: string;
  /** Ex. « Facturation à préparer » */
  headline: string;
  reason: string;
  sinceLabel: string | null;
  urgency: string;
  urgencyLabel: string;
  href: string;
  actionLabel: string;
  assigneeName: string | null;
  projectTitle: string | null;
  clientName: string | null;
};

export type BillingSnapshot = {
  kpis: BillingKpi[];
  /** Texte secondaire : « N dossier(s) à surveiller » — pas une grosse card. */
  watchSummary: string | null;
  attention: BillingAttentionPreview[];
  items: BillingListItem[];
  totals: {
    aFacturer: number;
    enAttente: number;
    enRetard: number;
    aSurveiller: number;
    soldes: number;
    attention: number;
  };
  filterAvailability: Record<BillingFilter, boolean>;
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

/** Retard métier = délai de préparation réellement dépassé. */
export function isBillingOverdueLevel(level: string | null | undefined): boolean {
  return level === "URGENT" || level === "CRITIQUE";
}

/** Traîne, mais pas encore « en retard ». */
export function isBillingWatchLevel(level: string | null | undefined): boolean {
  return level === "A_SURVEILLER" || level === "IMPORTANT";
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

export function billingUrgencyLabel(level: string | null | undefined): string {
  switch (level) {
    case "A_SURVEILLER":
      return "À surveiller";
    case "IMPORTANT":
      return "Important";
    case "URGENT":
      return "En retard";
    case "CRITIQUE":
      return "Critique";
    default:
      return "À facturer";
  }
}
