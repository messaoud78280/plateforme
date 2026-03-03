-- À exécuter dans Supabase : SQL Editor → New query → coller ce script → Run
-- Ajoute toutes les colonnes manquantes sur "User" pour que la connexion fonctionne.
-- Note : ne pas utiliser CREATE TYPE IF NOT EXISTS (non supporté), on utilise un bloc DO.

-- 1. Civilité (page Votre profil)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "civilite" TEXT;

-- 2. Adresse de facturation (coordonnées entreprise)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "billingAddressLine1" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "billingAddressLine2" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "billingCity" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "billingPostalCode" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "billingCountry" TEXT;

-- 3. Contrat (acceptation)
DO $$ BEGIN
  CREATE TYPE "ContractStatus" AS ENUM ('PENDING', 'SIGNED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "contractStatus" "ContractStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "signedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "yousignSignatureRequestId" TEXT;

-- Si la colonne contractStatus existe déjà sans default, mettre à jour les lignes NULL (optionnel)
-- UPDATE "User" SET "contractStatus" = 'PENDING' WHERE "contractStatus" IS NULL;
-- Pour débloquer les comptes existants : UPDATE "User" SET "contractStatus" = 'SIGNED', "signedAt" = COALESCE("signedAt", "createdAt") WHERE "contractStatus" = 'PENDING';