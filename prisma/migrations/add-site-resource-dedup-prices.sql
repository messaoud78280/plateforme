-- Ressources chantier : prix observés + désignation normalisée (déduplication)
-- Idempotent — Supabase SQL Editor

ALTER TABLE "SiteResource"
  ADD COLUMN IF NOT EXISTS "normalizedDesignation" TEXT;

CREATE INDEX IF NOT EXISTS "SiteResource_normalizedDesignation_idx"
  ON "SiteResource" ("normalizedDesignation");

CREATE TABLE IF NOT EXISTS "SiteResourcePriceObservation" (
  "id" TEXT NOT NULL,
  "siteResourceId" TEXT NOT NULL,
  "amountHT" DECIMAL(65,30) NOT NULL,
  "orderUnit" TEXT NOT NULL DEFAULT 'u',
  "sourceName" TEXT,
  "sourceWorkItemId" TEXT,
  "notes" TEXT,
  "observationKey" TEXT NOT NULL,
  "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SiteResourcePriceObservation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SiteResourcePriceObservation_siteResourceId_observationKey_key"
  ON "SiteResourcePriceObservation" ("siteResourceId", "observationKey");

CREATE INDEX IF NOT EXISTS "SiteResourcePriceObservation_siteResourceId_idx"
  ON "SiteResourcePriceObservation" ("siteResourceId");

DO $$ BEGIN
  ALTER TABLE "SiteResourcePriceObservation"
    ADD CONSTRAINT "SiteResourcePriceObservation_siteResourceId_fkey"
    FOREIGN KEY ("siteResourceId") REFERENCES "SiteResource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "SiteResourcePriceObservation"
    ADD CONSTRAINT "SiteResourcePriceObservation_sourceWorkItemId_fkey"
    FOREIGN KEY ("sourceWorkItemId") REFERENCES "WorkItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
