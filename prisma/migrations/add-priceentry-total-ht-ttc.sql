-- BeWork Devis — totaux ligne sur PriceEntry (import BPU / devis JSON)
-- À exécuter sur la base si la table "PriceEntry" existe déjà sans ces colonnes.

ALTER TABLE "PriceEntry" ADD COLUMN IF NOT EXISTS "totalHT" DECIMAL(14, 4);
ALTER TABLE "PriceEntry" ADD COLUMN IF NOT EXISTS "totalTTC" DECIMAL(14, 4);
