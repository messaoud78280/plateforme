-- PILOTAGE-1 — Budget initial chantier figé

CREATE TABLE IF NOT EXISTS "ProjectBudget" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "sourceQuoteId" TEXT NOT NULL,
  "sourceQuoteNumber" TEXT,
  "snappedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdById" TEXT,
  "marketSellHt" DECIMAL(14,4) NOT NULL,
  "materialsHt" DECIMAL(14,4) NOT NULL DEFAULT 0,
  "laborHt" DECIMAL(14,4) NOT NULL DEFAULT 0,
  "equipmentHt" DECIMAL(14,4) NOT NULL DEFAULT 0,
  "subcontractHt" DECIMAL(14,4) NOT NULL DEFAULT 0,
  "otherHt" DECIMAL(14,4) NOT NULL DEFAULT 0,
  "feesHt" DECIMAL(14,4) NOT NULL DEFAULT 0,
  "totalCostHt" DECIMAL(14,4) NOT NULL DEFAULT 0,
  "plannedMarginHt" DECIMAL(14,4) NOT NULL DEFAULT 0,
  "plannedMarginPercent" DECIMAL(8,4) NOT NULL DEFAULT 0,
  "laborHours" DECIMAL(14,4),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProjectBudget_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ProjectBudget_projectId_key" ON "ProjectBudget"("projectId");
CREATE INDEX IF NOT EXISTS "ProjectBudget_organizationId_idx" ON "ProjectBudget"("organizationId");
CREATE INDEX IF NOT EXISTS "ProjectBudget_sourceQuoteId_idx" ON "ProjectBudget"("sourceQuoteId");
CREATE INDEX IF NOT EXISTS "ProjectBudget_createdById_idx" ON "ProjectBudget"("createdById");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ProjectBudget_organizationId_fkey') THEN
    ALTER TABLE "ProjectBudget"
      ADD CONSTRAINT "ProjectBudget_organizationId_fkey"
      FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ProjectBudget_projectId_fkey') THEN
    ALTER TABLE "ProjectBudget"
      ADD CONSTRAINT "ProjectBudget_projectId_fkey"
      FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ProjectBudget_sourceQuoteId_fkey') THEN
    ALTER TABLE "ProjectBudget"
      ADD CONSTRAINT "ProjectBudget_sourceQuoteId_fkey"
      FOREIGN KEY ("sourceQuoteId") REFERENCES "CommercialQuote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ProjectBudget_createdById_fkey') THEN
    ALTER TABLE "ProjectBudget"
      ADD CONSTRAINT "ProjectBudget_createdById_fkey"
      FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
