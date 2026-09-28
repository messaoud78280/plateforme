/**
 * bework_technical_bundle_v1 — contrat ChatGPT (externe) → BeWork.
 * Phase A : schéma TypeScript uniquement (pas encore de parser / commit).
 * Aucune API IA.
 */

export const TECHNICAL_BUNDLE_FORMAT = "bework_technical_bundle_v1" as const;
export const TECHNICAL_SCHEMA_VERSION = "1.0" as const;

/** Types de source / preuve. */
export const TECHNICAL_SOURCE_TYPES = [
  "site_visit",
  "field_measurement",
  "plan",
  "photo",
  "client_statement",
  "technical_document",
  "quote",
  "user_input",
  "calculation",
  "assumption",
] as const;
export type TechnicalSourceType = (typeof TECHNICAL_SOURCE_TYPES)[number];

/** Classification d’une donnée technique. */
export const TECHNICAL_CLASSIFICATIONS = [
  "MEASURED",
  "OBSERVED",
  "DECLARED",
  "CALCULATED",
  "ESTIMATED",
  "ASSUMED",
  "TO_CONFIRM",
  "UNKNOWN",
  "NOT_APPLICABLE",
] as const;
export type TechnicalClassification = (typeof TECHNICAL_CLASSIFICATIONS)[number];

export const TECHNICAL_CONFIDENCES = [
  "confirmed",
  "to_confirm",
  "indicative",
  "unknown",
] as const;
export type TechnicalConfidence = (typeof TECHNICAL_CONFIDENCES)[number];

export const TECHNICAL_MEDIA_ORIGINS = [
  "terrain",
  "document",
  "illustration_demonstration",
] as const;
export type TechnicalMediaOrigin = (typeof TECHNICAL_MEDIA_ORIGINS)[number];

export const TECHNICAL_WORKING_DAYS = [
  "MON",
  "TUE",
  "WED",
  "THU",
  "FRI",
  "SAT",
  "SUN",
] as const;
export type TechnicalWorkingDay = (typeof TECHNICAL_WORKING_DAYS)[number];

/** Provenance attachée à une valeur. */
export type TechnicalProvenance = {
  source: TechnicalSourceType;
  source_ref?: string | null;
  confidence: TechnicalConfidence;
  classification?: TechnicalClassification;
  note?: string | null;
};

export type TechnicalSource = {
  id: string;
  type: TechnicalSourceType;
  label: string;
  filename?: string | null;
  plan_number?: string | null;
  revision?: string | null;
  date?: string | null;
  page?: number | null;
  chantier_file_id?: string | null;
  site_document_id?: string | null;
  site_visit_id?: string | null;
  media_id?: string | null;
  note?: string | null;
};

export type TechnicalFact = {
  id: string;
  text: string;
  provenance: TechnicalProvenance;
};

export type TechnicalMeasurement = {
  id: string;
  label: string;
  value: number | null;
  unit: string | null;
  provenance: TechnicalProvenance;
  /** Si value est null et classification UNKNOWN — ne pas inventer. */
  formula?: string | null;
};

export type TechnicalAssumption = {
  id: string;
  text: string;
  impact?: string | null;
  status?: "open" | "accepted" | "rejected";
};

export type TechnicalUnknown = {
  id: string;
  text: string;
  blocks?: Array<"takeoff" | "quote" | "schedule" | "execution">;
};

export type TechnicalLot = {
  code: string;
  label: string;
};

/** Quantités multi-rôles (progressif — technical suffit en V1 moteur). */
export type TechnicalQuantities = {
  geometric?: number | null;
  technical?: number | null;
  procurement?: number | null;
  quote?: number | null;
  planning?: number | null;
};

export type TechnicalTakeoffItem = {
  code: string;
  lot: string;
  sub_lot?: string | null;
  location?: string | null;
  designation: string;
  description?: string | null;
  unit: string;
  formula?: string | null;
  /** Quantité déclarée / nette retenue (compat prep). */
  quantity?: number | null;
  quantities?: TechnicalQuantities;
  role?: "quote" | "indicator" | "logistics";
  provenance?: TechnicalProvenance;
  assumptions?: string[];
  to_confirm?: string[];
  media_refs?: string[];
  plan_refs?: string[];
  warnings?: string[];
};

export type TechnicalParameter = {
  key: string;
  label: string;
  unit: string;
  value?: number | null;
  formula?: string | null;
  provenance?: TechnicalProvenance;
  hypothesis_id?: string | null;
  note?: string | null;
};

export type TechnicalWorkflowStep = {
  id: string;
  code?: string | null;
  lot?: string | null;
  order: number;
  name: string;
  description?: string | null;
  kind?: "work" | "control" | "wait";
  prerequisites?: string[];
  depends_on?: string[];
  takeoff_ids?: string[];
  controls?: string[];
  crew?: string[];
  /** Ressource logique exclusive (ex. ELEC-A). */
  crew_id?: string | null;
  crew_size?: number | null;
  workload_person_days?: number | null;
  parallelizable?: boolean;
  equipment?: string[];
  duration?: unknown;
};

export type TechnicalScheduleTask = {
  step_id: string;
  depends_on?: Array<{
    step_id: string;
    type?: "FS" | "SS" | "FF";
    lag_days?: number;
  }>;
  include_in_base?: boolean;
  crew_id?: string | null;
  parallelizable?: boolean;
};

export type TechnicalPlanningSettings = {
  /** Date civile YYYY-MM-DD ou null — jamais epoch / 1970. */
  start_date: string | null;
  /** Période floue ex. "2026-10" si pas de jour certain. */
  desired_start_period?: string | null;
  start_date_confidence?: TechnicalConfidence | null;
  start_date_source?: TechnicalSourceType | null;
  working_days?: TechnicalWorkingDay[];
  calendar?: "FR" | string;
};

export type TechnicalQuoteTransferIntent = {
  /** Toujours false à l’import technique sauf action UI ultérieure. */
  create_quote: boolean;
  selected_codes?: string[] | null;
  note?: string | null;
};

export type TechnicalMediaRef = {
  id: string;
  origin: TechnicalMediaOrigin;
  chantier_file_id?: string | null;
  site_visit_media_id?: string | null;
  caption?: string | null;
};

export type TechnicalBundleV1 = {
  format: typeof TECHNICAL_BUNDLE_FORMAT;
  schema_version: typeof TECHNICAL_SCHEMA_VERSION;
  bundle_id: string;
  source_revision?: number;
  mode?: "demonstration" | "professional";

  meta: {
    language?: string;
    generated_at?: string | null;
    generator?: string | null;
    title: string;
  };

  project: {
    external_ref?: string | null;
    title: string;
    address?: string | null;
    trade_hints?: string[];
    client_name?: string | null;
  };

  sources: TechnicalSource[];
  facts?: TechnicalFact[];
  measurements?: TechnicalMeasurement[];
  assumptions?: TechnicalAssumption[];
  unknowns?: TechnicalUnknown[];
  lots?: TechnicalLot[];

  takeoff: {
    parameters: TechnicalParameter[];
    items: TechnicalTakeoffItem[];
  };

  workflow?: { steps: TechnicalWorkflowStep[] } | null;
  schedule?: { tasks: TechnicalScheduleTask[]; note?: string | null } | null;
  planning_settings?: TechnicalPlanningSettings | null;
  quote_transfer?: TechnicalQuoteTransferIntent | null;

  documents?: {
    plan_refs?: string[];
    file_refs?: string[];
  } | null;
  media?: TechnicalMediaRef[];
  controls?: Array<{ id: string; text: string; step_id?: string | null }>;
  warnings?: string[];
  disclaimers?: string[];
};

/** Jours ouvrés FR par défaut (planning_settings). */
export const DEFAULT_PLANNING_WORKING_DAYS: TechnicalWorkingDay[] = [
  "MON",
  "TUE",
  "WED",
  "THU",
  "FRI",
];

/**
 * Mapping classification technique → provenance PrepStudy importée.
 * UNKNOWN ne produit pas de valeur numérique.
 */
export function classificationToPrepProvenance(
  c: TechnicalClassification | null | undefined,
): "RELEVE" | "RELEVE_A_VERIFIER" | "HYPOTHESE" | null {
  switch (c) {
    case "MEASURED":
      return "RELEVE";
    case "OBSERVED":
    case "DECLARED":
    case "TO_CONFIRM":
      return "RELEVE_A_VERIFIER";
    case "ESTIMATED":
    case "ASSUMED":
      return "HYPOTHESE";
    case "CALCULATED":
      return null; // dérivé moteur
    case "UNKNOWN":
    case "NOT_APPLICABLE":
    default:
      return null;
  }
}
