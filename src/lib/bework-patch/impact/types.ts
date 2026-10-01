/**
 * BeWork Impact Engine V1 — types (Phase D, lecture seule).
 */
import type { BeworkPatchSection, CanonicalResolution } from "@/lib/bework-patch/types";
import type { BeworkPatchIssue } from "@/lib/bework-patch/errors";

export type ImpactCertainty = "CERTAIN" | "PARTIAL" | "POTENTIAL" | "NONE";

export type QuoteLinkClass =
  | "LINKED_STANDARD"
  | "LIKELY_OVERRIDE"
  | "UNLINKED"
  | "PROTECTED";

export type DirectChange = {
  op: string;
  section: BeworkPatchSection;
  entityType: string;
  entityId: string | null;
  label: string;
  field: string;
  before: unknown;
  after: unknown;
  unit?: string | null;
};

export type DerivedChange = {
  section: "TAKEOFF" | "QUOTE" | "PLANNING";
  entityType: string;
  entityId: string | null;
  label: string;
  field: string;
  before: unknown;
  after: unknown;
  unit?: string | null;
  certainty: ImpactCertainty;
  reason: string;
  /** true = ne sera pas propagé automatiquement (override / protected / unresolved). */
  blocked?: boolean;
  blockReason?: string | null;
  quoteLinkClass?: QuoteLinkClass;
};

export type ImpactGraphNode = {
  entityType: string;
  id: string;
  label: string;
  relationType: string | null;
  confidence: ImpactCertainty;
  mutable: boolean;
  protected: boolean;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  children?: ImpactGraphNode[];
};

export type OverrideFlag = {
  quoteLineId: string;
  quoteId: string;
  quoteNumber: string;
  label: string;
  kind: "LIKELY_OVERRIDE";
  metreQty: number | null;
  transferQty: number;
  currentQty: number;
  message: string;
};

export type ProtectedEntity = {
  section: "QUOTE" | "PLANNING" | "TAKEOFF";
  entityType: string;
  id: string;
  label: string;
  reason: string;
  /** Écart potentiel (ex. quantité métré vs devis ACCEPTED) sans écraser. */
  gap?: { field: string; current: unknown; wouldBe: unknown; unit?: string | null };
};

export type AffectedEntity = {
  section: "TAKEOFF" | "QUOTE" | "PLANNING";
  entityType: string;
  id: string;
  label: string;
  certainty: ImpactCertainty;
};

export type ImpactSummary = {
  affectedSections: Array<"TAKEOFF" | "QUOTE" | "PLANNING">;
  simulationOnly: true;
  canPropagate: false;
  certainCount: number;
  partialCount: number;
  potentialCount: number;
  protectedCount: number;
  overrideCount: number;
};

export type AnalyzePatchImpactResult = {
  directChanges: DirectChange[];
  canonicalResolution: CanonicalResolution;
  derivedChanges: DerivedChange[];
  affectedEntities: AffectedEntity[];
  protectedEntities: ProtectedEntity[];
  overrides: OverrideFlag[];
  warnings: BeworkPatchIssue[];
  errors: BeworkPatchIssue[];
  impactSummary: ImpactSummary;
  graph: ImpactGraphNode[];
};

/** Snapshot mémoire — sous-graphe uniquement. */
export type ImpactParam = {
  id: string;
  key: string;
  label: string;
  value: number | null;
  unit: string;
  formula: string | null;
};

export type ImpactLine = {
  id: string;
  code: string;
  designation: string;
  unit: string;
  formula: string | null;
  declaredQuantity: number | null;
  role: string;
};

export type ImpactQuoteLine = {
  id: string;
  designation: string;
  quantity: number;
  unit: string;
  unitSellHt: number;
  discountPercent: number;
  vatRate: number;
  kind?: string;
};

export type ImpactQuote = {
  id: string;
  number: string;
  status: string;
  /** versionNumber de CommercialQuoteVersion courante (DRAFT in-place = stable). */
  versionNumber: number;
  versionId: string;
  lines: ImpactQuoteLine[];
};

export type ImpactQuoteLink = {
  id: string;
  studyId: string;
  studyLineCode: string;
  quoteId: string;
  quoteLineId: string;
  quantityAtTransfer: number;
};

export type ImpactScheduleTask = {
  id: string;
  stepCode: string;
  name: string;
  description?: string | null;
  durationDays: number;
  durationMode: string;
  durationLockedByUser: boolean;
  driverTakeoffCode: string | null;
  quantitySnapshot: number | null;
  quantityUnit: string | null;
  rateValue: number | null;
  parallelUnits: number;
  startDate: string | null;
  endDate: string | null;
  dependsOnStepCodes: string[];
  lot: string | null;
};

export type ImpactPlan = {
  id: string;
  title: string;
  startDate: string | null;
  endDateBase: string | null;
  baseDurationWorkingDays: number | null;
  revisionNumber: number;
  /** CTX-04 / CTX-02A — alignement métré source. */
  studyVersionAtGeneration: number | null;
  tasks: ImpactScheduleTask[];
  takeoffLinks: Array<{ taskId: string; studyLineCode: string }>;
};

export type ImpactStudy = {
  id: string;
  title: string;
  version: number;
  params: ImpactParam[];
  lines: ImpactLine[];
};

export type ImpactVisit = {
  id: string;
  projectId: string | null;
  subject: string;
  status: string;
  clientName: string;
  siteAddress: string;
  clientNeed: string | null;
  comments: string | null;
  /** Empreinte CTX-07 au moment du chargement. */
  contextVersion: number;
};

export type ImpactFollowUp = {
  id: string;
  projectId: string | null;
  title: string;
  status: string;
  notes: string | null;
  prepSchedulePlanId: string | null;
  /** Empreinte CTX-02C au moment du chargement. */
  contextVersion: number;
};

export type ImpactSubgraph = {
  projectId: string;
  study: ImpactStudy | null;
  quotes: ImpactQuote[];
  quoteLinks: ImpactQuoteLink[];
  plans: ImpactPlan[];
  visit: ImpactVisit | null;
  followUp: ImpactFollowUp | null;
};

export function emptySubgraph(projectId: string): ImpactSubgraph {
  return {
    projectId,
    study: null,
    quotes: [],
    quoteLinks: [],
    plans: [],
    visit: null,
    followUp: null,
  };
}
