-- Taxonomie bibliothèque (familles vides + ordre) — additif, idempotent
ALTER TABLE "CommercialOrgSettings" ADD COLUMN IF NOT EXISTS "libraryTaxonomyJson" JSONB;
