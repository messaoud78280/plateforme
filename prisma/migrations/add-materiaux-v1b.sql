-- MATERIAUX-V1B — Besoins matériaux chantier → commande → réception
-- Non destructif. Aucun backfill inventé.

DO $$ BEGIN
  CREATE TYPE "MaterialRequirementStatus" AS ENUM ('PROPOSED', 'VALIDATED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "MaterialRequirementSourceType" AS ENUM ('MANUAL', 'QUOTE_LINE', 'DOCUMENT', 'DPGF', 'AI_PROPOSAL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "MaterialRequirement" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "siteResourceId" TEXT,
  "quantityRequired" DECIMAL(14,3) NOT NULL,
  "unit" TEXT NOT NULL,
  "lossFactor" DECIMAL(5,4),
  "neededAt" TIMESTAMP(3),
  "status" "MaterialRequirementStatus" NOT NULL DEFAULT 'VALIDATED',
  "sourceType" "MaterialRequirementSourceType" NOT NULL DEFAULT 'MANUAL',
  "sourceId" TEXT,
  "sourceLabel" TEXT,
  "chantierFileId" TEXT,
  "validatedById" TEXT,
  "validatedAt" TIMESTAMP(3),
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MaterialRequirement_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "MaterialRequirement_organizationId_projectId_idx"
  ON "MaterialRequirement"("organizationId", "projectId");
CREATE INDEX IF NOT EXISTS "MaterialRequirement_organizationId_projectId_status_idx"
  ON "MaterialRequirement"("organizationId", "projectId", "status");
CREATE INDEX IF NOT EXISTS "MaterialRequirement_siteResourceId_idx"
  ON "MaterialRequirement"("siteResourceId");
CREATE INDEX IF NOT EXISTS "MaterialRequirement_chantierFileId_idx"
  ON "MaterialRequirement"("chantierFileId");

DO $$ BEGIN
  ALTER TABLE "MaterialRequirement"
    ADD CONSTRAINT "MaterialRequirement_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "MaterialRequirement"
    ADD CONSTRAINT "MaterialRequirement_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "MaterialRequirement"
    ADD CONSTRAINT "MaterialRequirement_siteResourceId_fkey"
    FOREIGN KEY ("siteResourceId") REFERENCES "SiteResource"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "MaterialRequirement"
    ADD CONSTRAINT "MaterialRequirement_chantierFileId_fkey"
    FOREIGN KEY ("chantierFileId") REFERENCES "ChantierFile"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "MaterialRequirement"
    ADD CONSTRAINT "MaterialRequirement_validatedById_fkey"
    FOREIGN KEY ("validatedById") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "MaterialRequirement"
    ADD CONSTRAINT "MaterialRequirement_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "MaterialRequirementOrderLink" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "materialRequirementId" TEXT NOT NULL,
  "purchaseOrderLineId" TEXT NOT NULL,
  "quantityAllocated" DECIMAL(14,3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MaterialRequirementOrderLink_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "MaterialRequirementOrderLink_materialRequirementId_purchaseOrderLineId_key"
  ON "MaterialRequirementOrderLink"("materialRequirementId", "purchaseOrderLineId");
CREATE INDEX IF NOT EXISTS "MaterialRequirementOrderLink_materialRequirementId_idx"
  ON "MaterialRequirementOrderLink"("materialRequirementId");
CREATE INDEX IF NOT EXISTS "MaterialRequirementOrderLink_purchaseOrderLineId_idx"
  ON "MaterialRequirementOrderLink"("purchaseOrderLineId");
CREATE INDEX IF NOT EXISTS "MaterialRequirementOrderLink_organizationId_idx"
  ON "MaterialRequirementOrderLink"("organizationId");

DO $$ BEGIN
  ALTER TABLE "MaterialRequirementOrderLink"
    ADD CONSTRAINT "MaterialRequirementOrderLink_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "MaterialRequirementOrderLink"
    ADD CONSTRAINT "MaterialRequirementOrderLink_materialRequirementId_fkey"
    FOREIGN KEY ("materialRequirementId") REFERENCES "MaterialRequirement"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "MaterialRequirementOrderLink"
    ADD CONSTRAINT "MaterialRequirementOrderLink_purchaseOrderLineId_fkey"
    FOREIGN KEY ("purchaseOrderLineId") REFERENCES "PurchaseOrderLine"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
