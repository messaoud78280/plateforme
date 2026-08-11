/**
 * Moteur financier Devis & Facturation (Commercial*).
 * Source de vérité calculs — pas dans les composants React.
 *
 * Représentation : stockage Prisma Decimal(14,4).
 * Calculs internes en centimes entiers (arrondi half-up à 2 décimales pour affichage monétaire).
 * Les coûts unitaires peuvent garder 4 décimales en entrée ; les totaux ligne/document sont arrondis à 2.
 */

export type Money = number; // euros, précision calcul via cents

const CENTS = 100;

/** Arrondi half-up vers n décimales. */
export function roundMoney(value: number, decimals = 2): number {
  if (!Number.isFinite(value)) return 0;
  const f = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * f) / f;
}

export function toCents(euros: number): number {
  return Math.round(roundMoney(euros, 4) * CENTS);
}

export function fromCents(cents: number): number {
  return roundMoney(cents / CENTS, 2);
}

export type LineCalcInput = {
  kind?: "WORK" | "COMMENT" | "OPTION" | "SUBTOTAL";
  quantity: number;
  unitCostHt?: number;
  unitSellHt: number;
  discountPercent?: number;
  vatRate?: number;
  isOptional?: boolean;
};

export type LineCalcResult = {
  lineCostHt: number;
  lineSellHt: number;
  lineVat: number;
  lineTtc: number;
  marginAmount: number;
  includedInTotals: boolean;
};

export function calculateLine(input: LineCalcInput): LineCalcResult {
  const kind = input.kind ?? "WORK";
  if (kind === "COMMENT" || kind === "SUBTOTAL") {
    return {
      lineCostHt: 0,
      lineSellHt: 0,
      lineVat: 0,
      lineTtc: 0,
      marginAmount: 0,
      includedInTotals: false,
    };
  }

  const qty = Number(input.quantity) || 0;
  const unitCost = Number(input.unitCostHt) || 0;
  const unitSell = Number(input.unitSellHt) || 0;
  const discount = Math.min(100, Math.max(0, Number(input.discountPercent) || 0));
  const vatRate = Number(input.vatRate) || 0;

  const grossSell = qty * unitSell;
  const lineSellHt = roundMoney(grossSell * (1 - discount / 100), 2);
  const lineCostHt = roundMoney(qty * unitCost, 2);
  const lineVat = roundMoney(lineSellHt * (vatRate / 100), 2);
  const lineTtc = roundMoney(lineSellHt + lineVat, 2);
  const marginAmount = roundMoney(lineSellHt - lineCostHt, 2);

  return {
    lineCostHt,
    lineSellHt,
    lineVat,
    lineTtc,
    marginAmount,
    includedInTotals: kind === "WORK" && !input.isOptional,
  };
}

export type DocumentTotals = {
  totalCostHt: number;
  totalSellHt: number;
  totalVat: number;
  totalTtc: number;
  marginAmount: number;
  marginPercent: number;
};

export function calculateDocumentTotals(lines: LineCalcResult[]): DocumentTotals {
  let cost = 0;
  let sell = 0;
  let vat = 0;
  for (const l of lines) {
    if (!l.includedInTotals) continue;
    cost += toCents(l.lineCostHt);
    sell += toCents(l.lineSellHt);
    vat += toCents(l.lineVat);
  }
  const totalCostHt = fromCents(cost);
  const totalSellHt = fromCents(sell);
  const totalVat = fromCents(vat);
  const totalTtcFixed = fromCents(sell + vat);
  const marginAmount = fromCents(sell - cost);
  const marginPercent =
    totalSellHt > 0 ? roundMoney((marginAmount / totalSellHt) * 100, 2) : 0;

  return {
    totalCostHt,
    totalSellHt,
    totalVat,
    totalTtc: totalTtcFixed,
    marginAmount,
    marginPercent,
  };
}

/** Prix de vente depuis déboursé + marge % (marge / PV = m). */
export function sellFromCostAndMarginPercent(costHt: number, marginPercent: number): number {
  const m = Number(marginPercent) || 0;
  if (m >= 100) return roundMoney(costHt, 2);
  if (m <= 0) return roundMoney(costHt, 2);
  return roundMoney(costHt / (1 - m / 100), 2);
}

/** Marge % depuis coût et PV. */
export function marginPercentFromCostSell(costHt: number, sellHt: number): number {
  if (sellHt <= 0) return 0;
  return roundMoney(((sellHt - costHt) / sellHt) * 100, 2);
}

export type WorkItemComponentInput = {
  type: string;
  quantityPerUnit: number;
  unitCostHt: number;
};

export function calculateWorkItemUnitCost(components: WorkItemComponentInput[]): number {
  let cents = 0;
  for (const c of components) {
    const q = Number(c.quantityPerUnit) || 0;
    const u = Number(c.unitCostHt) || 0;
    cents += toCents(roundMoney(q * u, 4));
  }
  return fromCents(cents);
}

/** Acompte : montant HT depuis % du marché. */
export function depositAmountFromPercent(marketHt: number, percent: number): number {
  return roundMoney((Number(marketHt) || 0) * ((Number(percent) || 0) / 100), 2);
}

export type DealFinancialSummaryInput = {
  initialMarketHt: number;
  acceptedAmendmentsHt: number;
  invoicedHt: number;
  paidTtc: number;
  invoicedTtc: number;
};

export type DealFinancialSummary = {
  initialMarketHt: number;
  acceptedAmendmentsHt: number;
  updatedMarketHt: number;
  invoicedHt: number;
  paidTtc: number;
  remainingToInvoiceHt: number;
  remainingToCollectTtc: number;
};

export function calculateDealFinancialSummary(
  input: DealFinancialSummaryInput,
): DealFinancialSummary {
  const initial = roundMoney(input.initialMarketHt, 2);
  const amendments = roundMoney(input.acceptedAmendmentsHt, 2);
  const updated = roundMoney(initial + amendments, 2);
  const invoicedHt = roundMoney(input.invoicedHt, 2);
  const paidTtc = roundMoney(input.paidTtc, 2);
  const invoicedTtc = roundMoney(input.invoicedTtc, 2);
  return {
    initialMarketHt: initial,
    acceptedAmendmentsHt: amendments,
    updatedMarketHt: updated,
    invoicedHt,
    paidTtc,
    remainingToInvoiceHt: roundMoney(Math.max(0, updated - invoicedHt), 2),
    remainingToCollectTtc: roundMoney(Math.max(0, invoicedTtc - paidTtc), 2),
  };
}

export const COMMERCIAL_QUOTE_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Brouillon",
  TO_VALIDATE: "À valider",
  VALIDATED: "Validé",
  SENT: "Envoyé",
  VIEWED: "Consulté",
  ACCEPTED: "Accepté",
  REFUSED: "Refusé",
  EXPIRED: "Expiré",
  CANCELLED: "Annulé",
};

export const COMMERCIAL_INVOICE_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Brouillon",
  ISSUED: "Émise",
  PARTIALLY_PAID: "Partiellement payée",
  PAID: "Payée",
  OVERDUE: "En retard",
  CANCELLED: "Annulée",
};

export const COMMERCIAL_INVOICE_TYPE_LABELS: Record<string, string> = {
  STANDARD: "Facture",
  DEPOSIT: "Acompte",
  PROGRESS: "Situation",
  FINAL: "Solde",
  CREDIT: "Avoir",
};
