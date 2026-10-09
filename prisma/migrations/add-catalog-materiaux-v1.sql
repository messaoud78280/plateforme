-- Catalogue Matériaux V1 — ADDITIVE, non destructif.
-- Distinct de WorkItem / SiteResource / CommercialMaterial.

DO $$ BEGIN
  CREATE TYPE "CatalogMaterialStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "CatalogProductStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "CatalogMaterial" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "family" TEXT NOT NULL,
  "designation" TEXT NOT NULL,
  "designationNormalized" TEXT NOT NULL,
  "unit" TEXT NOT NULL DEFAULT 'U',
  "description" TEXT,
  "techAttributes" JSONB,
  "status" "CatalogMaterialStatus" NOT NULL DEFAULT 'DRAFT',
  "notes" TEXT,
  "createdById" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "CatalogMaterial_organizationId_status_idx"
  ON "CatalogMaterial"("organizationId", "status");
CREATE INDEX IF NOT EXISTS "CatalogMaterial_organizationId_family_idx"
  ON "CatalogMaterial"("organizationId", "family");
CREATE INDEX IF NOT EXISTS "CatalogMaterial_organizationId_designationNormalized_idx"
  ON "CatalogMaterial"("organizationId", "designationNormalized");
CREATE INDEX IF NOT EXISTS "CatalogMaterial_createdById_idx"
  ON "CatalogMaterial"("createdById");

CREATE TABLE IF NOT EXISTS "CatalogProduct" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "catalogMaterialId" TEXT NOT NULL REFERENCES "CatalogMaterial"("id") ON DELETE CASCADE,
  "manufacturer" TEXT,
  "manufacturerNormalized" TEXT,
  "manufacturerRef" TEXT,
  "manufacturerRefNormalized" TEXT,
  "gtin" TEXT,
  "label" TEXT NOT NULL,
  "dimensions" TEXT,
  "performances" TEXT,
  "techAttributes" JSONB,
  "imageUrl" TEXT,
  "imageOrigin" TEXT,
  "sourceUrl" TEXT,
  "status" "CatalogProductStatus" NOT NULL DEFAULT 'DRAFT',
  "notes" TEXT,
  "createdById" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "CatalogProduct_organizationId_status_idx"
  ON "CatalogProduct"("organizationId", "status");
CREATE INDEX IF NOT EXISTS "CatalogProduct_organizationId_catalogMaterialId_idx"
  ON "CatalogProduct"("organizationId", "catalogMaterialId");
CREATE INDEX IF NOT EXISTS "CatalogProduct_organizationId_mfr_ref_idx"
  ON "CatalogProduct"("organizationId", "manufacturerNormalized", "manufacturerRefNormalized");
CREATE INDEX IF NOT EXISTS "CatalogProduct_organizationId_gtin_idx"
  ON "CatalogProduct"("organizationId", "gtin");
CREATE INDEX IF NOT EXISTS "CatalogProduct_createdById_idx"
  ON "CatalogProduct"("createdById");

-- Unicité soft→forte : fabricant+réf non vides, par organisation
CREATE UNIQUE INDEX IF NOT EXISTS "CatalogProduct_org_mfr_ref_unique"
  ON "CatalogProduct"("organizationId", "manufacturerNormalized", "manufacturerRefNormalized")
  WHERE "manufacturerNormalized" IS NOT NULL
    AND "manufacturerRefNormalized" IS NOT NULL
    AND "status" <> 'ARCHIVED';

CREATE UNIQUE INDEX IF NOT EXISTS "CatalogProduct_org_gtin_unique"
  ON "CatalogProduct"("organizationId", "gtin")
  WHERE "gtin" IS NOT NULL
    AND "status" <> 'ARCHIVED';

CREATE TABLE IF NOT EXISTS "CatalogSupplierOffer" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "catalogProductId" TEXT NOT NULL REFERENCES "CatalogProduct"("id") ON DELETE CASCADE,
  "supplierExternalOrgId" TEXT NOT NULL REFERENCES "ExternalOrganization"("id") ON DELETE RESTRICT,
  "priceUnit" TEXT NOT NULL DEFAULT 'U',
  "packagingLabel" TEXT,
  "unitsPerPack" DECIMAL(14,3),
  "minimumOrderQuantity" DECIMAL(14,3),
  "leadTimeDays" DECIMAL(8,2),
  "availabilityNote" TEXT,
  "deliveryFee" DECIMAL(14,2),
  "craneFee" DECIMAL(14,2),
  "otherFees" DECIMAL(14,2),
  "sourceUrl" TEXT,
  "priceSourceType" TEXT,
  "quoteNumber" TEXT,
  "quoteDocumentRef" TEXT,
  "sourceNote" TEXT,
  "imageUrl" TEXT,
  "imageOrigin" TEXT,
  "archivedAt" TIMESTAMP(3),
  "createdById" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "CatalogSupplierOffer_organizationId_catalogProductId_idx"
  ON "CatalogSupplierOffer"("organizationId", "catalogProductId");
CREATE INDEX IF NOT EXISTS "CatalogSupplierOffer_organizationId_supplierExternalOrgId_idx"
  ON "CatalogSupplierOffer"("organizationId", "supplierExternalOrgId");
CREATE INDEX IF NOT EXISTS "CatalogSupplierOffer_organizationId_archivedAt_idx"
  ON "CatalogSupplierOffer"("organizationId", "archivedAt");
CREATE INDEX IF NOT EXISTS "CatalogSupplierOffer_createdById_idx"
  ON "CatalogSupplierOffer"("createdById");

CREATE TABLE IF NOT EXISTS "CatalogPriceObservation" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "catalogSupplierOfferId" TEXT NOT NULL REFERENCES "CatalogSupplierOffer"("id") ON DELETE CASCADE,
  "unitPrice" DECIMAL(14,4),
  "priceUnit" TEXT NOT NULL DEFAULT 'U',
  "priceTaxMode" TEXT NOT NULL DEFAULT 'HT',
  "vatRate" DECIMAL(5,2),
  "observedAt" TIMESTAMP(3),
  "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "validUntil" TIMESTAMP(3),
  "priceSourceType" TEXT NOT NULL,
  "sourceUrl" TEXT,
  "quoteNumber" TEXT,
  "quoteDocumentRef" TEXT,
  "sourceNote" TEXT,
  "sourceSupplyOfferId" TEXT,
  "recordedById" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "CatalogPriceObservation_org_offer_recorded_idx"
  ON "CatalogPriceObservation"("organizationId", "catalogSupplierOfferId", "recordedAt");
CREATE INDEX IF NOT EXISTS "CatalogPriceObservation_offer_observed_idx"
  ON "CatalogPriceObservation"("catalogSupplierOfferId", "observedAt");
CREATE INDEX IF NOT EXISTS "CatalogPriceObservation_sourceSupplyOfferId_idx"
  ON "CatalogPriceObservation"("sourceSupplyOfferId");
CREATE INDEX IF NOT EXISTS "CatalogPriceObservation_recordedById_idx"
  ON "CatalogPriceObservation"("recordedById");
