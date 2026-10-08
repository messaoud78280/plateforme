/**
 * Approvisionnements Phase 1 — domaine SupplyNeed.
 * Persistance = MaterialRequirement (table inchangée, compat MATERIAUX-V1B / BC).
 * Aucun prix inventé ici (SupplyOffer = phases suivantes).
 */

export const SUPPLY_CATEGORIES = [
  "MATERIAL",
  "CONSUMABLE",
  "EQUIPMENT_RENTAL",
  "WASTE",
  "TRANSPORT",
  "EXTERNAL_SERVICE",
  "OTHER",
] as const;
export type SupplyCategory = (typeof SUPPLY_CATEGORIES)[number];

export const SUPPLY_PROCUREMENT_MODES = [
  "ACHAT",
  "LOCATION",
  "SOUS_TRAITANCE",
  "STOCK_ENTREPRISE",
  "REEMPLOI",
] as const;
export type SupplyProcurementMode = (typeof SUPPLY_PROCUREMENT_MODES)[number];

/** Statuts métier stockés — avant engagement BC uniquement. */
export const SUPPLY_NEED_STATUSES = [
  "PROPOSED",
  "VALIDATED",
  "TO_CONSULT",
  "TO_ORDER",
  "CANCELLED",
] as const;
export type SupplyNeedStatus = (typeof SUPPLY_NEED_STATUSES)[number];

export const SUPPLY_SOURCE_DRIFTS = [
  "NONE",
  "METRE_CHANGED",
  "METRE_CHANGED_AFTER_ORDER",
] as const;
export type SupplySourceDrift = (typeof SUPPLY_SOURCE_DRIFTS)[number];

/**
 * Couverture logistique DÉRIVÉE du BC / réceptions — jamais stockée sur le besoin.
 * Réutilise MaterialCoverageState (progress.ts).
 */
export type SupplyLogisticsDerived =
  | "A_COMMANDER"
  | "PARTIELLEMENT_COMMANDE"
  | "COMMANDE"
  | "PARTIELLEMENT_RECU"
  | "RECU"
  | "ANNULE";

export type SupplyQuantities = {
  /** Quantité source (ex. métré) — ne jamais écraser par hypothèse */
  sourceQuantity: number | null;
  sourceUnit: string | null;
  /** Transformation déterministe (ex. m² → blocs) */
  calculatedQuantity: number | null;
  /** Quantité validée pour commande (= quantityRequired legacy) */
  validatedOrderQuantity: number;
  /** Unité de commande / couverture BC */
  orderUnit: string;
  lossFactor: number | null;
  packaging: string | null;
  packagingSize: number | null;
  packagingUnit: string | null;
};

export type SupplyNeed = {
  id: string;
  organizationId: string;
  projectId: string;
  label: string;
  description: string | null;
  category: SupplyCategory;
  procurementMode: SupplyProcurementMode;
  status: SupplyNeedStatus;
  quantities: SupplyQuantities;
  neededAt: string | null;
  orderDeadlineAt: string | null;
  /** Délai fournisseur réel uniquement — null = pas de calcul deadline */
  supplierLeadTimeDays: number | null;
  takeoffCodes: string[];
  scheduleTaskIds: string[];
  prepStudyId: string | null;
  schedulePlanId: string | null;
  sourceFingerprint: string | null;
  sourceDrift: SupplySourceDrift;
  sourceType: string;
  sourceId: string | null;
  sourceLabel: string | null;
  siteResourceId: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SupplyRenderedCostLine = {
  label: string;
  amountHt: number | null;
  status: "KNOWN" | "UNKNOWN";
};

export type SupplyRenderedCost = {
  lines: SupplyRenderedCostLine[];
  /** Somme uniquement si tous les composants requis sont KNOWN */
  totalHt: number | null;
  completeness: "COMPLETE" | "PARTIAL" | "EMPTY";
};
