-- CONTRATS-ANNUELS-1 — Contrats d’intervention annuels (CE / CA)
-- Additive, multi-tenant, sans perte de données.

DO $$ BEGIN
  CREATE TYPE "AnnualContractStatus" AS ENUM ('ACTIVE', 'TERMINATING', 'TERMINATED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "AnnualInterventionStatus" AS ENUM ('TO_PREPARE', 'SCHEDULED', 'COMPLETED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "AnnualServiceContract" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "clientName" TEXT NOT NULL,
  "siteName" TEXT,
  "siteAddress" TEXT NOT NULL,
  "contractType" TEXT NOT NULL DEFAULT 'CE',
  "amountHt" DECIMAL(14,2) NOT NULL,
  "plannedCrewCount" INTEGER,
  "plannedDuration" TEXT,
  "comment" TEXT,
  "status" "AnnualContractStatus" NOT NULL DEFAULT 'ACTIVE',
  "nextPlannedDate" DATE,
  "projectId" TEXT,
  "demoKey" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AnnualServiceContract_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AnnualServiceIntervention" (
  "id" TEXT NOT NULL,
  "contractId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "plannedDate" DATE NOT NULL,
  "completedAt" TIMESTAMP(3),
  "plannedCrewCount" INTEGER,
  "actualCrewCount" INTEGER,
  "plannedDuration" TEXT,
  "status" "AnnualInterventionStatus" NOT NULL DEFAULT 'TO_PREPARE',
  "comment" TEXT,
  "agendaEventId" TEXT,
  "followUpSheetId" TEXT,
  "billingNeededAt" TIMESTAMP(3),
  "billedAt" TIMESTAMP(3),
  "commercialInvoiceId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AnnualServiceIntervention_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AnnualServiceContract_organizationId_demoKey_key"
  ON "AnnualServiceContract"("organizationId", "demoKey");

CREATE INDEX IF NOT EXISTS "AnnualServiceContract_organizationId_status_idx"
  ON "AnnualServiceContract"("organizationId", "status");

CREATE INDEX IF NOT EXISTS "AnnualServiceContract_organizationId_nextPlannedDate_idx"
  ON "AnnualServiceContract"("organizationId", "nextPlannedDate");

CREATE INDEX IF NOT EXISTS "AnnualServiceContract_projectId_idx"
  ON "AnnualServiceContract"("projectId");

CREATE INDEX IF NOT EXISTS "AnnualServiceIntervention_organizationId_plannedDate_idx"
  ON "AnnualServiceIntervention"("organizationId", "plannedDate");

CREATE INDEX IF NOT EXISTS "AnnualServiceIntervention_organizationId_status_idx"
  ON "AnnualServiceIntervention"("organizationId", "status");

CREATE INDEX IF NOT EXISTS "AnnualServiceIntervention_contractId_plannedDate_idx"
  ON "AnnualServiceIntervention"("contractId", "plannedDate");

CREATE INDEX IF NOT EXISTS "AnnualServiceIntervention_agendaEventId_idx"
  ON "AnnualServiceIntervention"("agendaEventId");

CREATE INDEX IF NOT EXISTS "AnnualServiceIntervention_followUpSheetId_idx"
  ON "AnnualServiceIntervention"("followUpSheetId");

DO $$ BEGIN
  ALTER TABLE "AnnualServiceContract"
    ADD CONSTRAINT "AnnualServiceContract_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "AnnualServiceContract"
    ADD CONSTRAINT "AnnualServiceContract_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "AnnualServiceIntervention"
    ADD CONSTRAINT "AnnualServiceIntervention_contractId_fkey"
    FOREIGN KEY ("contractId") REFERENCES "AnnualServiceContract"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
