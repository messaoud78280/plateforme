-- Enrichissement Visites & métrés — survey / chiffrage ChatGPT
ALTER TABLE "SiteVisit" ADD COLUMN IF NOT EXISTS "findingsJson" JSONB;
ALTER TABLE "SiteVisit" ADD COLUMN IF NOT EXISTS "proposedWorksJson" JSONB;
ALTER TABLE "SiteVisit" ADD COLUMN IF NOT EXISTS "commercialJson" JSONB;
ALTER TABLE "SiteVisit" ADD COLUMN IF NOT EXISTS "surveyStage" TEXT;
ALTER TABLE "SiteVisit" ADD COLUMN IF NOT EXISTS "surveyExportedAt" TIMESTAMP(3);

ALTER TABLE "SiteVisitMissingInfo" ADD COLUMN IF NOT EXISTS "category" TEXT;
ALTER TABLE "SiteVisitMissingInfo" ADD COLUMN IF NOT EXISTS "checkStatus" TEXT DEFAULT 'A_VERIFIER';

ALTER TABLE "SiteVisitMedia" ADD COLUMN IF NOT EXISTS "category" TEXT;
ALTER TABLE "SiteVisitMedia" ADD COLUMN IF NOT EXISTS "observation" TEXT;
ALTER TABLE "SiteVisitMedia" ADD COLUMN IF NOT EXISTS "hypothesis" TEXT;
