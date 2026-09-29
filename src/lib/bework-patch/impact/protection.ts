/**
 * Protection devis / détection override — Phase D (aucune écriture).
 */
import type {
  ImpactQuote,
  ImpactQuoteLink,
  ImpactQuoteLine,
  OverrideFlag,
  QuoteLinkClass,
} from "@/lib/bework-patch/impact/types";

const QTY_EPS = 1e-6;

/** Statuts dont la quantité/PU contractuels ne doivent pas être écrasés en simulation. */
export const QUOTE_PROTECTED_STATUSES = new Set([
  "SENT",
  "VIEWED",
  "ACCEPTED",
  "REFUSED",
  "EXPIRED",
  "CANCELLED",
]);

export function isQuoteProtected(status: string): boolean {
  return QUOTE_PROTECTED_STATUSES.has(status);
}

export function quoteProtectionReason(status: string): string {
  if (status === "ACCEPTED") {
    return "Devis accepté — impact contractuel. Action future : révision / avenant.";
  }
  if (status === "SENT" || status === "VIEWED") {
    return "Devis envoyé — protégé. Ne pas écraser silencieusement.";
  }
  return `Devis ${status} — protégé.`;
}

export function classifyQuoteLink(input: {
  quote: ImpactQuote;
  line: ImpactQuoteLine;
  link: ImpactQuoteLink | null;
  metreQty: number | null;
}): { class: QuoteLinkClass; override: OverrideFlag | null } {
  if (!input.link) {
    return { class: "UNLINKED", override: null };
  }
  if (isQuoteProtected(input.quote.status)) {
    return { class: "PROTECTED", override: null };
  }

  const transfer = input.link.quantityAtTransfer;
  const current = input.line.quantity;
  const likelyOverride = Math.abs(current - transfer) > QTY_EPS;

  if (likelyOverride) {
    const override: OverrideFlag = {
      quoteLineId: input.line.id,
      quoteId: input.quote.id,
      quoteNumber: input.quote.number,
      label: input.line.designation,
      kind: "LIKELY_OVERRIDE",
      metreQty: input.metreQty,
      transferQty: transfer,
      currentQty: current,
      message:
        "⚠ Quantité commerciale probablement modifiée manuellement. Valeur commerciale différente de la valeur transférée.",
    };
    return { class: "LIKELY_OVERRIDE", override };
  }

  return { class: "LINKED_STANDARD", override: null };
}
