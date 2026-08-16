/**
 * VISITES-METRES-1 — Labels & contraintes checklist.
 */
import type { SiteVisitStatus } from "@prisma/client";

export const SITE_VISIT_STATUS_LABELS: Record<SiteVisitStatus, string> = {
  TO_PLAN: "À planifier",
  SCHEDULED: "Visite prévue",
  IN_PROGRESS: "Relevé en cours",
  INCOMPLETE: "Incomplète",
  READY_TO_QUOTE: "Prête à chiffrer",
  TRANSMITTED: "Transmise au devis",
  CANCELLED: "Annulée",
};

export const SITE_VISIT_FILTERS = [
  { id: "TO_PLAN", label: "À planifier" },
  { id: "SCHEDULED", label: "Visites prévues" },
  { id: "IN_PROGRESS", label: "Relevés en cours" },
  { id: "INCOMPLETE", label: "Incomplets" },
  { id: "READY_TO_QUOTE", label: "Prêts à chiffrer" },
  { id: "TRANSMITTED", label: "Transmis au devis" },
] as const;

export type SiteVisitConstraints = {
  access?: string[];
  occupation?: string[];
  supportState?: string | null;
  otherComment?: string | null;
};

export const ACCESS_OPTIONS = [
  "Normal",
  "Accès difficile",
  "Échafaudage possible/nécessaire",
  "Nacelle possible/nécessaire",
  "Grutage à prévoir",
  "Stockage limité",
] as const;

export const OCCUPATION_OPTIONS = [
  "Site occupé",
  "Copropriété",
  "Présence du public",
  "Horaires imposés",
] as const;

export const SUPPORT_STATE_OPTIONS = ["Bon", "Moyen", "Dégradé", "À vérifier"] as const;
