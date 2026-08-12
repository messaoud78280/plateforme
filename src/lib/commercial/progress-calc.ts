/**
 * DF-5 — Calculs purs d’avancement situation (pas de Prisma).
 * Source de vérité financière = serveur ; ce module est partagé tests / service.
 */
import { roundMoney } from "@/lib/commercial/money";

export type ProgressLineInput = {
  contractQuantity: number;
  unitSellHt: number;
  vatRate: number;
  contractSellHt: number;
  previousPercent: number;
  previousQuantity: number;
  previousSellHt: number;
  /** Saisie période : fournir percent OU quantity (priorité au mode indiqué). */
  periodPercent?: number;
  periodQuantity?: number;
  inputMode?: "percent" | "quantity";
};

export type ProgressLineComputed = {
  previousPercent: number;
  previousQuantity: number;
  previousSellHt: number;
  periodPercent: number;
  periodQuantity: number;
  periodSellHt: number;
  periodVat: number;
  periodTtc: number;
  cumulativePercent: number;
  cumulativeQuantity: number;
  cumulativeSellHt: number;
  remainingPercent: number;
  remainingQuantity: number;
  remainingSellHt: number;
  completed: boolean;
};

export type ProgressTotals = {
  marketSellHt: number;
  marketVat: number;
  marketTtc: number;
  previousSellHt: number;
  previousVat: number;
  previousTtc: number;
  periodSellHt: number;
  periodVat: number;
  periodTtc: number;
  cumulativeSellHt: number;
  cumulativeVat: number;
  cumulativeTtc: number;
  remainingSellHt: number;
  remainingVat: number;
  remainingTtc: number;
};

function vatOn(ht: number, vatRate: number): number {
  return roundMoney(ht * (vatRate / 100), 2);
}

/** % ↔ quantité depuis quantité marché. */
export function percentFromQuantity(
  contractQuantity: number,
  quantity: number,
): number {
  const cq = Number(contractQuantity) || 0;
  if (cq <= 0) return 0;
  return roundMoney((Number(quantity) / cq) * 100, 4);
}

export function quantityFromPercent(
  contractQuantity: number,
  percent: number,
): number {
  const cq = Number(contractQuantity) || 0;
  return roundMoney(cq * ((Number(percent) || 0) / 100), 4);
}

export function amountFromPercent(contractSellHt: number, percent: number): number {
  return roundMoney((Number(contractSellHt) || 0) * ((Number(percent) || 0) / 100), 2);
}

/**
 * Calcule une ligne d’avancement.
 * @throws Error si règles métier violées
 */
export function computeProgressLine(input: ProgressLineInput): ProgressLineComputed {
  const contractQty = Number(input.contractQuantity) || 0;
  const contractHt = roundMoney(Number(input.contractSellHt) || 0, 2);
  const vatRate = Number(input.vatRate) || 0;
  const previousPercent = roundMoney(Math.max(0, Number(input.previousPercent) || 0), 4);
  const previousQuantity = roundMoney(Math.max(0, Number(input.previousQuantity) || 0), 4);
  const previousSellHt = roundMoney(Math.max(0, Number(input.previousSellHt) || 0), 2);

  if (previousPercent < 0 || previousQuantity < 0 || previousSellHt < 0) {
    throw new Error("Avancement précédent invalide");
  }
  if (previousPercent > 100 + 1e-9) {
    throw new Error("Avancement précédent > 100 %");
  }

  const mode = input.inputMode ?? (input.periodQuantity != null ? "quantity" : "percent");
  let periodPercent: number;
  let periodQuantity: number;

  if (mode === "quantity") {
    periodQuantity = roundMoney(Number(input.periodQuantity) || 0, 4);
    if (periodQuantity < 0) throw new Error("Quantité période négative interdite");
    periodPercent = percentFromQuantity(contractQty, periodQuantity);
  } else {
    periodPercent = roundMoney(Number(input.periodPercent) || 0, 4);
    if (periodPercent < 0) throw new Error("Pourcentage période négatif interdit");
    periodQuantity = quantityFromPercent(contractQty, periodPercent);
  }

  const cumulativePercent = roundMoney(previousPercent + periodPercent, 4);
  const cumulativeQuantity = roundMoney(previousQuantity + periodQuantity, 4);

  if (cumulativePercent > 100 + 1e-6) {
    throw new Error(
      `Cumul ${cumulativePercent} % dépasse 100 % (précédent ${previousPercent} % + période ${periodPercent} %)`,
    );
  }
  if (contractQty > 0 && cumulativeQuantity > contractQty + 1e-6) {
    throw new Error(
      `Quantité cumulée ${cumulativeQuantity} dépasse le marché ${contractQty}`,
    );
  }

  // Montants : dérivés du % pour cohérence avec le marché HT (évite dérive qty×PU)
  const periodSellHt = amountFromPercent(contractHt, periodPercent);
  const cumulativeSellHt = roundMoney(previousSellHt + periodSellHt, 2);
  // Ajustement dernier palier à 100 % : cumul = marché
  let finalCumulHt = cumulativeSellHt;
  let finalPeriodHt = periodSellHt;
  if (Math.abs(cumulativePercent - 100) < 1e-6 || cumulativePercent >= 100) {
    finalCumulHt = contractHt;
    finalPeriodHt = roundMoney(Math.max(0, contractHt - previousSellHt), 2);
  }

  const remainingSellHt = roundMoney(Math.max(0, contractHt - finalCumulHt), 2);
  const remainingPercent = roundMoney(Math.max(0, 100 - cumulativePercent), 4);
  const remainingQuantity = roundMoney(Math.max(0, contractQty - cumulativeQuantity), 4);
  const periodVat = vatOn(finalPeriodHt, vatRate);
  const periodTtc = roundMoney(finalPeriodHt + periodVat, 2);

  return {
    previousPercent,
    previousQuantity,
    previousSellHt,
    periodPercent,
    periodQuantity,
    periodSellHt: finalPeriodHt,
    periodVat,
    periodTtc,
    cumulativePercent: Math.min(100, cumulativePercent),
    cumulativeQuantity,
    cumulativeSellHt: finalCumulHt,
    remainingPercent,
    remainingQuantity,
    remainingSellHt,
    completed: cumulativePercent >= 100 - 1e-6,
  };
}

export function computeProgressTotals(
  lines: Array<{
    contractSellHt: number;
    vatRate: number;
    previousSellHt: number;
    periodSellHt: number;
    cumulativeSellHt: number;
    remainingSellHt: number;
  }>,
): ProgressTotals {
  let marketSell = 0;
  let marketVat = 0;
  let prevSell = 0;
  let prevVat = 0;
  let periodSell = 0;
  let periodVat = 0;
  let cumulSell = 0;
  let cumulVat = 0;
  let remSell = 0;
  let remVat = 0;

  for (const l of lines) {
    const ht = roundMoney(l.contractSellHt, 2);
    const rate = Number(l.vatRate) || 0;
    marketSell += ht;
    marketVat += vatOn(ht, rate);
    prevSell += roundMoney(l.previousSellHt, 2);
    prevVat += vatOn(roundMoney(l.previousSellHt, 2), rate);
    periodSell += roundMoney(l.periodSellHt, 2);
    periodVat += vatOn(roundMoney(l.periodSellHt, 2), rate);
    cumulSell += roundMoney(l.cumulativeSellHt, 2);
    cumulVat += vatOn(roundMoney(l.cumulativeSellHt, 2), rate);
    remSell += roundMoney(l.remainingSellHt, 2);
    remVat += vatOn(roundMoney(l.remainingSellHt, 2), rate);
  }

  const r = (n: number) => roundMoney(n, 2);
  return {
    marketSellHt: r(marketSell),
    marketVat: r(marketVat),
    marketTtc: r(marketSell + marketVat),
    previousSellHt: r(prevSell),
    previousVat: r(prevVat),
    previousTtc: r(prevSell + prevVat),
    periodSellHt: r(periodSell),
    periodVat: r(periodVat),
    periodTtc: r(periodSell + periodVat),
    cumulativeSellHt: r(cumulSell),
    cumulativeVat: r(cumulVat),
    cumulativeTtc: r(cumulSell + cumulVat),
    remainingSellHt: r(remSell),
    remainingVat: r(remVat),
    remainingTtc: r(remSell + remVat),
  };
}

export const PROGRESS_STATEMENT_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Brouillon",
  VALIDATED: "Validée",
  INVOICED: "Facturée",
};
