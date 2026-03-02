-- Coordonnées entreprise : champs adresse de facturation sur User
-- Exécuter dans Supabase SQL Editor si besoin, puis : npx prisma generate

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "billingAddressLine1" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "billingAddressLine2" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "billingCity" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "billingPostalCode" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "billingCountry" TEXT;
