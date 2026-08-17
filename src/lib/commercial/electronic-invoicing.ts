/**
 * Facturation électronique FR — architecture prête, sans fausse connexion.
 *
 * Factur-X / UBL / CII = formats, pas des statuts.
 * Statuts réglementaires (cycle de vie) ≠ statuts internes BeWork.
 *
 * Aucune plateforme agréée n’est branchée aujourd’hui :
 * ne jamais afficher Déposée / Reçue / Acceptée sans événement réel.
 */

export const ELECTRONIC_INVOICE_FORMATS = ["FACTUR_X", "UBL", "CII"] as const;
export type ElectronicInvoiceFormat = (typeof ELECTRONIC_INVOICE_FORMATS)[number];

export const ELECTRONIC_FORMAT_LABELS: Record<ElectronicInvoiceFormat, string> = {
  FACTUR_X: "Factur-X",
  UBL: "UBL",
  CII: "CII",
};

/** Statuts réglementaires minimum du cycle de vie (réforme FR). */
export const ELECTRONIC_REGULATORY_STATUSES = [
  "DEPOSIT",
  "REJECTION",
  "REFUSAL",
  "COLLECTED",
] as const;
export type ElectronicRegulatoryStatus =
  (typeof ELECTRONIC_REGULATORY_STATUSES)[number];

export const ELECTRONIC_REGULATORY_STATUS_LABELS: Record<
  ElectronicRegulatoryStatus,
  string
> = {
  DEPOSIT: "Dépôt",
  REJECTION: "Rejet",
  REFUSAL: "Refus",
  COLLECTED: "Encaissée",
};

/** Statuts internes BeWork — ne pas confondre avec le cycle réglementaire. */
export const ELECTRONIC_INTERNAL_STATUSES = [
  "NOT_CONNECTED",
  "READY",
  "TO_TRANSMIT",
  "TRANSMITTING",
] as const;
export type ElectronicInternalStatus =
  (typeof ELECTRONIC_INTERNAL_STATUSES)[number];

export const ELECTRONIC_INTERNAL_STATUS_LABELS: Record<
  ElectronicInternalStatus,
  string
> = {
  NOT_CONNECTED: "Connexion non configurée",
  READY: "Prêt pour transmission",
  TO_TRANSMIT: "À transmettre",
  TRANSMITTING: "Transmission en cours",
};

export type ElectronicConnectionState = {
  configured: boolean;
  provider: string | null;
  internalStatus: ElectronicInternalStatus;
  label: string;
  hint: string;
};

/**
 * Source de vérité actuelle : aucune PDP / PPF n’est branchée.
 * Quand un provider existera, ce helper lira settings / env — pas l’UI.
 */
export function getElectronicConnectionState(_orgId?: string): ElectronicConnectionState {
  return {
    configured: false,
    provider: null,
    internalStatus: "NOT_CONNECTED",
    label: "Connexion non configurée",
    hint: "Aucune plateforme agréée n’est branchée. Les statuts réglementaires (Dépôt, Rejet, Refus, Encaissée) apparaîtront uniquement après des événements réels.",
  };
}

export const ELECTRONIC_REFORM_MILESTONES = [
  {
    id: "receive-2026",
    at: "2026-09-01",
    title: "Réception obligatoire",
    detail: "Toutes les entreprises concernées doivent pouvoir recevoir des factures électroniques.",
  },
  {
    id: "emit-ge-2026",
    at: "2026-09-01",
    title: "Émission grandes entreprises & ETI",
    detail: "Obligation d’émettre au format électronique pour les grandes entreprises et ETI.",
  },
  {
    id: "emit-pme-2027",
    at: "2027-09-01",
    title: "Émission PME, TPE & micro",
    detail: "Obligation d’émettre au format électronique pour PME, TPE et micro-entreprises.",
  },
] as const;

/**
 * Événements de cycle de vie — contrat cible (pas encore persisté).
 * Une table ElectronicInvoiceEvent sera ajoutée quand un provider réel existera.
 */
export type ElectronicInvoiceEventDraft = {
  organizationId: string;
  invoiceId: string;
  status: ElectronicRegulatoryStatus | ElectronicInternalStatus;
  externalStatus?: string | null;
  occurredAt: Date;
  provider?: string | null;
  externalId?: string | null;
  message?: string | null;
  metadata?: Record<string, unknown> | null;
};
