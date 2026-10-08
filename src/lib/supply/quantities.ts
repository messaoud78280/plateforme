/**
 * Calculs purs Approvisionnements — aucune invention de perte / conditionnement.
 */
import type { SupplyQuantities, SupplyRenderedCost } from "@/lib/supply/types";

function n(v: unknown): number | null {
  if (v == null || v === "") return null;
  const x = typeof v === "number" ? v : Number(v);
  return Number.isFinite(x) ? x : null;
}

/**
 * Arrondi au conditionnement uniquement si packagingSize > 0 est fourni.
 * Ne jamais inventer une taille de palette.
 */
export function roundToPackaging(
  quantity: number,
  packagingSize: number | null | undefined,
): { roundedQty: number; packages: number | null } {
  const size = n(packagingSize);
  if (size == null || size <= 0 || !Number.isFinite(quantity) || quantity < 0) {
    return { roundedQty: quantity, packages: null };
  }
  const packages = Math.ceil(quantity / size - 1e-12);
  return { roundedQty: packages * size, packages };
}

/**
 * Applique un taux de perte uniquement s’il est explicitement fourni (≥ 0).
 * null / undefined → pas de perte inventée.
 */
export function applyLossFactor(
  baseQty: number,
  lossFactor: number | null | undefined,
): number {
  const lf = n(lossFactor);
  if (lf == null || lf < 0) return baseQty;
  return baseQty * (1 + lf);
}

/**
 * Quantité de commande proposée à partir du calcul + perte + conditionnement.
 * Ne remplace jamais sourceQuantity.
 */
export function proposeOrderQuantity(input: {
  calculatedQuantity: number | null;
  sourceQuantity: number | null;
  lossFactor: number | null;
  packagingSize: number | null;
}): {
  proposed: number | null;
  withLoss: number | null;
  packages: number | null;
  basis: "calculated" | "source" | null;
} {
  const basisQty =
    input.calculatedQuantity != null && Number.isFinite(input.calculatedQuantity)
      ? input.calculatedQuantity
      : input.sourceQuantity != null && Number.isFinite(input.sourceQuantity)
        ? input.sourceQuantity
        : null;
  if (basisQty == null) {
    return { proposed: null, withLoss: null, packages: null, basis: null };
  }
  const basis: "calculated" | "source" =
    input.calculatedQuantity != null && Number.isFinite(input.calculatedQuantity)
      ? "calculated"
      : "source";
  const withLoss = applyLossFactor(basisQty, input.lossFactor);
  const { roundedQty, packages } = roundToPackaging(withLoss, input.packagingSize);
  return { proposed: roundedQty, withLoss, packages, basis };
}

/** Écart métré vs commandé — affichage uniquement, pas d’auto-écriture. */
export function quantityDriftGap(input: {
  newRequiredQty: number;
  orderedQty: number;
}): { delta: number; needsComplement: boolean; overOrdered: boolean } {
  const need = Math.max(0, Number(input.newRequiredQty) || 0);
  const ordered = Math.max(0, Number(input.orderedQty) || 0);
  const delta = need - ordered;
  return {
    delta,
    needsComplement: delta > 1e-9,
    overOrdered: ordered > need + 1e-9,
  };
}

/**
 * Coût rendu chantier : total uniquement si tous les composants listés sont connus.
 * fees absents → UNKNOWN, jamais 0 inventé.
 */
export function buildRenderedCost(input: {
  productCostHt: number | null;
  deliveryFeeHt?: number | null;
  craneFeeHt?: number | null;
  otherFeesHt?: number | null;
  includeDelivery?: boolean;
  includeCrane?: boolean;
  includeOther?: boolean;
}): SupplyRenderedCost {
  const lines: SupplyRenderedCost["lines"] = [
    {
      label: "Produit",
      amountHt: input.productCostHt,
      status: input.productCostHt != null && Number.isFinite(input.productCostHt) ? "KNOWN" : "UNKNOWN",
    },
  ];
  if (input.includeDelivery !== false) {
    lines.push({
      label: "Livraison",
      amountHt: input.deliveryFeeHt ?? null,
      status:
        input.deliveryFeeHt != null && Number.isFinite(input.deliveryFeeHt)
          ? "KNOWN"
          : "UNKNOWN",
    });
  }
  if (input.includeCrane) {
    lines.push({
      label: "Grutage",
      amountHt: input.craneFeeHt ?? null,
      status:
        input.craneFeeHt != null && Number.isFinite(input.craneFeeHt)
          ? "KNOWN"
          : "UNKNOWN",
    });
  }
  if (input.includeOther) {
    lines.push({
      label: "Autres frais",
      amountHt: input.otherFeesHt ?? null,
      status:
        input.otherFeesHt != null && Number.isFinite(input.otherFeesHt)
          ? "KNOWN"
          : "UNKNOWN",
    });
  }

  const known = lines.filter((l) => l.status === "KNOWN");
  if (known.length === 0) {
    return { lines, totalHt: null, completeness: "EMPTY" };
  }
  if (known.length < lines.length) {
    return { lines, totalHt: null, completeness: "PARTIAL" };
  }
  const totalHt = known.reduce((s, l) => s + (l.amountHt ?? 0), 0);
  return { lines, totalHt, completeness: "COMPLETE" };
}

export function resolveValidatedOrderQuantity(q: {
  quantityRequired: unknown;
  validatedOrderQuantity?: unknown;
}): number {
  const validated = n(q.validatedOrderQuantity);
  if (validated != null && validated > 0) return validated;
  return Math.max(0, n(q.quantityRequired) ?? 0);
}

export function toSupplyQuantities(row: {
  quantityRequired: unknown;
  unit: string;
  lossFactor?: unknown;
  sourceQuantity?: unknown;
  sourceUnit?: string | null;
  calculatedQuantity?: unknown;
  validatedOrderQuantity?: unknown;
  packaging?: string | null;
  packagingSize?: unknown;
  packagingUnit?: string | null;
}): SupplyQuantities {
  return {
    sourceQuantity: n(row.sourceQuantity),
    sourceUnit: row.sourceUnit?.trim() || null,
    calculatedQuantity: n(row.calculatedQuantity),
    validatedOrderQuantity: resolveValidatedOrderQuantity(row),
    orderUnit: row.unit,
    lossFactor: n(row.lossFactor),
    packaging: row.packaging?.trim() || null,
    packagingSize: n(row.packagingSize),
    packagingUnit: row.packagingUnit?.trim() || null,
  };
}
