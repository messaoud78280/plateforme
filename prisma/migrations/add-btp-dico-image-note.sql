-- Dico BTP — enrichissement des fiches
-- Ajout d'une image illustrative et d'une note / définition personnelle par terme.

ALTER TABLE "BtpDictionaryTerm" ADD COLUMN IF NOT EXISTS "personalNote" TEXT;
ALTER TABLE "BtpDictionaryTerm" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
