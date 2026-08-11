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

/** Prix de vente depuis déboursé + taux de marque (marge / PV = m). */
export function sellFromCostAndMarginPercent(costHt: number, marginPercent: number): number {
  const m = Number(marginPercent) || 0;
  if (m >= 100) return roundMoney(costHt, 2);
  if (m <= 0) return roundMoney(costHt, 2);
  return roundMoney(costHt / (1 - m / 100), 2);
}

/** Taux de marque % = (PV − coût) / PV. Stocké en DB dans marginPercent (héritage V1). */
export function marginPercentFromCostSell(costHt: number, sellHt: number): number {
  if (sellHt <= 0) return 0;
  return roundMoney(((sellHt - costHt) / sellHt) * 100, 2);
}

export type WorkItemComponentInput = {
  type: string;
  quantityPerUnit: number;
  unitCostHt: number;
  lossPercent?: number;
};

export function calculateWorkItemUnitCost(components: WorkItemComponentInput[]): number {
  let cents = 0;
  for (const c of components) {
    const q = Number(c.quantityPerUnit) || 0;
    const loss = Math.max(0, Number(c.lossPercent) || 0);
    const effectiveQty = q * (1 + loss / 100);
    const u = Number(c.unitCostHt) || 0;
    cents += toCents(roundMoney(effectiveQty * u, 4));
  }
  return fromCents(cents);
}

/** Quantité effective avec pertes (ex. 10,5 × 7 % → 11,235). */
export function effectiveQuantityWithLoss(quantity: number, lossPercent = 0): number {
  const q = Number(quantity) || 0;
  const loss = Math.max(0, Number(lossPercent) || 0);
  return roundMoney(q * (1 + loss / 100), 6);
}

export function calculateComponentLineCost(input: {
  quantityPerUnit: number;
  unitCostHt: number;
  lossPercent?: number;
}): number {
  const qty = effectiveQuantityWithLoss(input.quantityPerUnit, input.lossPercent ?? 0);
  return roundMoney(qty * (Number(input.unitCostHt) || 0), 4);
}

/**
 * Taux de marque = marge / prix de vente (méthode principale V1.1).
 * Alias sémantique de marginPercentFromCostSell.
 */
export function marquePercentFromCostSell(costHt: number, sellHt: number): number {
  return marginPercentFromCostSell(costHt, sellHt);
}

/** Taux de marge = marge / coût (≠ marque). */
export function markupPercentFromCostSell(costHt: number, sellHt: number): number {
  if (costHt <= 0) return 0;
  return roundMoney(((sellHt - costHt) / costHt) * 100, 2);
}

/** Coefficient de vente = PV / coût. */
export function sellCoefficientFromCostSell(costHt: number, sellHt: number): number {
  if (costHt <= 0) return 0;
  return roundMoney(sellHt / costHt, 4);
}

export type CostBreakdownByType = {
  materialsHt: number;
  laborHt: number;
  equipmentHt: number;
  subcontractHt: number;
  otherHt: number;
  dryCostHt: number;
  feesHt: number;
  costPriceHt: number;
};

export type WorkItemCostingInput = {
  components: Array<{
    type: string;
    quantityPerUnit: number;
    unitCostHt: number;
    lossPercent?: number;
  }>;
  feesPercent?: number;
  feesAmountHt?: number;
  /** MARGIN = PV depuis taux de marque · FIXED_SELL = marge depuis PV */
  sellMode?: "MARGIN" | "FIXED_SELL";
  marginPercent?: number;
  unitSellHt?: number;
};

export type WorkItemCostingResult = CostBreakdownByType & {
  unitSellHt: number;
  /** Taux de marque % */
  marquePercent: number;
  /** Taux de marge % */
  markupPercent: number;
  sellCoefficient: number;
  marginAmountHt: number;
};

export function calculateWorkItemCosting(input: WorkItemCostingInput): WorkItemCostingResult {
  const buckets = {
    MATERIAL: 0,
    LABOR: 0,
    EQUIPMENT: 0,
    SUBCONTRACT: 0,
    OTHER: 0,
  };
  for (const c of input.components) {
    const line = calculateComponentLineCost(c);
    const key = (c.type in buckets ? c.type : "OTHER") as keyof typeof buckets;
    buckets[key] = roundMoney(buckets[key] + line, 4);
  }
  const dryCostHt = fromCents(
    toCents(buckets.MATERIAL) +
      toCents(buckets.LABOR) +
      toCents(buckets.EQUIPMENT) +
      toCents(buckets.SUBCONTRACT) +
      toCents(buckets.OTHER),
  );
  const feesFromPercent = roundMoney(dryCostHt * ((Number(input.feesPercent) || 0) / 100), 4);
  const feesHt = roundMoney(feesFromPercent + (Number(input.feesAmountHt) || 0), 4);
  const costPriceHt = roundMoney(dryCostHt + feesHt, 2);

  const sellMode = input.sellMode ?? "MARGIN";
  let unitSellHt: number;
  let marquePercent: number;
  if (sellMode === "FIXED_SELL") {
    unitSellHt = roundMoney(Number(input.unitSellHt) || 0, 2);
    marquePercent = marquePercentFromCostSell(costPriceHt, unitSellHt);
  } else {
    marquePercent = Number(input.marginPercent) || 0;
    unitSellHt =
      marquePercent > 0
        ? sellFromCostAndMarginPercent(costPriceHt, marquePercent)
        : roundMoney(Number(input.unitSellHt) || costPriceHt, 2);
    marquePercent = marquePercentFromCostSell(costPriceHt, unitSellHt);
  }

  const marginAmountHt = roundMoney(unitSellHt - costPriceHt, 2);
  return {
    materialsHt: fromCents(toCents(buckets.MATERIAL)),
    laborHt: fromCents(toCents(buckets.LABOR)),
    equipmentHt: fromCents(toCents(buckets.EQUIPMENT)),
    subcontractHt: fromCents(toCents(buckets.SUBCONTRACT)),
    otherHt: fromCents(toCents(buckets.OTHER)),
    dryCostHt,
    feesHt,
    costPriceHt,
    unitSellHt,
    marquePercent,
    markupPercent: markupPercentFromCostSell(costPriceHt, unitSellHt),
    sellCoefficient: sellCoefficientFromCostSell(costPriceHt, unitSellHt),
    marginAmountHt,
  };
}

/** Heures totales pour une quantité d’ouvrage (MODE A : h / unité). */
export function laborHoursForQuantity(hoursPerUnit: number, quantity: number): number {
  return roundMoney((Number(hoursPerUnit) || 0) * (Number(quantity) || 0), 4);
}

/** Estimation journées-personne (prépare futur lien Planning). */
export function personDaysFromHours(hours: number, workDayHours = 8): number {
  const day = Number(workDayHours) || 8;
  if (day <= 0) return 0;
  return roundMoney((Number(hours) || 0) / day, 2);
}

/**
 * MODE B (V1.2 préparé) : équipe + production/jour → h / unité.
 * Ex. 2 pers × 8 h / 30 m²/j = 0,533 h/m²
 */
export function hoursPerUnitFromTeamProduction(input: {
  teamSize: number;
  productionPerDay: number;
  workDayHours?: number;
}): number {
  const prod = Number(input.productionPerDay) || 0;
  if (prod <= 0) return 0;
  const hours =
    (Number(input.teamSize) || 0) * (Number(input.workDayHours) || 8);
  return roundMoney(hours / prod, 6);
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

/**
 * Progression facturation d’un avenant (allocation via invoice.amendmentId).
 * CREDIT réduit le facturé (avoir), CANCELLED/DRAFT exclus.
 */
export type AmendmentBillingInvoiceInput = {
  type: string;
  status: string;
  totalSellHt: number;
};

export type AmendmentBillingProgress = {
  acceptedAmountHt: number;
  invoicedAmountHt: number;
  remainingToInvoiceHt: number;
  isFullyInvoiced: boolean;
  isBillable: boolean;
};

/** Contribution nette HT d’une facture à un avenant (CREDIT = négatif). */
export function invoiceContributionHtToAmendment(
  inv: AmendmentBillingInvoiceInput,
): number {
  if (inv.status === "CANCELLED" || inv.status === "DRAFT") return 0;
  const ht = roundMoney(Math.abs(Number(inv.totalSellHt) || 0), 2);
  if (inv.type === "CREDIT") return -ht;
  return ht;
}

export function calculateAmendmentBillingProgress(input: {
  amendmentStatus: string;
  acceptedAmountHt: number;
  invoices: AmendmentBillingInvoiceInput[];
}): AmendmentBillingProgress {
  const accepted = roundMoney(Number(input.acceptedAmountHt) || 0, 2);
  const isAccepted = input.amendmentStatus === "ACCEPTED";
  const invoiced = roundMoney(
    input.invoices.reduce((s, i) => s + invoiceContributionHtToAmendment(i), 0),
    2,
  );
  const remaining = isAccepted
    ? roundMoney(Math.max(0, accepted - invoiced), 2)
    : 0;
  return {
    acceptedAmountHt: accepted,
    invoicedAmountHt: invoiced,
    remainingToInvoiceHt: remaining,
    isFullyInvoiced: isAccepted && remaining <= 0.009,
    isBillable: isAccepted && remaining > 0.009,
  };
}

export const COMMERCIAL_AMENDMENT_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Brouillon",
  TO_VALIDATE: "À valider",
  SENT: "Envoyé",
  ACCEPTED: "Accepté",
  REFUSED: "Refusé",
  CANCELLED: "Annulé",
};

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
  PARTIALLY_PAID: "Partiellement encaissée",
  PAID: "Encaissée",
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
