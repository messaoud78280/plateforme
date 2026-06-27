-- Intervenant concerné (saisie manuelle, distinct du lot DPGF)
ALTER TABLE "DpgfAnalysisSheet"
ADD COLUMN IF NOT EXISTS "intervenantConcerne" TEXT;
