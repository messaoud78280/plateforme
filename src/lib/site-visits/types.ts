/**
 * VISITES-METRES-2 — Labels, options terrain & contraintes structurées.
 * Stockage : SiteVisit.constraintsJson (pas de second module).
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

export const VISIT_STEPS = [
  { id: "infos", label: "Informations", short: "Infos" },
  { id: "metres", label: "Métrés", short: "Métrés" },
  { id: "existant", label: "État existant", short: "Existant" },
  { id: "logistique", label: "Accès & logistique", short: "Accès" },
  { id: "medias", label: "Photos & documents", short: "Médias" },
  { id: "synthese", label: "Synthèse", short: "Synthèse" },
] as const;

export type VisitStepId = (typeof VISIT_STEPS)[number]["id"];

export type SiteVisitConstraints = {
  /** Facile | Moyen | Difficile */
  accessLevel?: string | null;
  access?: string[];
  occupation?: string[];
  /** Bon | Moyen | Dégradé | Très dégradé | À confirmer */
  supportState?: string | null;
  supportObservations?: string[];
  /**
   * Diagnostic fourni | Diagnostic à demander |
   * Présence potentielle à vérifier | Non concerné selon documents disponibles
   */
  asbestosStatus?: string | null;
  waste?: string[];
  means?: string[];
  /** Simple | Standard | Complexe */
  estimatedDifficulty?: string | null;
  otherComment?: string | null;
};

export const ACCESS_LEVEL_OPTIONS = ["Facile", "Moyen", "Difficile"] as const;

export const ACCESS_OPTIONS = [
  "Étage",
  "Ascenseur",
  "Escalier",
  "Accès toiture",
  "Accès camion",
  "Stationnement difficile",
  "Zone piétonne",
  "Accès nacelle",
  "Échafaudage",
  "Grutage",
  "Stockage limité",
] as const;

/** Compat V1 → normalisé vers ACCESS_OPTIONS / accessLevel */
export const ACCESS_OPTIONS_LEGACY = [
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
  "Bureaux occupés",
  "Public présent",
  "Intervention de nuit",
  "Horaires imposés",
  "Nuisances à limiter",
] as const;

export const SUPPORT_STATE_OPTIONS = [
  "Bon",
  "Moyen",
  "Dégradé",
  "Très dégradé",
  "À confirmer",
] as const;

export const SUPPORT_OBSERVATION_OPTIONS = [
  "Fissures",
  "Humidité",
  "Décollement",
  "Corrosion",
  "Infiltration",
  "Support instable",
  "Ancien revêtement",
  "Protection existante",
] as const;

/** Jamais « pas d’amiante » sur observation visuelle seule. */
export const ASBESTOS_STATUS_OPTIONS = [
  "Diagnostic fourni",
  "Diagnostic à demander",
  "Présence potentielle à vérifier",
  "Non concerné selon documents disponibles",
] as const;

export const WASTE_OPTIONS = [
  "Évacuation à prévoir",
  "Benne nécessaire",
  "Descente manuelle",
  "Stockage temporaire possible",
  "Tri spécifique",
  "Non concerné",
] as const;

export const MEANS_OPTIONS = [
  "Nacelle",
  "Échafaudage",
  "Grue",
  "Monte-charge",
  "Protection des parties communes",
  "Balisage",
  "Confinement",
  "Protection toiture",
  "Autre",
] as const;

export const DIFFICULTY_OPTIONS = ["Simple", "Standard", "Complexe"] as const;

export function normalizeConstraints(raw: unknown): SiteVisitConstraints {
  if (!raw || typeof raw !== "object") return {};
  const c = raw as SiteVisitConstraints & { access?: string[] };
  const access = [...(c.access ?? [])];
  let accessLevel = c.accessLevel ?? null;

  // Migration douce des chips V1
  if (access.includes("Normal") && !accessLevel) accessLevel = "Facile";
  if (access.includes("Accès difficile") && !accessLevel) accessLevel = "Difficile";
  const mappedAccess = access
    .map((a) => {
      if (a === "Échafaudage possible/nécessaire") return "Échafaudage";
      if (a === "Nacelle possible/nécessaire") return "Accès nacelle";
      if (a === "Grutage à prévoir") return "Grutage";
      if (a === "Normal" || a === "Accès difficile") return null;
      return a;
    })
    .filter((x): x is string => Boolean(x));

  return {
    accessLevel,
    access: [...new Set(mappedAccess)],
    occupation: c.occupation ?? [],
    supportState: c.supportState ?? null,
    supportObservations: c.supportObservations ?? [],
    asbestosStatus: c.asbestosStatus ?? null,
    waste: c.waste ?? [],
    means: c.means ?? [],
    estimatedDifficulty: c.estimatedDifficulty ?? null,
    otherComment: c.otherComment ?? null,
  };
}
