/**
 * bework_patch_v1 — contrat universel de modification BeWork.
 * Distinct de bework_technical_bundle_v1 (création / import étude).
 * Phase B : schéma + parser + validation — aucune écriture DB.
 */

export const BEWORK_PATCH_FORMAT = "bework_patch_v1" as const;
export const BEWORK_PATCH_SCHEMA_VERSION = 1 as const;

export const BEWORK_CONTEXT_FORMAT = "bework_chatgpt_context_v1" as const;
export const BEWORK_CONTEXT_SCHEMA_VERSION = 1 as const;

/** Section d’origine / périmètre. */
export const BEWORK_PATCH_SECTIONS = [
  "VISIT",
  "TAKEOFF",
  "QUOTE",
  "PLANNING",
  "FOLLOW_UP",
  "REPORT",
  "NOTICE",
] as const;
export type BeworkPatchSection = (typeof BEWORK_PATCH_SECTIONS)[number];

/** Nature métier de la modification. */
export const BEWORK_CHANGE_INTENTS = [
  "TECHNICAL_CORRECTION",
  "COMMERCIAL_ADJUSTMENT",
  "FIELD_UPDATE",
  "PLANNING_ADJUSTMENT",
  "PROGRESS_UPDATE",
  "DOCUMENT_EDIT",
  "ADMINISTRATIVE_UPDATE",
  "TECHNICAL_OVERRIDE",
] as const;
export type BeworkChangeIntent = (typeof BEWORK_CHANGE_INTENTS)[number];

/** Types d’entité ciblables. */
export const BEWORK_ENTITY_TYPES = [
  "SITE_VISIT",
  "SITE_VISIT_MEASUREMENT",
  "PREP_STUDY",
  "PREP_PARAMETER",
  "PREP_LINE",
  "PREP_HYPOTHESIS",
  "COMMERCIAL_QUOTE",
  "QUOTE_ITEM",
  "QUOTE_SECTION",
  "PREP_SCHEDULE_PLAN",
  "PREP_SCHEDULE_TASK",
  "FOLLOW_UP_SHEET",
  "SITE_DOCUMENT",
] as const;
export type BeworkEntityType = (typeof BEWORK_ENTITY_TYPES)[number];

/**
 * Niveau de résolution de la donnée canonique.
 * Ne jamais inventer un paramètre / ID sur similarité texte.
 */
export const CANONICAL_RESOLUTION_STATUSES = ["EXACT", "PARTIAL", "NONE"] as const;
export type CanonicalResolutionStatus = (typeof CANONICAL_RESOLUTION_STATUSES)[number];

export type CanonicalResolution = {
  status: CanonicalResolutionStatus;
  /** Ex. TAKEOFF_LINE, PREP_PARAMETER, QUOTE_ITEM */
  resolved_to: string | null;
  /** Rempli uniquement si EXACT et connu de façon certaine. */
  parameter_id?: string | null;
  parameter_key?: string | null;
  study_line_code?: string | null;
  note?: string | null;
};

export type BeworkPatchOrigin = {
  section: BeworkPatchSection;
  project_id: string;
  entity_id: string;
  base_version: number;
};

/** Target générique — IDs + codes stables optionnels. */
export type BeworkPatchTargetBase = {
  entity_type: BeworkEntityType;
  id?: string | null;
  code?: string | null;
  project_id?: string | null;
  study_id?: string | null;
  quote_id?: string | null;
  plan_id?: string | null;
  visit_id?: string | null;
  document_id?: string | null;
  /** Alias métier fréquents */
  parameter_id?: string | null;
  parameter_key?: string | null;
  line_id?: string | null;
  line_code?: string | null;
  item_id?: string | null;
  section_id?: string | null;
  task_id?: string | null;
  step_code?: string | null;
  measurement_id?: string | null;
};

/* ─── Operations (discriminated union) ─── */

export type OpUpdateParameter = {
  op: "update_parameter";
  target: BeworkPatchTargetBase & {
    entity_type: "PREP_PARAMETER";
    study_id: string;
  };
  changes: {
    value?: number | null;
    label?: string;
    note?: string | null;
  };
};

export type OpUpdateLine = {
  op: "update_line";
  target: BeworkPatchTargetBase & {
    entity_type: "PREP_LINE";
    study_id: string;
  };
  changes: {
    designation?: string;
    description?: string | null;
    declared_quantity?: number | null;
    unit?: string;
    lot?: string;
    notes?: string | null;
  };
};

export type OpAddLine = {
  op: "add_line";
  target: BeworkPatchTargetBase & {
    entity_type: "PREP_STUDY";
    study_id: string;
  };
  line: {
    code: string;
    lot: string;
    designation: string;
    unit: string;
    formula?: string | null;
    declared_quantity?: number | null;
    description?: string | null;
  };
  insert_after_code?: string | null;
};

export type OpDeleteLine = {
  op: "delete_line";
  target: BeworkPatchTargetBase & {
    entity_type: "PREP_LINE";
    study_id: string;
  };
};

export type OpUpdateHypothesis = {
  op: "update_hypothesis";
  target: BeworkPatchTargetBase & {
    entity_type: "PREP_HYPOTHESIS";
    study_id: string;
    id: string;
  };
  changes: {
    statement?: string;
    reason?: string | null;
  };
};

export type OpUpdateQuoteItem = {
  op: "update_quote_item";
  target: BeworkPatchTargetBase & {
    entity_type: "QUOTE_ITEM";
    quote_id: string;
  };
  changes: {
    designation?: string;
    description?: string | null;
    quantity?: number;
    unit?: string;
    unit_price_ht?: number;
    vat_rate?: number;
    discount_percent?: number;
  };
};

export type OpAddQuoteItem = {
  op: "add_quote_item";
  target: BeworkPatchTargetBase & {
    entity_type: "COMMERCIAL_QUOTE" | "QUOTE_SECTION";
    quote_id: string;
  };
  item: {
    designation: string;
    description?: string | null;
    quantity: number;
    unit: string;
    unit_price_ht: number;
    vat_rate?: number | null;
    discount_percent?: number | null;
    item_id?: string | null;
  };
  section_id?: string | null;
  section_title?: string | null;
};

export type OpDeleteQuoteItem = {
  op: "delete_quote_item";
  target: BeworkPatchTargetBase & {
    entity_type: "QUOTE_ITEM";
    quote_id: string;
  };
};

export type OpUpdateQuoteSection = {
  op: "update_quote_section";
  target: BeworkPatchTargetBase & {
    entity_type: "QUOTE_SECTION";
    quote_id: string;
  };
  changes: { title: string };
};

export type OpUpdateQuoteMeta = {
  op: "update_quote_meta";
  target: BeworkPatchTargetBase & {
    entity_type: "COMMERCIAL_QUOTE";
    quote_id: string;
  };
  changes: {
    subject?: string;
    client_notes?: string;
    internal_notes?: string;
    payment_terms?: string;
  };
};

export type OpUpdateTask = {
  op: "update_task";
  target: BeworkPatchTargetBase & {
    entity_type: "PREP_SCHEDULE_TASK";
    plan_id: string;
  };
  changes: {
    name?: string;
    description?: string | null;
    lot?: string | null;
  };
};

export type OpUpdateDuration = {
  op: "update_duration";
  target: BeworkPatchTargetBase & {
    entity_type: "PREP_SCHEDULE_TASK";
    plan_id: string;
  };
  changes: {
    duration_days: number;
  };
};

export type OpUpdateProductivity = {
  op: "update_productivity";
  target: BeworkPatchTargetBase & {
    entity_type: "PREP_SCHEDULE_TASK";
    plan_id: string;
  };
  changes: {
    rate_id?: string | null;
    rate_value?: number | null;
    parallel_units?: number;
  };
};

export type OpUpdateCrew = {
  op: "update_crew";
  target: BeworkPatchTargetBase & {
    entity_type: "PREP_SCHEDULE_TASK";
    plan_id: string;
  };
  changes: {
    crew_id?: string | null;
    crew_size?: number | null;
    parallelizable?: boolean;
  };
};

export type OpUpdateDependency = {
  op: "update_dependency";
  target: BeworkPatchTargetBase & {
    entity_type: "PREP_SCHEDULE_TASK";
    plan_id: string;
  };
  changes: {
    depends_on: Array<{
      step_id: string;
      type?: "FS" | "SS" | "FF";
      lag_days?: number;
    }>;
  };
};

export type OpUpdateStartDate = {
  op: "update_start_date";
  target: BeworkPatchTargetBase & {
    entity_type: "PREP_SCHEDULE_PLAN";
    plan_id: string;
  };
  changes: {
    start_date: string | null;
  };
};

export type OpUpdateWorkload = {
  op: "update_workload";
  target: BeworkPatchTargetBase & {
    entity_type: "PREP_SCHEDULE_TASK";
    plan_id: string;
  };
  changes: {
    workload_person_days?: number | null;
  };
};

export type OpAddTask = {
  op: "add_task";
  target: BeworkPatchTargetBase & {
    entity_type: "PREP_SCHEDULE_PLAN";
    plan_id: string;
  };
  task: {
    step_code: string;
    name: string;
    duration_days: number;
    lot?: string | null;
    crew_id?: string | null;
  };
};

export type OpRemoveTask = {
  op: "remove_task";
  target: BeworkPatchTargetBase & {
    entity_type: "PREP_SCHEDULE_TASK";
    plan_id: string;
  };
};

/** CTX-02B — champs texte SiteVisit (whitelist). */
export type OpUpdateVisit = {
  op: "update_visit";
  target: BeworkPatchTargetBase & {
    entity_type: "SITE_VISIT";
    visit_id: string;
  };
  changes: {
    subject?: string;
    client_need?: string | null;
    comments?: string | null;
  };
};

export type OpUpdateMeasurement = {
  op: "update_measurement";
  target: BeworkPatchTargetBase & {
    entity_type: "SITE_VISIT_MEASUREMENT";
    visit_id: string;
  };
  changes: {
    label?: string;
    length_m?: number | null;
    width_m?: number | null;
    height_m?: number | null;
    quantity_value?: number | null;
    unit?: string;
    observation?: string | null;
  };
};

export type OpAddMeasurement = {
  op: "add_measurement";
  target: BeworkPatchTargetBase & {
    entity_type: "SITE_VISIT";
    visit_id: string;
  };
  measurement: {
    label: string;
    unit: string;
    length_m?: number | null;
    width_m?: number | null;
    height_m?: number | null;
    quantity_value?: number | null;
    observation?: string | null;
  };
};

export type OpUpdateProgress = {
  op: "update_progress";
  target: BeworkPatchTargetBase & {
    entity_type: "FOLLOW_UP_SHEET" | "PREP_SCHEDULE_TASK";
  };
  changes: {
    progress_percent?: number;
    status?: string;
    actual_quantity?: number | null;
    note?: string | null;
  };
};

export type OpUpdateDocumentSection = {
  op: "update_document_section";
  target: BeworkPatchTargetBase & {
    entity_type: "SITE_DOCUMENT";
    document_id: string;
  };
  changes: {
    section_key?: string;
    title?: string;
    text?: string;
  };
};

export type OpAddDocumentSection = {
  op: "add_document_section";
  target: BeworkPatchTargetBase & {
    entity_type: "SITE_DOCUMENT";
    document_id: string;
  };
  section: {
    key?: string;
    title: string;
    text?: string;
  };
};

export type OpUpdateText = {
  op: "update_text";
  target: BeworkPatchTargetBase & {
    entity_type: "SITE_DOCUMENT" | "FOLLOW_UP_SHEET";
  };
  changes: {
    field: string;
    text: string;
  };
};

export type BeworkPatchOperation =
  | OpUpdateParameter
  | OpUpdateLine
  | OpAddLine
  | OpDeleteLine
  | OpUpdateHypothesis
  | OpUpdateQuoteItem
  | OpAddQuoteItem
  | OpDeleteQuoteItem
  | OpUpdateQuoteSection
  | OpUpdateQuoteMeta
  | OpUpdateTask
  | OpUpdateDuration
  | OpUpdateProductivity
  | OpUpdateCrew
  | OpUpdateDependency
  | OpUpdateStartDate
  | OpUpdateWorkload
  | OpAddTask
  | OpRemoveTask
  | OpUpdateVisit
  | OpUpdateMeasurement
  | OpAddMeasurement
  | OpUpdateProgress
  | OpUpdateDocumentSection
  | OpAddDocumentSection
  | OpUpdateText;

export type BeworkPatchOpName = BeworkPatchOperation["op"];

export type BeworkPatchV1 = {
  type: typeof BEWORK_PATCH_FORMAT;
  schema_version: typeof BEWORK_PATCH_SCHEMA_VERSION;
  patch_id: string;
  origin: BeworkPatchOrigin;
  change_intent: BeworkChangeIntent;
  reason: string | null;
  operations: BeworkPatchOperation[];
};

/* ─── Context v1 ─── */

export type BeworkContextRelationshipQuoteItem = {
  quote_item_id: string;
  takeoff_link?: {
    study_id: string;
    study_line_code: string;
  } | null;
  schedule_links?: Array<{
    plan_id: string;
    task_id: string;
    step_code?: string | null;
  }>;
  canonical_resolution: CanonicalResolution;
};

export type BeworkSupportedOperationSpec = {
  op: BeworkPatchOpName;
  entity_types: BeworkEntityType[];
  allowed_change_fields?: string[];
  compatible_intents: BeworkChangeIntent[];
};

export type BeworkChatgptContextV1 = {
  type: typeof BEWORK_CONTEXT_FORMAT;
  schema_version: typeof BEWORK_CONTEXT_SCHEMA_VERSION;
  section: BeworkPatchSection;
  project: {
    id: string;
    title: string;
    /** Champs additifs CTX-08 (rétrocompatibles). */
    description?: string | null;
    site_address?: string | null;
    site_city?: string | null;
    status?: string | null;
    chantier_status?: string | null;
  };
  /** Organisation du chantier — additif CTX-08. */
  organization?: {
    id: string;
    name: string;
  };
  /** Scope / lot ciblé — additif CTX-08 (TAKEOFF). */
  scope?: {
    id: string;
    code: string;
    name: string;
    status?: string | null;
  } | null;
  target: {
    entity_type: BeworkEntityType;
    id: string;
    version: number;
    code?: string | null;
    /** Alias explicite pour base_version patch — additif CTX-08. */
    base_version?: number;
  };
  data: Record<string, unknown>;
  relationships: {
    quote_items?: BeworkContextRelationshipQuoteItem[];
    takeoff_lines?: Array<{
      study_id: string;
      line_code: string;
      parameter_keys?: string[];
      canonical_resolution?: CanonicalResolution;
    }>;
    schedule_tasks?: Array<{
      plan_id: string;
      task_id: string;
      step_code: string;
      study_line_codes?: string[];
    }>;
    notes?: string[];
  };
  supported_change_intents: BeworkChangeIntent[];
  supported_operations: BeworkSupportedOperationSpec[];
  expected_output: typeof BEWORK_PATCH_FORMAT;
};
