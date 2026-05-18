-- Prix observés : désignation complète de variante + métadonnées d'import structurées
ALTER TABLE "PriceEntry" ADD COLUMN IF NOT EXISTS "variantDesignation" TEXT;
ALTER TABLE "PriceEntry" ADD COLUMN IF NOT EXISTS "importMeta" JSONB;
