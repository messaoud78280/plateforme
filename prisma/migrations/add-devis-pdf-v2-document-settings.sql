-- DEVIS PDF V2 — paramètres documents commerciaux (JSON)

ALTER TABLE "CommercialOrgSettings"
  ADD COLUMN IF NOT EXISTS "quoteDocumentSettingsJson" JSONB;
