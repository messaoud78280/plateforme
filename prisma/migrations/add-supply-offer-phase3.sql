-- Approvisionnements Phase 3 — SupplyOffer + MaterialRequirement.selectedOfferId
-- Non destructif. Aucun prix inventé. Aucune donnée métier supprimée.

-- ── Enums ────────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE "SupplyOfferEquivalenceStatus" AS ENUM (
    'TO_VERIFY',
    'PROBABLE',
    'CONFIRMED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "SupplyOfferPriceTaxMode" AS ENUM (
    'HT',
    'TTC'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "SupplyOfferPriceSourceType" AS ENUM (
    'WEB_VERIFIED',
    'SUPPLIER_QUOTE',
    'USER_ENTERED',
    'IMPORT'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Table SupplyOffer ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "SupplyOffer" (
  "id"                    TEXT NOT NULL,
  "organizationId"        TEXT NOT NULL,
  "requirementId"         TEXT NOT NULL,
  "supplierExternalOrgId" TEXT NOT NULL,

  "productLabel"          TEXT NOT NULL,
  "productRef"            TEXT,
  "techAttributes"        JSONB,
  "equivalenceStatus"     "SupplyOfferEquivalenceStatus" NOT NULL DEFAULT 'TO_VERIFY',

  "unitPrice"             DECIMAL(14,4),
  "priceUnit"             TEXT NOT NULL DEFAULT 'U',
  "priceTaxMode"          "SupplyOfferPriceTaxMode" NOT NULL DEFAULT 'HT',
  "vatRate"               DECIMAL(5,2),

  "priceSourceType"       "SupplyOfferPriceSourceType" NOT NULL,
  "sourceUrl"             TEXT,
  "quoteNumber"           TEXT,
  "quoteDocumentRef"      TEXT,
  "sourceNote"            TEXT,
  "observedAt"            TIMESTAMP(3),
  "recordedAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "validUntil"            TIMESTAMP(3),
  "recordedById"          TEXT,

  "packagingLabel"        TEXT,
  "unitsPerPack"          DECIMAL(14,3),
  "minimumOrderQuantity"  DECIMAL(14,3),

  "leadTimeDays"          DECIMAL(8,2),
  "availabilityNote"      TEXT,
  "deliveryFee"           DECIMAL(14,2),
  "craneFee"              DECIMAL(14,2),
  "otherFees"             DECIMAL(14,2),

  "archivedAt"            TIMESTAMP(3),
  "createdAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "SupplyOffer_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "SupplyOffer"
    ADD CONSTRAINT "SupplyOffer_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "SupplyOffer"
    ADD CONSTRAINT "SupplyOffer_requirementId_fkey"
    FOREIGN KEY ("requirementId") REFERENCES "MaterialRequirement"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "SupplyOffer"
    ADD CONSTRAINT "SupplyOffer_supplierExternalOrgId_fkey"
    FOREIGN KEY ("supplierExternalOrgId") REFERENCES "ExternalOrganization"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "SupplyOffer"
    ADD CONSTRAINT "SupplyOffer_recordedById_fkey"
    FOREIGN KEY ("recordedById") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "SupplyOffer_organizationId_requirementId_idx"
  ON "SupplyOffer"("organizationId", "requirementId");
CREATE INDEX IF NOT EXISTS "SupplyOffer_requirementId_idx"
  ON "SupplyOffer"("requirementId");
CREATE INDEX IF NOT EXISTS "SupplyOffer_supplierExternalOrgId_idx"
  ON "SupplyOffer"("supplierExternalOrgId");
CREATE INDEX IF NOT EXISTS "SupplyOffer_organizationId_archivedAt_idx"
  ON "SupplyOffer"("organizationId", "archivedAt");
CREATE INDEX IF NOT EXISTS "SupplyOffer_recordedById_idx"
  ON "SupplyOffer"("recordedById");

-- ── Offre retenue (source unique) ────────────────────────────────────────────
ALTER TABLE "MaterialRequirement"
  ADD COLUMN IF NOT EXISTS "selectedOfferId" TEXT;

DO $$ BEGIN
  ALTER TABLE "MaterialRequirement"
    ADD CONSTRAINT "MaterialRequirement_selectedOfferId_key"
    UNIQUE ("selectedOfferId");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "MaterialRequirement"
    ADD CONSTRAINT "MaterialRequirement_selectedOfferId_fkey"
    FOREIGN KEY ("selectedOfferId") REFERENCES "SupplyOffer"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
