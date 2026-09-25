/**
 * bework_prep_patch_v1 — modifications ciblées d'une étude de métré existante.
 * Distinct de bework_prep_bundle_v1 (import complet).
 * S'inspire de bework_quote_patch_v1 (devis) sans dépendre du module commercial.
 */

import type {
  LineNature,
  LineRole,
  PrepTechnicalReference,
  StoredProvenance,
} from "@/lib/preparation/types";

export const PREP_PATCH_FORMAT = "bework_prep_patch_v1" as const;

export type PrepPatchOpType =
  | "update_parameter"
  | "update_line"
  | "add_line"
  | "delete_line"
  | "update_hypothesis"
  | "update_study"
  | "update_workflow"
  | "update_resources";

export type PrepPatchParameterChanges = {
  value?: number | null;
  label?: string;
  note?: string | null;
  provenance?: StoredProvenance;
};

export type PrepPatchLineChanges = {
  designation?: string;
  description?: string | null;
  technicalDescription?: string | null;
  includedServices?: string[];
  technicalReferences?: PrepTechnicalReference[];
  executionNotes?: string | null;
  qualityControls?: string[];
  technicalReservations?: string[];
  notes?: string | null;
  justification?: string | null;
  /** Quantité saisie manuelle — refusée si la ligne a une formule. */
  declaredQuantity?: number | null;
  provenance?: StoredProvenance;
  role?: LineRole;
  nature?: LineNature | null;
  lot?: string;
  subLot?: string | null;
};

export type PrepPatchLinePayload = {
  code: string;
  lot: string;
  subLot?: string | null;
  designation: string;
  description?: string | null;
  technicalDescription?: string | null;
  includedServices?: string[];
  technicalReferences?: PrepTechnicalReference[];
  executionNotes?: string | null;
  qualityControls?: string[];
  technicalReservations?: string[];
  unit: string;
  elementIds?: string[];
  formula?: string | null;
  declaredQuantity?: number | null;
  provenance?: StoredProvenance | null;
  justification?: string | null;
  role?: LineRole;
  nature?: LineNature | null;
  dependsOnDecisions?: string[];
  notes?: string | null;
};

export type PrepPatchHypothesisChanges = {
  statement?: string;
  reason?: string | null;
  toConfirmWith?: string | null;
};

export type PrepPatchStudyChanges = {
  title?: string;
  trade?: string | null;
  description?: string | null;
};

export type PrepPatchOperation =
  | { op: "update_parameter"; key: string; changes: PrepPatchParameterChanges }
  | { op: "update_line"; code: string; changes: PrepPatchLineChanges }
  | { op: "add_line"; line: PrepPatchLinePayload; insertAfterCode?: string | null }
  | { op: "delete_line"; code: string }
  | { op: "update_hypothesis"; id: string; changes: PrepPatchHypothesisChanges }
  | { op: "update_study"; changes: PrepPatchStudyChanges }
  | { op: "update_workflow"; workflow: Record<string, unknown> }
  | { op: "update_resources"; resources: Record<string, unknown> };

export type BeworkPrepPatchV1 = {
  format: typeof PREP_PATCH_FORMAT;
  patchId: string;
  target: {
    studyId?: string | null;
    bundleId?: string | null;
    titleMatch?: string | null;
    baseVersion?: number | null;
  };
  operations: PrepPatchOperation[];
};

export type PrepPatchParseIssue = {
  path: string;
  message: string;
  severity: "error" | "warn";
};

export type PrepPatchParseResult =
  | { ok: true; patch: BeworkPrepPatchV1; warnings: PrepPatchParseIssue[] }
  | { ok: false; errors: PrepPatchParseIssue[] };
