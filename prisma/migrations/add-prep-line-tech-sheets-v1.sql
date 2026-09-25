-- MÉTRÉ — fiches techniques / désignations professionnelles (additif)
-- Idempotente. Ne touche ni formules ni quantités.

ALTER TABLE "PrepTakeoffLine"
  ADD COLUMN IF NOT EXISTS "includedServicesJson" JSONB,
  ADD COLUMN IF NOT EXISTS "technicalReferencesJson" JSONB,
  ADD COLUMN IF NOT EXISTS "executionNotes" TEXT,
  ADD COLUMN IF NOT EXISTS "qualityControlsJson" JSONB,
  ADD COLUMN IF NOT EXISTS "technicalReservationsJson" JSONB,
  ADD COLUMN IF NOT EXISTS "originalDesignation" TEXT,
  ADD COLUMN IF NOT EXISTS "textsUserEdited" BOOLEAN NOT NULL DEFAULT false;

-- Repère d'origine pour les lignes déjà importées (enrichissement sûr).
UPDATE "PrepTakeoffLine"
SET "originalDesignation" = "designation"
WHERE "originalDesignation" IS NULL;
