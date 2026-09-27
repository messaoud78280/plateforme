-- Un devis structuré en plusieurs sections peut servir de référence
-- à plusieurs ProjectScope (lots) du même chantier.
DROP INDEX IF EXISTS "ProjectScope_referenceQuoteId_key";

CREATE INDEX IF NOT EXISTS "ProjectScope_referenceQuoteId_idx"
  ON "ProjectScope" ("referenceQuoteId");
