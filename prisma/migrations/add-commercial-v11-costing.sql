-- GESTION COMMERCIALE V1.1 — chiffrage BTP (non destructive)

-- Amendment: À valider
DO $$ BEGIN
  ALTER TYPE "CommercialAmendmentStatus" ADD VALUE IF NOT EXISTS 'TO_VALIDATE';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Org settings
ALTER TABLE "CommercialOrgSettings"
  ADD COLUMN IF NOT EXISTS "minMarginPercent" DECIMAL(8,4),
  ADD COLUMN IF NOT EXISTS "defaultValidityDays" INTEGER,
  ADD COLUMN IF NOT EXISTS "defaultDepositPercent" DECIMAL(6,4),
  ADD COLUMN IF NOT EXISTS "workDayHours" DECIMAL(6,2) NOT NULL DEFAULT 8,
  ADD COLUMN IF NOT EXISTS "quoteMentions" TEXT,
  ADD COLUMN IF NOT EXISTS "invoiceMentions" TEXT,
  ADD COLUMN IF NOT EXISTS "accentColor" TEXT,
  ADD COLUMN IF NOT EXISTS "creditPrefix" TEXT NOT NULL DEFAULT 'AVO',
  ADD COLUMN IF NOT EXISTS "nextCreditSeq" INTEGER NOT NULL DEFAULT 1;

-- Quote line snapshot composition
ALTER TABLE "CommercialQuoteLine"
  ADD COLUMN IF NOT EXISTS "compositionSnapshotJson" JSONB;

-- Work items
ALTER TABLE "CommercialWorkItem"
  ADD COLUMN IF NOT EXISTS "tags" TEXT,
  ADD COLUMN IF NOT EXISTS "kind" TEXT NOT NULL DEFAULT 'SIMPLE',
  ADD COLUMN IF NOT EXISTS "feesPercent" DECIMAL(8,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "feesAmountHt" DECIMAL(14,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "sellMode" TEXT NOT NULL DEFAULT 'MARGIN',
  ADD COLUMN IF NOT EXISTS "needsPriceRecalc" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "createdById" TEXT;

CREATE INDEX IF NOT EXISTS "CommercialWorkItem_organizationId_reference_idx"
  ON "CommercialWorkItem"("organizationId", "reference");
CREATE INDEX IF NOT EXISTS "CommercialWorkItem_createdById_idx"
  ON "CommercialWorkItem"("createdById");

DO $$ BEGIN
  ALTER TABLE "CommercialWorkItem"
    ADD CONSTRAINT "CommercialWorkItem_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Components
ALTER TABLE "CommercialWorkItemComponent"
  ADD COLUMN IF NOT EXISTS "lossPercent" DECIMAL(8,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "comment" TEXT,
  ADD COLUMN IF NOT EXISTS "subcontractorExternalOrgId" TEXT;

CREATE INDEX IF NOT EXISTS "CommercialWorkItemComponent_materialId_idx"
  ON "CommercialWorkItemComponent"("materialId");
CREATE INDEX IF NOT EXISTS "CommercialWorkItemComponent_laborId_idx"
  ON "CommercialWorkItemComponent"("laborId");
CREATE INDEX IF NOT EXISTS "CommercialWorkItemComponent_equipmentId_idx"
  ON "CommercialWorkItemComponent"("equipmentId");

DO $$ BEGIN
  ALTER TABLE "CommercialWorkItemComponent"
    ADD CONSTRAINT "CommercialWorkItemComponent_subcontractorExternalOrgId_fkey"
    FOREIGN KEY ("subcontractorExternalOrgId") REFERENCES "ExternalOrganization"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Materials
ALTER TABLE "CommercialMaterial"
  ADD COLUMN IF NOT EXISTS "manufacturer" TEXT,
  ADD COLUMN IF NOT EXISTS "priceSource" TEXT;

CREATE INDEX IF NOT EXISTS "CommercialMaterial_organizationId_reference_idx"
  ON "CommercialMaterial"("organizationId", "reference");
CREATE INDEX IF NOT EXISTS "CommercialMaterial_organizationId_family_idx"
  ON "CommercialMaterial"("organizationId", "family");

ALTER TABLE "CommercialMaterialPrice"
  ADD COLUMN IF NOT EXISTS "supplierName" TEXT;

-- Labor
ALTER TABLE "CommercialLaborResource"
  ADD COLUMN IF NOT EXISTS "trade" TEXT,
  ADD COLUMN IF NOT EXISTS "qualification" TEXT;

-- Equipment
ALTER TABLE "CommercialEquipmentResource"
  ADD COLUMN IF NOT EXISTS "category" TEXT;
