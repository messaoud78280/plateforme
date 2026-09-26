-- N devis par périmètre — appartenance via CommercialQuote.scopeId
-- Conserve ProjectScope.referenceQuoteId comme devis de référence facultatif.
-- Additif, idempotent. Ne supprime aucune donnée.

ALTER TABLE "CommercialQuote" ADD COLUMN IF NOT EXISTS "scopeId" TEXT;

CREATE INDEX IF NOT EXISTS "CommercialQuote_scopeId_idx"
  ON "CommercialQuote"("scopeId");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CommercialQuote_scopeId_fkey') THEN
    ALTER TABLE "CommercialQuote" ADD CONSTRAINT "CommercialQuote_scopeId_fkey"
      FOREIGN KEY ("scopeId") REFERENCES "ProjectScope"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Backfill 1 : devis déjà en référence d'un lot
UPDATE "CommercialQuote" q
SET "scopeId" = s."id"
FROM "ProjectScope" s
WHERE s."referenceQuoteId" = q."id"
  AND q."scopeId" IS NULL;

-- Backfill 2 : devis issus d'un métré déjà classé
UPDATE "CommercialQuote" q
SET "scopeId" = st."scopeId"
FROM "PrepStudy" st
WHERE q."sourcePrepStudyId" = st."id"
  AND st."scopeId" IS NOT NULL
  AND q."scopeId" IS NULL;
