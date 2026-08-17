-- VISITES-METRES-2 — Zones, lots, calculateur, ouvrage, points à compléter

ALTER TYPE "SiteVisitMeasureType" ADD VALUE IF NOT EXISTS 'WALL';

ALTER TABLE "SiteVisit"
  ADD COLUMN IF NOT EXISTS "lotsJson" JSONB,
  ADD COLUMN IF NOT EXISTS "zonesJson" JSONB,
  ADD COLUMN IF NOT EXISTS "preparedAt" TIMESTAMP(3);

ALTER TABLE "SiteVisitMeasurement"
  ADD COLUMN IF NOT EXISTS "grossQuantity" DECIMAL(14,4),
  ADD COLUMN IF NOT EXISTS "multiplier" DECIMAL(14,4),
  ADD COLUMN IF NOT EXISTS "coefficient" DECIMAL(14,4),
  ADD COLUMN IF NOT EXISTS "wastePercent" DECIMAL(8,4),
  ADD COLUMN IF NOT EXISTS "deductionsJson" JSONB,
  ADD COLUMN IF NOT EXISTS "lot" TEXT,
  ADD COLUMN IF NOT EXISTS "workItemId" TEXT;

CREATE INDEX IF NOT EXISTS "SiteVisitMeasurement_workItemId_idx"
  ON "SiteVisitMeasurement"("workItemId");

ALTER TABLE "SiteVisitMissingInfo"
  ADD COLUMN IF NOT EXISTS "comment" TEXT,
  ADD COLUMN IF NOT EXISTS "dueAt" TIMESTAMP(3);

ALTER TABLE "SiteVisitMedia"
  ADD COLUMN IF NOT EXISTS "zone" TEXT;


ALTER TABLE "SiteVisit"
  ADD COLUMN IF NOT EXISTS "lotsJson" JSONB,
  ADD COLUMN IF NOT EXISTS "zonesJson" JSONB,
  ADD COLUMN IF NOT EXISTS "preparedAt" TIMESTAMP(3);

ALTER TABLE "SiteVisitMeasurement"
  ADD COLUMN IF NOT EXISTS "grossQuantity" DECIMAL(14,4),
  ADD COLUMN IF NOT EXISTS "multiplier" DECIMAL(14,4),
  ADD COLUMN IF NOT EXISTS "coefficient" DECIMAL(14,4),
  ADD COLUMN IF NOT EXISTS "wastePercent" DECIMAL(8,4),
  ADD COLUMN IF NOT EXISTS "deductionsJson" JSONB,
  ADD COLUMN IF NOT EXISTS "lot" TEXT,
  ADD COLUMN IF NOT EXISTS "workItemId" TEXT;

CREATE INDEX IF NOT EXISTS "SiteVisitMeasurement_workItemId_idx"
  ON "SiteVisitMeasurement"("workItemId");

ALTER TABLE "SiteVisitMissingInfo"
  ADD COLUMN IF NOT EXISTS "comment" TEXT,
  ADD COLUMN IF NOT EXISTS "dueAt" TIMESTAMP(3);

ALTER TABLE "SiteVisitMedia"
  ADD COLUMN IF NOT EXISTS "zone" TEXT;
