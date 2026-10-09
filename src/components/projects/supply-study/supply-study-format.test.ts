/**
 * Tests purs — justification prix étude d’approvisionnement.
 */
import assert from "node:assert/strict";
import { formatProductSubtotalLabel } from "@/lib/supply/offer-cost";
import {
  isJustifiedPricedOffer,
  normalizeOfferUrl,
  qualifyOfferSourceLabel,
  validateProductUrl,
} from "./supply-study-format";
import type { SupplyOfferView } from "@/lib/supply/offer-types";

function base(over: Partial<SupplyOfferView> = {}): SupplyOfferView {
  return {
    id: "o1",
    organizationId: "org",
    requirementId: "r1",
    supplierExternalOrgId: "s1",
    supplierName: "Test",
    supplierTradeName: null,
    parentSupplierName: null,
    agencyDisplay: "Test",
    productLabel: "Bloc",
    productRef: null,
    techAttributes: null,
    equivalenceStatus: "TO_VERIFY",
    unitPrice: 1.5,
    priceUnit: "U",
    priceTaxMode: "HT",
    vatRate: null,
    priceSourceType: "WEB_VERIFIED",
    sourceUrl: "https://example.com/p",
    quoteNumber: null,
    quoteDocumentRef: null,
    sourceNote: null,
    observedAt: "2026-10-08",
    recordedAt: "2026-10-08",
    validUntil: null,
    recordedById: null,
    recordedByName: null,
    packagingLabel: null,
    unitsPerPack: null,
    minimumOrderQuantity: null,
    leadTimeDays: null,
    availabilityNote: null,
    deliveryFee: null,
    craneFee: null,
    otherFees: null,
    archivedAt: null,
    isSelected: false,
    freshness: "FRESH",
    productCost: {
      amount: 1.5,
      taxMode: "HT",
      status: "KNOWN",
      reason: null,
      displayLabel: "Sous-total produit : 1,50 € HT — hors livraison",
    },
    renderedCost: {
      knownTotal: null,
      completeness: "PARTIAL",
      missingLabels: ["Livraison"],
      displayLabel: "Coût rendu chantier non disponible",
    },
    packagingProposal: null,
    productImageUrl: null,
    productImageOrigin: null,
    productImageDisplayUrl: null,
    priceHistory: [],
    createdAt: "2026-10-08",
    updatedAt: "2026-10-08",
    ...over,
  };
}

{
  assert.equal(qualifyOfferSourceLabel(base()), "Prix web relevé");
  assert.equal(
    qualifyOfferSourceLabel(base({ unitPrice: null })),
    "Produit sourcé, prix non renseigné",
  );
  assert.equal(
    qualifyOfferSourceLabel(
      base({
        priceSourceType: "SUPPLIER_QUOTE",
        sourceUrl: null,
        quoteNumber: "D-9",
      }),
    ),
    "Offre sur devis",
  );
  console.log("qualifyOfferSourceLabel OK");
}

{
  assert.equal(isJustifiedPricedOffer(base()), true);
  assert.equal(
    isJustifiedPricedOffer(base({ sourceUrl: null })),
    false,
    "WEB_VERIFIED sans URL",
  );
  assert.equal(
    isJustifiedPricedOffer(base({ unitPrice: null })),
    false,
    "sans prix",
  );
  assert.equal(
    isJustifiedPricedOffer(
      base({
        priceSourceType: "SUPPLIER_QUOTE",
        sourceUrl: null,
        quoteNumber: "D-1",
      }),
    ),
    true,
  );
  assert.equal(
    isJustifiedPricedOffer(
      base({
        priceSourceType: "SUPPLIER_QUOTE",
        sourceUrl: null,
        quoteNumber: null,
        quoteDocumentRef: null,
      }),
    ),
    false,
  );
  console.log("isJustifiedPricedOffer OK");
}

{
  const v = validateProductUrl("https://www.pointp.fr/x");
  assert.equal(v.ok, true);
  assert.equal(validateProductUrl("ftp://x").ok, false);
  assert.equal(validateProductUrl("pas-une-url").ok, false);
  assert.ok(normalizeOfferUrl("https://A.com/Path/")?.includes("a.com"));
  console.log("URL helpers OK");
}

{
  const withDeliveryUnknown = formatProductSubtotalLabel({
    amount: 210.93,
    taxMode: "TTC",
    status: "KNOWN",
    deliveryFee: null,
  });
  assert.match(withDeliveryUnknown, /210,93/);
  assert.match(withDeliveryUnknown, /TTC/);
  assert.match(withDeliveryUnknown, /hors livraison/);

  const withDelivery = formatProductSubtotalLabel({
    amount: 210.93,
    taxMode: "TTC",
    status: "KNOWN",
    deliveryFee: 40,
  });
  assert.match(withDelivery, /210,93/);
  assert.doesNotMatch(withDelivery, /hors livraison/);

  assert.equal(
    formatProductSubtotalLabel({
      amount: null,
      taxMode: "HT",
      status: "UNKNOWN",
      deliveryFee: null,
    }),
    "Sous-total produit non calculable",
  );
  console.log("formatProductSubtotalLabel OK");
}

console.log("supply-study-format tests OK");
