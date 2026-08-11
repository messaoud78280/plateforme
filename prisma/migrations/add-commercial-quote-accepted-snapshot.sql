-- GESTION-COMMERCIALE-V1C-A — metadata snapshot PDF accepté (additive, nullable historique)

CREATE TABLE IF NOT EXISTS "CommercialQuoteSnapshot" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "quoteVersionId" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'ACCEPTED_PDF',
    "storageKey" TEXT NOT NULL,
    "sha256" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL DEFAULT 'application/pdf',
    "fileSize" INTEGER NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommercialQuoteSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CommercialQuoteSnapshot_quoteVersionId_kind_key"
  ON "CommercialQuoteSnapshot"("quoteVersionId", "kind");

CREATE INDEX IF NOT EXISTS "CommercialQuoteSnapshot_organizationId_quoteId_idx"
  ON "CommercialQuoteSnapshot"("organizationId", "quoteId");

CREATE INDEX IF NOT EXISTS "CommercialQuoteSnapshot_quoteId_idx"
  ON "CommercialQuoteSnapshot"("quoteId");

CREATE INDEX IF NOT EXISTS "CommercialQuoteSnapshot_sha256_idx"
  ON "CommercialQuoteSnapshot"("sha256");

DO $$ BEGIN
  ALTER TABLE "CommercialQuoteSnapshot"
    ADD CONSTRAINT "CommercialQuoteSnapshot_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "CommercialQuoteSnapshot"
    ADD CONSTRAINT "CommercialQuoteSnapshot_quoteId_fkey"
    FOREIGN KEY ("quoteId") REFERENCES "CommercialQuote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "CommercialQuoteSnapshot"
    ADD CONSTRAINT "CommercialQuoteSnapshot_quoteVersionId_fkey"
    FOREIGN KEY ("quoteVersionId") REFERENCES "CommercialQuoteVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
