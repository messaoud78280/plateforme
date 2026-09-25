-- Passerelle Métré → Devis (phase 2) — additif, idempotent

ALTER TABLE "CommercialOrgSettings"
  ADD COLUMN IF NOT EXISTS "nextDemoQuoteSeq" INTEGER NOT NULL DEFAULT 1;

ALTER TABLE "CommercialQuote"
  ADD COLUMN IF NOT EXISTS "isDemonstration" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "sourcePrepStudyId" TEXT;

CREATE INDEX IF NOT EXISTS "CommercialQuote_organizationId_isDemonstration_idx"
  ON "CommercialQuote"("organizationId", "isDemonstration");
CREATE INDEX IF NOT EXISTS "CommercialQuote_sourcePrepStudyId_idx"
  ON "CommercialQuote"("sourcePrepStudyId");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CommercialQuote_sourcePrepStudyId_fkey') THEN
    ALTER TABLE "CommercialQuote"
      ADD CONSTRAINT "CommercialQuote_sourcePrepStudyId_fkey"
      FOREIGN KEY ("sourcePrepStudyId") REFERENCES "PrepStudy"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "PrepQuoteTransfer" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "studyId" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "studyVersion" INTEGER NOT NULL,
    "isDemonstration" BOOLEAN NOT NULL DEFAULT false,
    "summaryJson" JSONB,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PrepQuoteTransfer_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PrepQuoteTransfer_organizationId_idempotencyKey_key"
  ON "PrepQuoteTransfer"("organizationId", "idempotencyKey");
CREATE INDEX IF NOT EXISTS "PrepQuoteTransfer_studyId_createdAt_idx" ON "PrepQuoteTransfer"("studyId", "createdAt");
CREATE INDEX IF NOT EXISTS "PrepQuoteTransfer_quoteId_idx" ON "PrepQuoteTransfer"("quoteId");
CREATE INDEX IF NOT EXISTS "PrepQuoteTransfer_organizationId_idx" ON "PrepQuoteTransfer"("organizationId");

CREATE TABLE IF NOT EXISTS "PrepQuoteLink" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "transferId" TEXT NOT NULL,
    "studyId" TEXT NOT NULL,
    "studyLineCode" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "quoteLineId" TEXT NOT NULL,
    "quantityAtTransfer" DECIMAL(24,10) NOT NULL,
    "unitAtTransfer" TEXT NOT NULL,
    "designationAtTransfer" TEXT NOT NULL,
    "descriptionAtTransfer" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PrepQuoteLink_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PrepQuoteLink_quoteLineId_key" ON "PrepQuoteLink"("quoteLineId");
CREATE INDEX IF NOT EXISTS "PrepQuoteLink_studyId_studyLineCode_idx" ON "PrepQuoteLink"("studyId", "studyLineCode");
CREATE INDEX IF NOT EXISTS "PrepQuoteLink_quoteId_idx" ON "PrepQuoteLink"("quoteId");
CREATE INDEX IF NOT EXISTS "PrepQuoteLink_organizationId_studyId_idx" ON "PrepQuoteLink"("organizationId", "studyId");
CREATE INDEX IF NOT EXISTS "PrepQuoteLink_transferId_idx" ON "PrepQuoteLink"("transferId");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PrepQuoteTransfer_organizationId_fkey') THEN
    ALTER TABLE "PrepQuoteTransfer" ADD CONSTRAINT "PrepQuoteTransfer_organizationId_fkey"
      FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PrepQuoteTransfer_studyId_fkey') THEN
    ALTER TABLE "PrepQuoteTransfer" ADD CONSTRAINT "PrepQuoteTransfer_studyId_fkey"
      FOREIGN KEY ("studyId") REFERENCES "PrepStudy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PrepQuoteTransfer_quoteId_fkey') THEN
    ALTER TABLE "PrepQuoteTransfer" ADD CONSTRAINT "PrepQuoteTransfer_quoteId_fkey"
      FOREIGN KEY ("quoteId") REFERENCES "CommercialQuote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PrepQuoteLink_organizationId_fkey') THEN
    ALTER TABLE "PrepQuoteLink" ADD CONSTRAINT "PrepQuoteLink_organizationId_fkey"
      FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PrepQuoteLink_transferId_fkey') THEN
    ALTER TABLE "PrepQuoteLink" ADD CONSTRAINT "PrepQuoteLink_transferId_fkey"
      FOREIGN KEY ("transferId") REFERENCES "PrepQuoteTransfer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PrepQuoteLink_studyId_fkey') THEN
    ALTER TABLE "PrepQuoteLink" ADD CONSTRAINT "PrepQuoteLink_studyId_fkey"
      FOREIGN KEY ("studyId") REFERENCES "PrepStudy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PrepQuoteLink_quoteId_fkey') THEN
    ALTER TABLE "PrepQuoteLink" ADD CONSTRAINT "PrepQuoteLink_quoteId_fkey"
      FOREIGN KEY ("quoteId") REFERENCES "CommercialQuote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

ALTER TABLE "PrepQuoteTransfer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PrepQuoteLink" ENABLE ROW LEVEL SECURITY;
