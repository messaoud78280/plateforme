-- Approvisionnements Phase 1 — extension MaterialRequirement (SupplyNeed)
-- + agences fournisseur (parentExternalOrgId)
-- Non destructif. Aucun prix inventé. Aucun backfill fictif.

-- ── Enums nouveaux ──────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE "MaterialRequirementCategory" AS ENUM (
    'MATERIAL',
    'CONSUMABLE',
    'EQUIPMENT_RENTAL',
    'WASTE',
    'TRANSPORT',
    'EXTERNAL_SERVICE',
    'OTHER'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "MaterialRequirementProcurementMode" AS ENUM (
    'ACHAT',
    'LOCATION',
    'SOUS_TRAITANCE',
    'STOCK_ENTREPRISE',
    'REEMPLOI'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "MaterialRequirementSourceDrift" AS ENUM (
    'NONE',
    'METRE_CHANGED',
    'METRE_CHANGED_AFTER_ORDER'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Statuts métier pré-commande (VALIDATED legacy conservé)
DO $$ BEGIN
  ALTER TYPE "MaterialRequirementStatus" ADD VALUE IF NOT EXISTS 'TO_CONSULT';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TYPE "MaterialRequirementStatus" ADD VALUE IF NOT EXISTS 'TO_ORDER';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Provenance source étendue
DO $$ BEGIN
  ALTER TYPE "MaterialRequirementSourceType" ADD VALUE IF NOT EXISTS 'TAKEOFF_LINE';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TYPE "MaterialRequirementSourceType" ADD VALUE IF NOT EXISTS 'SCHEDULE_TASK';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TYPE "MaterialRequirementSourceType" ADD VALUE IF NOT EXISTS 'HYPOTHESIS';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── ExternalOrganization : agences (parent) ─────────────────────────────────
ALTER TABLE "ExternalOrganization"
  ADD COLUMN IF NOT EXISTS "parentExternalOrgId" TEXT;

DO $$ BEGIN
  ALTER TABLE "ExternalOrganization"
    ADD CONSTRAINT "ExternalOrganization_parentExternalOrgId_fkey"
    FOREIGN KEY ("parentExternalOrgId") REFERENCES "ExternalOrganization"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "ExternalOrganization_parentExternalOrgId_idx"
  ON "ExternalOrganization"("parentExternalOrgId");

CREATE INDEX IF NOT EXISTS "ExternalOrganization_hostOrganizationId_parentExternalOrgId_idx"
  ON "ExternalOrganization"("hostOrganizationId", "parentExternalOrgId");

-- ── MaterialRequirement : champs SupplyNeed ─────────────────────────────────
ALTER TABLE "MaterialRequirement"
  ADD COLUMN IF NOT EXISTS "category" "MaterialRequirementCategory" NOT NULL DEFAULT 'MATERIAL',
  ADD COLUMN IF NOT EXISTS "procurementMode" "MaterialRequirementProcurementMode" NOT NULL DEFAULT 'ACHAT',
  ADD COLUMN IF NOT EXISTS "description" TEXT,
  ADD COLUMN IF NOT EXISTS "sourceQuantity" DECIMAL(14,3),
  ADD COLUMN IF NOT EXISTS "sourceUnit" TEXT,
  ADD COLUMN IF NOT EXISTS "calculatedQuantity" DECIMAL(14,3),
  ADD COLUMN IF NOT EXISTS "validatedOrderQuantity" DECIMAL(14,3),
  ADD COLUMN IF NOT EXISTS "packaging" TEXT,
  ADD COLUMN IF NOT EXISTS "packagingSize" DECIMAL(14,3),
  ADD COLUMN IF NOT EXISTS "packagingUnit" TEXT,
  ADD COLUMN IF NOT EXISTS "takeoffCodes" JSONB,
  ADD COLUMN IF NOT EXISTS "scheduleTaskIds" JSONB,
  ADD COLUMN IF NOT EXISTS "prepStudyId" TEXT,
  ADD COLUMN IF NOT EXISTS "schedulePlanId" TEXT,
  ADD COLUMN IF NOT EXISTS "sourceFingerprint" TEXT,
  ADD COLUMN IF NOT EXISTS "sourceDrift" "MaterialRequirementSourceDrift" NOT NULL DEFAULT 'NONE',
  ADD COLUMN IF NOT EXISTS "orderDeadlineAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "supplierLeadTimeDays" DECIMAL(8,2),
  ADD COLUMN IF NOT EXISTS "notes" TEXT;

-- Backfill : quantité validée = quantité legacy (aucune invention)
UPDATE "MaterialRequirement"
SET "validatedOrderQuantity" = "quantityRequired"
WHERE "validatedOrderQuantity" IS NULL;

CREATE INDEX IF NOT EXISTS "MaterialRequirement_organizationId_projectId_category_idx"
  ON "MaterialRequirement"("organizationId", "projectId", "category");

CREATE INDEX IF NOT EXISTS "MaterialRequirement_prepStudyId_idx"
  ON "MaterialRequirement"("prepStudyId");

CREATE INDEX IF NOT EXISTS "MaterialRequirement_schedulePlanId_idx"
  ON "MaterialRequirement"("schedulePlanId");

CREATE INDEX IF NOT EXISTS "MaterialRequirement_sourceDrift_idx"
  ON "MaterialRequirement"("sourceDrift");
