-- DF-6D — Sous-traitance simple (suivi contractuel interne chantier)
-- Aucun impact devis / situations / factures / encaissements / CA.

DO $$ BEGIN
  CREATE TYPE "CommercialSubcontractStatus" AS ENUM ('PREPARATION', 'IN_PROGRESS', 'COMPLETED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "CommercialSubcontract" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "externalOrganizationId" TEXT NOT NULL,
  "scope" TEXT NOT NULL,
  "contractAmountHt" DECIMAL(14,4) NOT NULL,
  "status" "CommercialSubcontractStatus" NOT NULL DEFAULT 'PREPARATION',
  "contractRef" TEXT,
  "contractDate" DATE,
  "startDate" DATE,
  "endDate" DATE,
  "contactId" TEXT,
  "notes" TEXT,
  "progressPercent" DECIMAL(6,2),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CommercialSubcontract_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "CommercialSubcontract_organizationId_projectId_idx"
  ON "CommercialSubcontract"("organizationId", "projectId");
CREATE INDEX IF NOT EXISTS "CommercialSubcontract_organizationId_status_idx"
  ON "CommercialSubcontract"("organizationId", "status");
CREATE INDEX IF NOT EXISTS "CommercialSubcontract_projectId_idx"
  ON "CommercialSubcontract"("projectId");
CREATE INDEX IF NOT EXISTS "CommercialSubcontract_externalOrganizationId_idx"
  ON "CommercialSubcontract"("externalOrganizationId");

DO $$ BEGIN
  ALTER TABLE "CommercialSubcontract"
    ADD CONSTRAINT "CommercialSubcontract_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "CommercialSubcontract"
    ADD CONSTRAINT "CommercialSubcontract_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "CommercialSubcontract"
    ADD CONSTRAINT "CommercialSubcontract_externalOrganizationId_fkey"
    FOREIGN KEY ("externalOrganizationId") REFERENCES "ExternalOrganization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "CommercialSubcontract"
    ADD CONSTRAINT "CommercialSubcontract_contactId_fkey"
    FOREIGN KEY ("contactId") REFERENCES "ExternalOrgContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
