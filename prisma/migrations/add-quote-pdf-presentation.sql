-- BeWork Devis : émetteur (projet) + options de présentation PDF (document)
-- Idempotent — à exécuter dans Supabase SQL Editor si besoin.

ALTER TABLE "QuoteProject" ADD COLUMN IF NOT EXISTS "issuerCompanyName" TEXT;
ALTER TABLE "QuoteProject" ADD COLUMN IF NOT EXISTS "issuerAddressLine1" TEXT;
ALTER TABLE "QuoteProject" ADD COLUMN IF NOT EXISTS "issuerAddressLine2" TEXT;
ALTER TABLE "QuoteProject" ADD COLUMN IF NOT EXISTS "issuerPhone" TEXT;
ALTER TABLE "QuoteProject" ADD COLUMN IF NOT EXISTS "issuerEmail" TEXT;
ALTER TABLE "QuoteProject" ADD COLUMN IF NOT EXISTS "issuerSiret" TEXT;
ALTER TABLE "QuoteProject" ADD COLUMN IF NOT EXISTS "issuerTvaNumber" TEXT;

ALTER TABLE "QuoteDocument" ADD COLUMN IF NOT EXISTS "presentationSettings" JSONB;
