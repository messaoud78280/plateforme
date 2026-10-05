/**
 * Helpers contexte ChatGPT universel — construction sans inventer de liens.
 */
import {
  intentsForSection,
  supportedOperationsForSection,
} from "@/lib/bework-patch/operations-catalog";
import {
  BEWORK_CONTEXT_FORMAT,
  BEWORK_CONTEXT_SCHEMA_VERSION,
  BEWORK_PATCH_FORMAT,
  type BeworkChatgptContextV1,
  type BeworkContextRelationshipQuoteItem,
  type BeworkEntityType,
  type BeworkPatchSection,
  type CanonicalResolution,
} from "@/lib/bework-patch/types";

/** Construit une résolution canonique sans jamais inventer un paramètre. */
export function buildCanonicalResolution(input: {
  takeoffLineCode?: string | null;
  studyId?: string | null;
  /** Uniquement si lien explicite paramètre ↔ ligne / mesure. */
  parameterId?: string | null;
  parameterKey?: string | null;
}): CanonicalResolution {
  if (input.parameterId || input.parameterKey) {
    return {
      status: "EXACT",
      resolved_to: "PREP_PARAMETER",
      parameter_id: input.parameterId ?? null,
      parameter_key: input.parameterKey ?? null,
      study_line_code: input.takeoffLineCode ?? null,
    };
  }
  if (input.takeoffLineCode && input.studyId) {
    return {
      status: "PARTIAL",
      resolved_to: "TAKEOFF_LINE",
      parameter_id: null,
      parameter_key: null,
      study_line_code: input.takeoffLineCode,
      note: "Ligne de métré liée retrouvée, mais la donnée source précise ne peut pas être déterminée automatiquement.",
    };
  }
  return {
    status: "NONE",
    resolved_to: null,
    parameter_id: null,
    parameter_key: null,
    study_line_code: null,
    note: "Aucune relation fiable vers une donnée technique.",
  };
}

export function buildChatgptContextSkeleton(input: {
  section: BeworkPatchSection;
  project: { id: string; title: string } | null;
  target: {
    entity_type: BeworkEntityType;
    id: string;
    version: number;
    code?: string | null;
    /** Additif CTX-08/02A — alias explicite pour origin.base_version. */
    base_version?: number;
  };
  data?: Record<string, unknown>;
  quoteItems?: BeworkContextRelationshipQuoteItem[];
}): BeworkChatgptContextV1 {
  return {
    type: BEWORK_CONTEXT_FORMAT,
    schema_version: BEWORK_CONTEXT_SCHEMA_VERSION,
    section: input.section,
    project: input.project,
    target: input.target,
    data: input.data ?? {},
    relationships: {
      quote_items: input.quoteItems ?? [],
    },
    supported_change_intents: intentsForSection(input.section),
    supported_operations: supportedOperationsForSection(input.section),
    expected_output: BEWORK_PATCH_FORMAT,
  };
}

export function contextToClipboardText(ctx: BeworkChatgptContextV1): string {
  return JSON.stringify(ctx, null, 2);
}
