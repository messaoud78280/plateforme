-- Colonnes User nécessaires pour l'inscription et le reste de la plateforme
-- À exécuter dans Supabase SQL Editor si vous avez l'erreur "Erreur lors de l'inscription".
-- Exécutez ce script une seule fois sur votre base de production.

-- 1. Colonnes profil / entreprise
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "civilite" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "company" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "formeJuridique" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "secteurActivite" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "service" TEXT;

-- 2. Adresse de facturation
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "billingAddressLine1" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "billingAddressLine2" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "billingCity" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "billingPostalCode" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "billingCountry" TEXT;

-- 3. Contrat (obligatoire pour l'inscription)
DO $$ BEGIN
  CREATE TYPE "ContractStatus" AS ENUM ('PENDING', 'SIGNED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "contractStatus" "ContractStatus" DEFAULT 'PENDING';
-- Si la colonne existe déjà en NOT NULL sans default sur des lignes existantes :
DO $$ BEGIN
  ALTER TABLE "User" ALTER COLUMN "contractStatus" SET DEFAULT 'PENDING';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "signedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "yousignSignatureRequestId" TEXT;

-- 4. Abonnement et actions (obligatoire pour l'inscription)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "subscriptionPlan" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "monthlyActionsTotal" INTEGER DEFAULT 120;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "monthlyActionsUsed" INTEGER DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "actionsResetAt" TIMESTAMP(3);

-- 5. Équipe / invitations
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "invitedById" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "teamRole" TEXT;
