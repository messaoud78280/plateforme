/**
 * Ops QUOTE réellement commitables via applyQuoteOnlyInTx (source de vérité).
 * Toute op absente ne doit PAS être exposée dans supported_operations.
 */
export const QUOTE_COMMIT_SUPPORTED_OPS = ["update_quote_item"] as const;

export type QuoteCommitSupportedOp =
  (typeof QUOTE_COMMIT_SUPPORTED_OPS)[number];

/** Ops encore dans le catalogue / parse mais non écrites par le commit universel. */
export const QUOTE_COMMIT_UNSUPPORTED_OPS = [
  "add_quote_item",
  "delete_quote_item",
  "update_quote_section",
  "update_quote_meta",
  "update_parameter",
  "update_line",
] as const;

/**
 * Champs réellement persistés par applyQuoteOnlyInTx.
 * description / unit / vat_rate : non écrits aujourd’hui — ne pas les exposer.
 */
export const QUOTE_UPDATE_ITEM_COMMITTED_FIELDS = [
  "designation",
  "quantity",
  "unit_price_ht",
  "discount_percent",
] as const;

export function isQuoteCommitSupportedOp(
  op: string,
): op is QuoteCommitSupportedOp {
  return (QUOTE_COMMIT_SUPPORTED_OPS as readonly string[]).includes(op);
}

export function isQuoteUpdateItemCommittedField(field: string): boolean {
  return (QUOTE_UPDATE_ITEM_COMMITTED_FIELDS as readonly string[]).includes(
    field,
  );
}
