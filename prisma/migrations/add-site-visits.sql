-- VISITES-METRES-1 — SiteVisit + métrés + médias + infos manquantes

DO $$ BEGIN
  CREATE TYPE "SiteVisitStatus" AS ENUM (
    'TO_PLAN', 'SCHEDULED', 'IN_PROGRESS', 'INCOMPLETE',
    'READY_TO_QUOTE', 'TRANSMITTED', 'CANCELLED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "SiteVisitMeasureType" AS ENUM (
    'SURFACE', 'LENGTH', 'VOLUME', 'QUANTITY', 'FREE'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "SiteVisitMediaKind" AS ENUM ('PHOTO', 'DOCUMENT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "SiteVisit" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "clientName" TEXT NOT NULL,
  "siteName" TEXT,
  "siteAddress" TEXT NOT NULL,
  "contactName" TEXT,
  "contactPhone" TEXT,
  "clientExternalOrgId" TEXT,
  "projectId" TEXT,
  "scheduledAt" TIMESTAMP(3),
  "responsibleId" TEXT,
  "createdById" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "clientNeed" TEXT,
  "urgencyNote" TEXT,
  "timeConstraints" TEXT,
  "siteOccupied" BOOLEAN NOT NULL DEFAULT false,
  "comments" TEXT,
  "constraintsJson" JSONB,
  "estimatedCrewCount" INTEGER,
  "estimatedDuration" TEXT,
  "status" "SiteVisitStatus" NOT NULL DEFAULT 'TO_PLAN',
  "agendaEventId" TEXT,
  "commercialQuoteId" TEXT,
  "demoKey" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SiteVisit_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "SiteVisit_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "SiteVisit_clientExternalOrgId_fkey"
    FOREIGN KEY ("clientExternalOrgId") REFERENCES "ExternalOrganization"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "SiteVisit_responsibleId_fkey"
    FOREIGN KEY ("responsibleId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "SiteVisit_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "SiteVisit_commercialQuoteId_fkey"
    FOREIGN KEY ("commercialQuoteId") REFERENCES "CommercialQuote"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "SiteVisit_commercialQuoteId_key" ON "SiteVisit"("commercialQuoteId");
CREATE UNIQUE INDEX IF NOT EXISTS "SiteVisit_organizationId_demoKey_key" ON "SiteVisit"("organizationId", "demoKey");
CREATE INDEX IF NOT EXISTS "SiteVisit_organizationId_status_idx" ON "SiteVisit"("organizationId", "status");
CREATE INDEX IF NOT EXISTS "SiteVisit_organizationId_scheduledAt_idx" ON "SiteVisit"("organizationId", "scheduledAt");
CREATE INDEX IF NOT EXISTS "SiteVisit_projectId_idx" ON "SiteVisit"("projectId");
CREATE INDEX IF NOT EXISTS "SiteVisit_agendaEventId_idx" ON "SiteVisit"("agendaEventId");
CREATE INDEX IF NOT EXISTS "SiteVisit_responsibleId_idx" ON "SiteVisit"("responsibleId");
CREATE INDEX IF NOT EXISTS "SiteVisit_clientExternalOrgId_idx" ON "SiteVisit"("clientExternalOrgId");

CREATE TABLE IF NOT EXISTS "SiteVisitMeasurement" (
  "id" TEXT PRIMARY KEY,
  "visitId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "zone" TEXT,
  "label" TEXT NOT NULL,
  "measureType" "SiteVisitMeasureType" NOT NULL,
  "lengthM" DECIMAL(14,4),
  "widthM" DECIMAL(14,4),
  "heightM" DECIMAL(14,4),
  "quantityValue" DECIMAL(14,4),
  "unit" TEXT NOT NULL,
  "computedQuantity" DECIMAL(14,4) NOT NULL,
  "observation" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "modifiedAfterTransmit" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SiteVisitMeasurement_visitId_fkey"
    FOREIGN KEY ("visitId") REFERENCES "SiteVisit"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "SiteVisitMeasurement_visitId_sortOrder_idx" ON "SiteVisitMeasurement"("visitId", "sortOrder");
CREATE INDEX IF NOT EXISTS "SiteVisitMeasurement_organizationId_idx" ON "SiteVisitMeasurement"("organizationId");

CREATE TABLE IF NOT EXISTS "SiteVisitMissingInfo" (
  "id" TEXT PRIMARY KEY,
  "visitId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "resolvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SiteVisitMissingInfo_visitId_fkey"
    FOREIGN KEY ("visitId") REFERENCES "SiteVisit"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "SiteVisitMissingInfo_visitId_idx" ON "SiteVisitMissingInfo"("visitId");
CREATE INDEX IF NOT EXISTS "SiteVisitMissingInfo_organizationId_idx" ON "SiteVisitMissingInfo"("organizationId");

CREATE TABLE IF NOT EXISTS "SiteVisitMedia" (
  "id" TEXT PRIMARY KEY,
  "visitId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "measurementId" TEXT,
  "kind" "SiteVisitMediaKind" NOT NULL DEFAULT 'PHOTO',
  "name" TEXT NOT NULL,
  "caption" TEXT,
  "fileUrl" TEXT,
  "mimeType" TEXT,
  "fileSize" INTEGER,
  "storagePath" TEXT,
  "chantierFileId" TEXT,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SiteVisitMedia_visitId_fkey"
    FOREIGN KEY ("visitId") REFERENCES "SiteVisit"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "SiteVisitMedia_measurementId_fkey"
    FOREIGN KEY ("measurementId") REFERENCES "SiteVisitMeasurement"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "SiteVisitMedia_visitId_idx" ON "SiteVisitMedia"("visitId");
CREATE INDEX IF NOT EXISTS "SiteVisitMedia_organizationId_idx" ON "SiteVisitMedia"("organizationId");
CREATE INDEX IF NOT EXISTS "SiteVisitMedia_measurementId_idx" ON "SiteVisitMedia"("measurementId");
CREATE INDEX IF NOT EXISTS "SiteVisitMedia_chantierFileId_idx" ON "SiteVisitMedia"("chantierFileId");
