-- Bibliothèque V2 — favoris ouvrages

ALTER TABLE "CommercialWorkItem"
  ADD COLUMN IF NOT EXISTS "isFavorite" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "CommercialWorkItem_organizationId_isFavorite_idx"
  ON "CommercialWorkItem"("organizationId", "isFavorite");
