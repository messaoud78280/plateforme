-- Champs formulaire de prospection (remplace Calendly)
ALTER TABLE "ContactRequest" ADD COLUMN IF NOT EXISTS "marketType" TEXT;
ALTER TABLE "ContactRequest" ADD COLUMN IF NOT EXISTS "tradeActivity" TEXT;
ALTER TABLE "ContactRequest" ADD COLUMN IF NOT EXISTS "mainNeed" TEXT;
ALTER TABLE "ContactRequest" ADD COLUMN IF NOT EXISTS "consent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ContactRequest" ADD COLUMN IF NOT EXISTS "source" TEXT DEFAULT 'homepage_contact_form';
