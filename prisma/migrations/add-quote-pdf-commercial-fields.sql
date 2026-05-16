-- Champs émetteur étendus + commercial PDF (devis officiel entreprise)
ALTER TABLE "QuoteProject" ADD COLUMN IF NOT EXISTS "issuerApeCode" TEXT;
ALTER TABLE "QuoteProject" ADD COLUMN IF NOT EXISTS "issuerInsuranceName" TEXT;
ALTER TABLE "QuoteProject" ADD COLUMN IF NOT EXISTS "issuerInsurancePolicy" TEXT;
ALTER TABLE "QuoteProject" ADD COLUMN IF NOT EXISTS "issuerLegalMentions" TEXT;
ALTER TABLE "QuoteProject" ADD COLUMN IF NOT EXISTS "issuerLogoPath" TEXT;
ALTER TABLE "QuoteProject" ADD COLUMN IF NOT EXISTS "clientReference" TEXT;

ALTER TABLE "QuoteDocument" ADD COLUMN IF NOT EXISTS "quoteObject" TEXT;
ALTER TABLE "QuoteDocument" ADD COLUMN IF NOT EXISTS "commercialConditions" TEXT;
ALTER TABLE "QuoteDocument" ADD COLUMN IF NOT EXISTS "technicalReservations" TEXT;
