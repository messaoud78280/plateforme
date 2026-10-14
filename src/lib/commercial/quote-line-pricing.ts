export const QUOTE_LINE_PRICING_KEY = "beworkPricing";
export const FREE_CONFIRMED_STATUS = "FREE_CONFIRMED";

export type QuoteLinePricingState =
  | "NOT_APPLICABLE"
  | "PRICED"
  | "FREE_CONFIRMED"
  | "UNPRICED";

type QuoteLinePricingInput = {
  kind: string;
  unitSellHt: unknown;
  compositionSnapshotJson?: unknown;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export function quoteLinePricingState(
  line: QuoteLinePricingInput,
): QuoteLinePricingState {
  if (line.kind === "COMMENT" || line.kind === "SUBTOTAL") {
    return "NOT_APPLICABLE";
  }
  const unitSellHt = Number(line.unitSellHt);
  if (Number.isFinite(unitSellHt) && unitSellHt > 0) {
    return "PRICED";
  }
  const snapshot = asRecord(line.compositionSnapshotJson);
  const pricing = asRecord(snapshot?.[QUOTE_LINE_PRICING_KEY]);
  return pricing?.status === FREE_CONFIRMED_STATUS
    ? "FREE_CONFIRMED"
    : "UNPRICED";
}

export function withQuoteLineFreeConfirmation(
  snapshotValue: unknown,
  confirmed: boolean,
): Record<string, unknown> | null {
  const snapshot = { ...(asRecord(snapshotValue) ?? {}) };
  if (confirmed) {
    snapshot[QUOTE_LINE_PRICING_KEY] = {
      status: FREE_CONFIRMED_STATUS,
    };
  } else {
    delete snapshot[QUOTE_LINE_PRICING_KEY];
  }
  return Object.keys(snapshot).length > 0 ? snapshot : null;
}

export function findUnpricedQuoteLines<T extends QuoteLinePricingInput>(
  lines: readonly T[],
): T[] {
  return lines.filter((line) => quoteLinePricingState(line) === "UNPRICED");
}
