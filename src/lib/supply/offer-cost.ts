/**
 * Coût produit + coût rendu chantier — déterministe, jamais inventé.
 * deliveryFee/craneFee/otherFees : null ≠ 0.
 */
import { buildRenderedCost } from "@/lib/supply/quantities";
import { unitsAreCompatible } from "@/lib/supply/offer-validation";
import type { SupplyRenderedCost } from "@/lib/supply/types";

function n(v: unknown): number | null {
  if (v == null || v === "") return null;
  const x = typeof v === "number" ? v : Number(v);
  return Number.isFinite(x) ? x : null;
}

/**
 * Coût produit = unitPrice × qty dans la même unité tarifaire.
 * Si unités incompatibles et unitsPerPack inconnu → UNKNOWN.
 * Ne convertit jamais TTC → HT sans vatRate.
 */
export function computeProductCost(input: {
  unitPrice: number | null | undefined;
  priceUnit: string | null | undefined;
  priceTaxMode: "HT" | "TTC";
  vatRate?: number | null;
  needQuantity: number | null | undefined;
  needUnit: string | null | undefined;
  unitsPerPack?: number | null;
}): {
  amount: number | null;
  /** Montant dans le mode fiscal d’origine (HT ou TTC) — jamais converti artificiellement */
  taxMode: "HT" | "TTC";
  status: "KNOWN" | "UNKNOWN";
  reason: string | null;
  /** HT dérivé uniquement si TTC + vatRate connu — affichage, pas remplacement */
  amountHtDerived: number | null;
} {
  const unitPrice = n(input.unitPrice);
  if (unitPrice == null) {
    return {
      amount: null,
      taxMode: input.priceTaxMode,
      status: "UNKNOWN",
      reason: "Prix non disponible",
      amountHtDerived: null,
    };
  }

  const needQty = n(input.needQuantity);
  if (needQty == null || needQty <= 0) {
    return {
      amount: null,
      taxMode: input.priceTaxMode,
      status: "UNKNOWN",
      reason: "Quantité à commander manquante",
      amountHtDerived: null,
    };
  }

  let qtyInPriceUnit: number | null = null;

  if (unitsAreCompatible(input.priceUnit, input.needUnit)) {
    qtyInPriceUnit = needQty;
  } else {
    const perPack = n(input.unitsPerPack);
    if (perPack != null && perPack > 0) {
      // Prix / palette (ou pack) : besoin en unités pièce → ceil(need / unitsPerPack) packs
      const packs = Math.ceil(needQty / perPack - 1e-12);
      qtyInPriceUnit = packs;
    } else {
      return {
        amount: null,
        taxMode: input.priceTaxMode,
        status: "UNKNOWN",
        reason:
          "Coût produit à confirmer — conditionnement incomplet (unités incompatibles).",
        amountHtDerived: null,
      };
    }
  }

  const amount = unitPrice * qtyInPriceUnit;
  let amountHtDerived: number | null = null;
  const vat = n(input.vatRate);
  if (input.priceTaxMode === "TTC" && vat != null && vat >= 0) {
    amountHtDerived = amount / (1 + vat / 100);
  } else if (input.priceTaxMode === "HT") {
    amountHtDerived = amount;
  }
  // TTC sans TVA → pas de conversion HT inventée

  return {
    amount,
    taxMode: input.priceTaxMode,
    status: "KNOWN",
    reason: null,
    amountHtDerived,
  };
}

/**
 * Proposition conditionnement (affichage) — ne modifie jamais validatedOrderQuantity.
 */
export function proposePackagingFromOffer(input: {
  calculatedOrValidatedQty: number | null | undefined;
  unitsPerPack: number | null | undefined;
}): {
  packs: number | null;
  roundedQty: number | null;
  message: string | null;
} {
  const qty = n(input.calculatedOrValidatedQty);
  const perPack = n(input.unitsPerPack);
  if (qty == null || qty <= 0 || perPack == null || perPack <= 0) {
    return { packs: null, roundedQty: null, message: null };
  }
  const packs = Math.ceil(qty / perPack - 1e-12);
  const roundedQty = packs * perPack;
  return {
    packs,
    roundedQty,
    message: `Minimum théorique : ${packs} colis / ${roundedQty} unités (à confirmer)`,
  };
}

export type OfferRenderedCostView = {
  knownTotal: number | null;
  completeness: SupplyRenderedCost["completeness"];
  missingLabels: string[];
  displayLabel: string;
  lines: SupplyRenderedCost["lines"];
};

/**
 * Coût rendu chantier. COMPLETE uniquement si produit + frais requis connus.
 * includeCrane / includeDelivery : true = composant attendu.
 */
export function computeOfferRenderedCost(input: {
  productCostHt: number | null;
  deliveryFee: number | null | undefined;
  craneFee: number | null | undefined;
  otherFees: number | null | undefined;
  includeDelivery?: boolean;
  includeCrane?: boolean;
  includeOther?: boolean;
}): OfferRenderedCostView {
  const rendered = buildRenderedCost({
    productCostHt: input.productCostHt,
    deliveryFeeHt: input.deliveryFee,
    craneFeeHt: input.craneFee,
    otherFeesHt: input.otherFees,
    includeDelivery: input.includeDelivery !== false,
    includeCrane: input.includeCrane === true,
    includeOther: input.includeOther === true,
  });

  const missingLabels = rendered.lines
    .filter((l) => l.status === "UNKNOWN")
    .map((l) => l.label.toLowerCase());

  const knownSum = rendered.lines
    .filter((l) => l.status === "KNOWN")
    .reduce((s, l) => s + (l.amountHt ?? 0), 0);

  let displayLabel: string;
  if (rendered.completeness === "EMPTY") {
    displayLabel = "Coût rendu chantier non disponible";
  } else if (rendered.completeness === "COMPLETE") {
    displayLabel = `Coût rendu chantier : ${formatMoneyHt(knownSum)}`;
  } else {
    // Frais manquants → ne jamais présenter un « rendu chantier » définitif
    displayLabel = "Coût rendu chantier non disponible";
  }

  return {
    knownTotal:
      rendered.completeness === "EMPTY"
        ? null
        : knownSum > 0 || rendered.completeness === "PARTIAL"
          ? knownSum
          : null,
    completeness: rendered.completeness,
    missingLabels,
    displayLabel,
    lines: rendered.lines,
  };
}

function formatMoneyHt(v: number): string {
  return (
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 2,
    }).format(v) + " HT"
  );
}

/** Libellé sous-total produit (régime d’origine) — hors frais inconnus. */
export function formatProductSubtotalLabel(input: {
  amount: number | null;
  taxMode: "HT" | "TTC";
  status: "KNOWN" | "UNKNOWN";
  deliveryFee: number | null | undefined;
  craneFee?: number | null | undefined;
  otherFees?: number | null | undefined;
}): string {
  if (input.status !== "KNOWN" || input.amount == null) {
    return "Sous-total produit non calculable";
  }
  const money = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(input.amount);
  const tax = input.taxMode;
  if (input.deliveryFee == null) {
    return `Sous-total produit : ${money} ${tax} — hors livraison`;
  }
  return `Sous-total produit : ${money} ${tax}`;
}
