-- Signature électronique : statut contrat et lien Yousign
-- Exécuter dans Supabase SQL Editor si besoin, puis : npx prisma generate

DO $$ BEGIN
  CREATE TYPE "ContractStatus" AS ENUM ('PENDING', 'SIGNED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "contractStatus" "ContractStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "signedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "yousignSignatureRequestId" TEXT;

-- Optionnel : considérer les utilisateurs existants comme déjà "signés" pour ne pas bloquer l'accès
-- UPDATE "User" SET "contractStatus" = 'SIGNED', "signedAt" = "createdAt" WHERE "contractStatus" IS NULL OR "signedAt" IS NULL;
