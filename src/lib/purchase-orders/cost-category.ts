/**
 * ECO-1 — Catégorie de dépense d’une ligne de commande.
 * Appartient à l’achat, pas au fournisseur. Aucune IA, aucun matching de nom.
 */
import {
  parseSupplierInvoiceCategory,
  type SupplierCostCategory,
} from "@/lib/chantier/supplier-invoices";

export type { SupplierCostCategory };
import { lineTotalHt } from "@/lib/purchase-orders/totals";
import { roundMoney } from "@/lib/commercial/money";

export const PURCHASE_COST_CATEGORIES: SupplierCostCategory[] = [
  "MATERIAL",
  "EQUIPMENT",
  "SUBCONTRACT",
  "OTHER",
  "UNCLASSIFIED",
];

export const PURCHASE_COST_CATEGORY_LABELS: Record<SupplierCostCategory, string> = {
  MATERIAL: "Matériaux",
  EQUIPMENT: "Matériel / location",
  SUBCONTRACT: "Sous-traitance",
  OTHER: "Autres",
  UNCLASSIFIED: "À classer",
};

export function parsePurchaseCostCategory(raw: unknown): SupplierCostCategory {
  if (raw == null || String(raw).trim() === "") return "UNCLASSIFIED";
  return parseSupplierInvoiceCategory(raw);
}

export function resolvePurchaseLineCostCategory(input: {
  costCategory?: string | null;
  hasMaterialRequirement?: boolean;
  defaultCostCategory?: string | null;
}): SupplierCostCategory {
  const explicit = input.costCategory != null && String(input.costCategory).trim() !== ""
    ? parsePurchaseCostCategory(input.costCategory)
    : null;
  if (explicit && explicit !== "UNCLASSIFIED") return explicit;
  if (input.hasMaterialRequirement) return "MATERIAL";
  const fallback = parsePurchaseCostCategory(input.defaultCostCategory ?? null);
  if (fallback !== "UNCLASSIFIED") return fallback;
  return explicit ?? "UNCLASSIFIED";
}

export type PurchaseLineForCommit = {
  quantity: number;
  unitPriceHt?: number | null;
  costCategory?: string | null;
  hasMaterialRequirement?: boolean;
};

export type CommittedByCategory = Record<SupplierCostCategory, number>;

export function emptyCommittedByCategory(): CommittedByCategory {
  return {
    MATERIAL: 0,
    EQUIPMENT: 0,
    SUBCONTRACT: 0,
    OTHER: 0,
    UNCLASSIFIED: 0,
  };
}

/**
 * Ventile l’engagé d’un BC par catégorie de ligne.
 * Ne décide pas si le BC est COMMITTED — appelant uniquement.
 */
export function aggregateCommittedByCategory(input: {
  lines: PurchaseLineForCommit[];
  amountHt?: number | null;
  defaultCostCategory?: string | null;
}): CommittedByCategory {
  const out = emptyCommittedByCategory();
  let linesSum = 0;
  let priced = 0;

  for (const line of input.lines) {
    const ht = lineTotalHt({
      quantity: Number(line.quantity) || 0,
      unitPriceHt: line.unitPriceHt ?? null,
    });
    if (ht == null) continue;
    priced += 1;
    linesSum = roundMoney(linesSum + ht, 2);
    const cat = resolvePurchaseLineCostCategory({
      costCategory: line.costCategory,
      hasMaterialRequirement: Boolean(line.hasMaterialRequirement),
      defaultCostCategory: input.defaultCostCategory,
    });
    out[cat] = roundMoney(out[cat] + ht, 2);
  }

  const header = input.amountHt != null && Number.isFinite(Number(input.amountHt))
    ? roundMoney(Number(input.amountHt), 2)
    : null;

  if (priced === 0 && header != null && header > 0.004) {
    const cat = parsePurchaseCostCategory(input.defaultCostCategory ?? null);
    out[cat] = roundMoney(out[cat] + header, 2);
    return out;
  }

  if (header != null && Math.abs(header - linesSum) > 0.004) {
    const rem = roundMoney(header - linesSum, 2);
    const cat = parsePurchaseCostCategory(input.defaultCostCategory ?? null);
    out[cat] = roundMoney(out[cat] + rem, 2);
  }

  return out;
}

/** Catégorie unique si toutes les lignes classées s’accordent — sinon UNCLASSIFIED. */
export function derivePurchaseOrderInvoiceCategory(input: {
  lines: PurchaseLineForCommit[];
  defaultCostCategory?: string | null;
}): SupplierCostCategory {
  const slices = aggregateCommittedByCategory(input);
  const used = PURCHASE_COST_CATEGORIES.filter(
    (k) => k !== "UNCLASSIFIED" && slices[k] > 0.004,
  );
  if (used.length === 1) return used[0];
  if (used.length === 0) {
    return parsePurchaseCostCategory(input.defaultCostCategory ?? null);
  }
  return "UNCLASSIFIED";
}
