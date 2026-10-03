/**
 * Snapshot chantier canonique — lecture seule.
 * Source de vérité interne pour les contextes ChatGPT (CTX-01).
 * N’invente jamais de données métier absentes.
 */

export const PROJECT_CONTEXT_FORMAT = "bework_project_context_v1" as const;
export const PROJECT_CONTEXT_SCHEMA_VERSION = 1 as const;

export type ProjectContextProvenanceKind =
  | "MEASURE"
  | "PLAN"
  | "CALCULATION"
  | "HYPOTHESIS"
  | "MANUAL"
  | "UNKNOWN";

/** Référence fichier GED — pas de binaire. */
export type ProjectContextFileRef = {
  id: string;
  name: string;
  documentType: string | null;
  mimeType: string | null;
  status: string;
  indice: string | null;
  versionLabel: string | null;
  documentDate: string | null;
  category: string | null;
  hasUrl: boolean;
  previewHref: string;
};

export type ProjectContextSource = {
  id: string;
  studyId: string | null;
  scopeId: string | null;
  filename: string | null;
  planNumber: string | null;
  title: string | null;
  revision: string | null;
  scale: string | null;
  page: number | null;
  legibility: string | null;
  note: string | null;
  chantierFileId: string | null;
  file: ProjectContextFileRef | null;
  displayTitle: string;
};

export type ProjectContextScope = {
  id: string;
  code: string;
  name: string;
  status: string;
  displayOrder: number;
  referenceStudyId: string | null;
  referenceQuoteId: string | null;
  referenceSchedulePlanId: string | null;
};

export type ProjectContextVisitMeasurement = {
  id: string;
  zone: string | null;
  label: string;
  measureType: string | null;
  unit: string;
  lengthM: number | null;
  widthM: number | null;
  heightM: number | null;
  quantityValue: number | null;
  computedQuantity: number;
  lot: string | null;
  observation: string | null;
};

export type ProjectContextVisitMediaRef = {
  id: string;
  name: string | null;
  kind: string | null;
  category: string | null;
  observation: string | null;
  hasUrl: boolean;
};

export type ProjectContextVisit = {
  id: string;
  subject: string;
  status: string;
  clientName: string;
  siteAddress: string;
  clientNeed: string | null;
  comments: string | null;
  projectId: string | null;
  commercialQuoteId: string | null;
  /**
   * CTX-07 — version dérivée de l’état ChatGPT (SHA-256 → uint48).
   * Remplace HARDCODED_LEGACY_V1. Entier ≥ 1 compatible base_version.
   */
  contextVersion: number;
  updatedAt: string;
  measurements: ProjectContextVisitMeasurement[];
  mediaRefs: ProjectContextVisitMediaRef[];
};

export type ProjectContextParameter = {
  id: string;
  key: string;
  label: string;
  unit: string;
  value: number | null;
  formula: string | null;
  provenance: string | null;
  provenanceKind: ProjectContextProvenanceKind;
  note: string | null;
  sourceRef?: string | null;
  hypothesisId?: string | null;
};

export type ProjectContextTakeoffLine = {
  id: string;
  code: string;
  lot: string;
  designation: string;
  unit: string;
  formula: string | null;
  declaredQuantity: number | null;
  computedQuantity: number | null;
  validatedQuantity: number | null;
  provenance: string | null;
  provenanceKind: ProjectContextProvenanceKind;
  role: string;
};

export type ProjectContextTakeoff = {
  id: string;
  title: string;
  trade: string | null;
  mode: string;
  dossierStatus: string;
  version: number;
  scopeId: string | null;
  sourceFormat: string | null;
  hypothesesJson: unknown;
  sources: ProjectContextSource[];
  parameters: ProjectContextParameter[];
  lines: ProjectContextTakeoffLine[];
  updatedAt: string;
};

export type ProjectContextQuoteLine = {
  id: string;
  sectionId: string | null;
  designation: string;
  quantity: number;
  unit: string;
  unitSellHt: number;
  lineSellHt: number;
  studyLineCode: string | null;
};

export type ProjectContextQuoteSection = {
  id: string;
  title: string;
  sortOrder: number;
  lines: ProjectContextQuoteLine[];
};

export type ProjectContextQuoteTransfer = {
  id: string;
  studyId: string;
  studyVersion: number;
  createdAt: string;
};

export type ProjectContextQuote = {
  id: string;
  number: string;
  subject: string;
  status: string;
  isDemonstration: boolean;
  scopeId: string | null;
  sourcePrepStudyId: string | null;
  versionNumber: number | null;
  totalSellHt: number;
  totalTtc: number;
  /** Devis de référence d’un scope (si applicable). */
  isScopeReference: boolean;
  transfer: ProjectContextQuoteTransfer | null;
  sections: ProjectContextQuoteSection[];
  updatedAt: string;
};

export type ProjectContextScheduleTask = {
  id: string;
  stepCode: string | null;
  name: string;
  durationDays: number;
  lot: string | null;
  startDate: string | null;
  endDate: string | null;
  takeoffLineCodes: string[];
  quoteLineIds: string[];
};

export type ProjectContextSchedule = {
  id: string;
  title: string;
  status: string;
  revisionKind: string;
  revisionNumber: number;
  studyId: string | null;
  scopeId: string | null;
  studyVersionAtGeneration: number | null;
  startDate: string | null;
  endDateBase: string | null;
  baseDurationWorkingDays: number | null;
  tasks: ProjectContextScheduleTask[];
  updatedAt: string;
};

export type ProjectContextFollowUp = {
  id: string;
  title: string;
  status: string;
  prepSchedulePlanId: string | null;
  notes: string | null;
  updatedAt: string;
};

export type ProjectContextDocument = {
  id: string;
  kind: string;
  title: string;
  number: string;
  status: string;
  versionNumber: number;
  updatedAt: string;
};

export type ProjectContextOrganization = {
  id: string;
  name: string;
};

export type ProjectContextProject = {
  id: string;
  title: string;
  description: string | null;
  siteAddress: string | null;
  siteCity: string | null;
  chantierStatus: string;
  status: string;
  plannedStartDate: string | null;
  plannedEndDate: string | null;
  updatedAt: string;
};

export type ProjectContextVersions = {
  takeoffVersions: Array<{ studyId: string; version: number }>;
  quoteVersions: Array<{ quoteId: string; versionNumber: number | null }>;
  planRevisions: Array<{
    planId: string;
    revisionNumber: number;
    studyVersionAtGeneration: number | null;
  }>;
};

export type ProjectContextSnapshot = {
  type: typeof PROJECT_CONTEXT_FORMAT;
  schema_version: typeof PROJECT_CONTEXT_SCHEMA_VERSION;
  generatedAt: string;
  organization: ProjectContextOrganization;
  project: ProjectContextProject;
  scopes: ProjectContextScope[];
  sources: ProjectContextSource[];
  visits: ProjectContextVisit[];
  takeoffs: ProjectContextTakeoff[];
  quotes: ProjectContextQuote[];
  schedules: ProjectContextSchedule[];
  followUps: ProjectContextFollowUp[];
  documents: {
    notices: ProjectContextDocument[];
    reports: ProjectContextDocument[];
    other: ProjectContextDocument[];
  };
  versions: ProjectContextVersions;
};
