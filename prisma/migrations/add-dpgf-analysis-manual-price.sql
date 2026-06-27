-- Prix manuel HT optionnel sur les fiches Analyse DPGF (saisie utilisateur uniquement)
ALTER TABLE "DpgfAnalysisSheet"
ADD COLUMN IF NOT EXISTS "manualPriceHt" DECIMAL(14, 4);
