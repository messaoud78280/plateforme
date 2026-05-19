-- Coordonnées client détaillées (formulaire type ERP)
ALTER TABLE "QuoteProject" ADD COLUMN IF NOT EXISTS "clientType" TEXT DEFAULT 'professionnel';
ALTER TABLE "QuoteProject" ADD COLUMN IF NOT EXISTS "clientCivility" TEXT;
ALTER TABLE "QuoteProject" ADD COLUMN IF NOT EXISTS "clientFirstName" TEXT;
ALTER TABLE "QuoteProject" ADD COLUMN IF NOT EXISTS "clientLastName" TEXT;
ALTER TABLE "QuoteProject" ADD COLUMN IF NOT EXISTS "clientCompanyName" TEXT;
ALTER TABLE "QuoteProject" ADD COLUMN IF NOT EXISTS "clientAddressLine1" TEXT;
ALTER TABLE "QuoteProject" ADD COLUMN IF NOT EXISTS "clientAddressLine2" TEXT;
ALTER TABLE "QuoteProject" ADD COLUMN IF NOT EXISTS "clientPostalCode" TEXT;
ALTER TABLE "QuoteProject" ADD COLUMN IF NOT EXISTS "clientCityName" TEXT;
ALTER TABLE "QuoteProject" ADD COLUMN IF NOT EXISTS "clientLandline" TEXT;
ALTER TABLE "QuoteProject" ADD COLUMN IF NOT EXISTS "clientMobile" TEXT;
ALTER TABLE "QuoteProject" ADD COLUMN IF NOT EXISTS "clientFax" TEXT;
