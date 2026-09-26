-- Dossier chantier V2 — étape A : ProjectScope (périmètre technique)
-- Additif, idempotent. Ne supprime aucune donnée.

CREATE TABLE IF NOT EXISTS "ProjectScope" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "parentId" TEXT,
    "referenceStudyId" TEXT,
    "referenceQuoteId" TEXT,
    "referenceSchedulePlanId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProjectScope_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ProjectScope_projectId_code_key"
  ON "ProjectScope"("projectId", "code");
CREATE UNIQUE INDEX IF NOT EXISTS "ProjectScope_referenceStudyId_key"
  ON "ProjectScope"("referenceStudyId");
CREATE UNIQUE INDEX IF NOT EXISTS "ProjectScope_referenceQuoteId_key"
  ON "ProjectScope"("referenceQuoteId");
CREATE UNIQUE INDEX IF NOT EXISTS "ProjectScope_referenceSchedulePlanId_key"
  ON "ProjectScope"("referenceSchedulePlanId");
CREATE INDEX IF NOT EXISTS "ProjectScope_organizationId_projectId_idx"
  ON "ProjectScope"("organizationId", "projectId");
CREATE INDEX IF NOT EXISTS "ProjectScope_projectId_displayOrder_idx"
  ON "ProjectScope"("projectId", "displayOrder");
CREATE INDEX IF NOT EXISTS "ProjectScope_parentId_idx"
  ON "ProjectScope"("parentId");

ALTER TABLE "PrepStudy" ADD COLUMN IF NOT EXISTS "scopeId" TEXT;
CREATE INDEX IF NOT EXISTS "PrepStudy_scopeId_idx" ON "PrepStudy"("scopeId");

ALTER TABLE "PrepSchedulePlan" ADD COLUMN IF NOT EXISTS "scopeId" TEXT;
CREATE INDEX IF NOT EXISTS "PrepSchedulePlan_scopeId_idx" ON "PrepSchedulePlan"("scopeId");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ProjectScope_organizationId_fkey') THEN
    ALTER TABLE "ProjectScope" ADD CONSTRAINT "ProjectScope_organizationId_fkey"
      FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ProjectScope_projectId_fkey') THEN
    ALTER TABLE "ProjectScope" ADD CONSTRAINT "ProjectScope_projectId_fkey"
      FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ProjectScope_parentId_fkey') THEN
    ALTER TABLE "ProjectScope" ADD CONSTRAINT "ProjectScope_parentId_fkey"
      FOREIGN KEY ("parentId") REFERENCES "ProjectScope"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ProjectScope_referenceStudyId_fkey') THEN
    ALTER TABLE "ProjectScope" ADD CONSTRAINT "ProjectScope_referenceStudyId_fkey"
      FOREIGN KEY ("referenceStudyId") REFERENCES "PrepStudy"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ProjectScope_referenceQuoteId_fkey') THEN
    ALTER TABLE "ProjectScope" ADD CONSTRAINT "ProjectScope_referenceQuoteId_fkey"
      FOREIGN KEY ("referenceQuoteId") REFERENCES "CommercialQuote"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ProjectScope_referenceSchedulePlanId_fkey') THEN
    ALTER TABLE "ProjectScope" ADD CONSTRAINT "ProjectScope_referenceSchedulePlanId_fkey"
      FOREIGN KEY ("referenceSchedulePlanId") REFERENCES "PrepSchedulePlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PrepStudy_scopeId_fkey') THEN
    ALTER TABLE "PrepStudy" ADD CONSTRAINT "PrepStudy_scopeId_fkey"
      FOREIGN KEY ("scopeId") REFERENCES "ProjectScope"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PrepSchedulePlan_scopeId_fkey') THEN
    ALTER TABLE "PrepSchedulePlan" ADD CONSTRAINT "PrepSchedulePlan_scopeId_fkey"
      FOREIGN KEY ("scopeId") REFERENCES "ProjectScope"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

ALTER TABLE "ProjectScope" ENABLE ROW LEVEL SECURITY;
