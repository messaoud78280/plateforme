-- Bibliothèque V2.1 — prix fournisseurs structurés + prix retenu

ALTER TABLE "CommercialMaterial"
  ADD COLUMN IF NOT EXISTS "referencePriceUpdatedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "preferredSupplierExternalOrgId" TEXT;

ALTER TABLE "CommercialMaterialPrice"
  ADD COLUMN IF NOT EXISTS "supplierExternalOrgId" TEXT,
  ADD COLUMN IF NOT EXISTS "supplierReference" TEXT,
  ADD COLUMN IF NOT EXISTS "purchaseOrderLineId" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'CommercialMaterial_preferredSupplierExternalOrgId_fkey'
  ) THEN
    ALTER TABLE "CommercialMaterial"
      ADD CONSTRAINT "CommercialMaterial_preferredSupplierExternalOrgId_fkey"
      FOREIGN KEY ("preferredSupplierExternalOrgId")
      REFERENCES "ExternalOrganization"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'CommercialMaterialPrice_supplierExternalOrgId_fkey'
  ) THEN
    ALTER TABLE "CommercialMaterialPrice"
      ADD CONSTRAINT "CommercialMaterialPrice_supplierExternalOrgId_fkey"
      FOREIGN KEY ("supplierExternalOrgId")
      REFERENCES "ExternalOrganization"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'CommercialMaterialPrice_purchaseOrderLineId_fkey'
  ) THEN
    ALTER TABLE "CommercialMaterialPrice"
      ADD CONSTRAINT "CommercialMaterialPrice_purchaseOrderLineId_fkey"
      FOREIGN KEY ("purchaseOrderLineId")
      REFERENCES "PurchaseOrderLine"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "CommercialMaterial_preferredSupplierExternalOrgId_idx"
  ON "CommercialMaterial"("preferredSupplierExternalOrgId");

CREATE INDEX IF NOT EXISTS "CommercialMaterialPrice_supplierExternalOrgId_idx"
  ON "CommercialMaterialPrice"("supplierExternalOrgId");

CREATE INDEX IF NOT EXISTS "CommercialMaterialPrice_purchaseOrderLineId_idx"
  ON "CommercialMaterialPrice"("purchaseOrderLineId");

-- Backfill date prix retenu depuis updatedAt si absente
UPDATE "CommercialMaterial"
SET "referencePriceUpdatedAt" = "updatedAt"
WHERE "referencePriceUpdatedAt" IS NULL AND "currentPriceHt" > 0;
