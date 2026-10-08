import type { SupplyCategory } from "@/lib/supply/types";

export const SUPPLY_CATEGORY_LABELS: Record<SupplyCategory, string> = {
  MATERIAL: "Matériaux",
  CONSUMABLE: "Consommables",
  EQUIPMENT_RENTAL: "Engins & locations",
  WASTE: "Évacuations",
  TRANSPORT: "Transport & livraisons",
  EXTERNAL_SERVICE: "Prestations extérieures",
  OTHER: "Autres",
};

export const SUPPLY_CATEGORY_OPTIONS = (
  Object.keys(SUPPLY_CATEGORY_LABELS) as SupplyCategory[]
).map((id) => ({ id, label: SUPPLY_CATEGORY_LABELS[id] }));

export const SUPPLY_PROCUREMENT_LABELS: Record<string, string> = {
  ACHAT: "Achat",
  LOCATION: "Location",
  SOUS_TRAITANCE: "Sous-traitance",
  STOCK_ENTREPRISE: "Stock entreprise",
  REEMPLOI: "Réemploi",
};

export const SUPPLY_NEED_STATUS_LABELS: Record<string, string> = {
  PROPOSED: "Proposé",
  TO_CONSULT: "À consulter",
  TO_ORDER: "À commander",
  VALIDATED: "Validé",
  CANCELLED: "Annulé",
};

/** Catégories compatibles « Préparer commande » (legacy PurchaseOrder / MATERIAUX-V1B). */
export const SUPPLY_PO_COMPATIBLE_CATEGORIES = new Set<SupplyCategory>([
  "MATERIAL",
  "CONSUMABLE",
  "OTHER",
]);

export function isPurchaseOrderCompatibleCategory(
  category: string | null | undefined,
): boolean {
  if (!category) return true; // legacy MATERIAL implicite
  return SUPPLY_PO_COMPATIBLE_CATEGORIES.has(category as SupplyCategory);
}
