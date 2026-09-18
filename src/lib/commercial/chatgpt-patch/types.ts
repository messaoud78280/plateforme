/**
 * bework_quote_patch_v1 — modifications ciblées d’un devis existant.
 * Distinct de bework_quote_bundle_v1 (création / import massif).
 */

export const BEWORK_QUOTE_PATCH_FORMAT = "bework_quote_patch_v1" as const;

export type PatchOpType =
  | "add_item"
  | "update_item"
  | "delete_item"
  | "add_section"
  | "update_section"
  | "delete_section"
  | "update_quote"
  | "add_note";

export type PatchItemPayload = {
  /** ID stable optionnel (stocké en reference pour patches futurs). */
  itemId?: string | null;
  designation: string;
  description?: string | null;
  quantity: number;
  unit: string;
  unitPriceHt: number;
  vatRate?: number | null;
  discountPercent?: number | null;
};

export type PatchItemChanges = {
  designation?: string;
  description?: string | null;
  quantity?: number;
  unit?: string;
  unitPriceHt?: number;
  vatRate?: number;
  discountPercent?: number;
};

export type PatchQuoteChanges = {
  subject?: string;
  clientNotes?: string;
  internalNotes?: string;
  paymentTerms?: string;
};

export type PatchOperation =
  | {
      op: "add_item";
      sectionId?: string | null;
      sectionTitle?: string | null;
      insertAfterItemId?: string | null;
      insertBeforeItemId?: string | null;
      item: PatchItemPayload;
    }
  | {
      op: "update_item";
      itemId?: string | null;
      designationMatch?: string | null;
      changes: PatchItemChanges;
    }
  | {
      op: "delete_item";
      itemId?: string | null;
      designationMatch?: string | null;
    }
  | {
      op: "add_section";
      sectionId?: string | null;
      title: string;
    }
  | {
      op: "update_section";
      sectionId?: string | null;
      titleMatch?: string | null;
      title: string;
    }
  | {
      op: "delete_section";
      sectionId?: string | null;
      titleMatch?: string | null;
    }
  | {
      op: "update_quote";
      changes: PatchQuoteChanges;
    }
  | {
      op: "add_note";
      target: "client" | "internal";
      content: string;
    };

export type BeworkQuotePatchV1 = {
  type: typeof BEWORK_QUOTE_PATCH_FORMAT;
  patchId: string;
  target: {
    quoteNumber: string;
    baseVersion?: number | null;
  };
  operations: PatchOperation[];
};

export type PatchParseIssue = {
  path: string;
  message: string;
  severity: "error" | "warn";
};

export type PatchParseResult =
  | { ok: true; patch: BeworkQuotePatchV1; warnings: PatchParseIssue[] }
  | { ok: false; errors: PatchParseIssue[] };
