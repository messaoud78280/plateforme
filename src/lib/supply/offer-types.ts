/**
 * Domaine SupplyOffer — Phase 3 Approvisionnements.
 * Aucun prix inventé. null ≠ 0 pour les frais.
 */

export const SUPPLY_OFFER_EQUIVALENCE = [
  "TO_VERIFY",
  "PROBABLE",
  "CONFIRMED",
] as const;
export type SupplyOfferEquivalenceStatus =
  (typeof SUPPLY_OFFER_EQUIVALENCE)[number];

export const SUPPLY_OFFER_PRICE_TAX_MODES = ["HT", "TTC"] as const;
export type SupplyOfferPriceTaxMode =
  (typeof SUPPLY_OFFER_PRICE_TAX_MODES)[number];

export const SUPPLY_OFFER_PRICE_SOURCES = [
  "WEB_VERIFIED",
  "SUPPLIER_QUOTE",
  "USER_ENTERED",
  "IMPORT",
] as const;
export type SupplyOfferPriceSourceType =
  (typeof SUPPLY_OFFER_PRICE_SOURCES)[number];

export const SUPPLY_OFFER_FRESHNESS = [
  "FRESH",
  "TO_REFRESH",
  "EXPIRED",
] as const;
export type SupplyOfferFreshness = (typeof SUPPLY_OFFER_FRESHNESS)[number];

/** Unités tarifaires courantes (string libre autorisé aussi). */
export const SUPPLY_PRICE_UNITS = [
  "U",
  "UNIT",
  "M2",
  "M3",
  "ML",
  "KG",
  "TONNE",
  "PALLET",
  "PACK",
  "DAY",
  "WEEK",
  "FORFAIT",
] as const;

export type SupplyOfferInput = {
  supplierExternalOrgId: string;
  productLabel: string;
  productRef?: string | null;
  techAttributes?: unknown;
  equivalenceStatus?: SupplyOfferEquivalenceStatus;
  unitPrice?: number | null;
  priceUnit?: string | null;
  priceTaxMode?: SupplyOfferPriceTaxMode;
  vatRate?: number | null;
  priceSourceType: SupplyOfferPriceSourceType;
  sourceUrl?: string | null;
  quoteNumber?: string | null;
  quoteDocumentRef?: string | null;
  sourceNote?: string | null;
  observedAt?: Date | string | null;
  recordedAt?: Date | string | null;
  validUntil?: Date | string | null;
  packagingLabel?: string | null;
  unitsPerPack?: number | null;
  minimumOrderQuantity?: number | null;
  leadTimeDays?: number | null;
  availabilityNote?: string | null;
  deliveryFee?: number | null;
  craneFee?: number | null;
  otherFees?: number | null;
};

export type SupplyOfferView = {
  id: string;
  organizationId: string;
  requirementId: string;
  supplierExternalOrgId: string;
  supplierName: string;
  supplierTradeName: string | null;
  parentSupplierName: string | null;
  agencyDisplay: string;
  productLabel: string;
  productRef: string | null;
  techAttributes: unknown;
  equivalenceStatus: SupplyOfferEquivalenceStatus;
  unitPrice: number | null;
  priceUnit: string;
  priceTaxMode: SupplyOfferPriceTaxMode;
  vatRate: number | null;
  priceSourceType: SupplyOfferPriceSourceType;
  sourceUrl: string | null;
  quoteNumber: string | null;
  quoteDocumentRef: string | null;
  sourceNote: string | null;
  observedAt: string | null;
  recordedAt: string;
  validUntil: string | null;
  recordedById: string | null;
  recordedByName: string | null;
  packagingLabel: string | null;
  unitsPerPack: number | null;
  minimumOrderQuantity: number | null;
  leadTimeDays: number | null;
  availabilityNote: string | null;
  deliveryFee: number | null;
  craneFee: number | null;
  otherFees: number | null;
  archivedAt: string | null;
  isSelected: boolean;
  freshness: SupplyOfferFreshness;
  productCost: {
    amount: number | null;
    /** Régime fiscal du montant (jamais converti artificiellement). */
    taxMode: SupplyOfferPriceTaxMode;
    status: "KNOWN" | "UNKNOWN";
    reason: string | null;
    /** Ex. « Sous-total produit : 210,93 € TTC — hors livraison » */
    displayLabel: string;
  };
  renderedCost: {
    knownTotal: number | null;
    completeness: "COMPLETE" | "PARTIAL" | "EMPTY";
    missingLabels: string[];
    displayLabel: string;
  };
  /** Photo produit — storage:// ou https:// ; null = aucune. */
  productImageUrl: string | null;
  /** USER_UPLOAD | USER_URL | SUPPLIER_URL */
  productImageOrigin: string | null;
  /** URL affichable client (proxy auth ou https direct). */
  productImageDisplayUrl: string | null;
  /**
   * Historique des prix précédents (append-only).
   * Ne constitue pas une offre concurrente active.
   */
  priceHistory: SupplyOfferPriceHistoryEntry[];
  packagingProposal: {
    packs: number | null;
    roundedQty: number | null;
    message: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
};

export type SupplyOfferPriceHistoryEntry = {
  unitPrice: number | null;
  priceUnit: string;
  priceTaxMode: SupplyOfferPriceTaxMode;
  priceSourceType: SupplyOfferPriceSourceType;
  observedAt: string | null;
  recordedAt: string | null;
  changedAt: string;
};
