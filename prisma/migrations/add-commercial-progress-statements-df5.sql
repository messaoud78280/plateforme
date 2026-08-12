-- DF-5 — Situations de travaux ligne à ligne

DO $$ BEGIN
  CREATE TYPE "CommercialProgressStatementStatus" AS ENUM ('DRAFT', 'VALIDATED', 'INVOICED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "CommercialInvoice"
  ADD COLUMN IF NOT EXISTS "progressStatementId" TEXT;

CREATE TABLE IF NOT EXISTS "CommercialProgressStatement" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "quoteId" TEXT NOT NULL,
  "projectId" TEXT,
  "clientExternalOrgId" TEXT,
  "number" INTEGER NOT NULL,
  "label" TEXT NOT NULL,
  "status" "CommercialProgressStatementStatus" NOT NULL DEFAULT 'DRAFT',
  "periodStart" DATE,
  "periodEnd" DATE,
  "contractSnapshotJson" JSONB NOT NULL,
  "marketSellHt" DECIMAL(14,4) NOT NULL DEFAULT 0,
  "marketVat" DECIMAL(14,4) NOT NULL DEFAULT 0,
  "marketTtc" DECIMAL(14,4) NOT NULL DEFAULT 0,
  "previousSellHt" DECIMAL(14,4) NOT NULL DEFAULT 0,
  "previousVat" DECIMAL(14,4) NOT NULL DEFAULT 0,
  "previousTtc" DECIMAL(14,4) NOT NULL DEFAULT 0,
  "periodSellHt" DECIMAL(14,4) NOT NULL DEFAULT 0,
  "periodVat" DECIMAL(14,4) NOT NULL DEFAULT 0,
  "periodTtc" DECIMAL(14,4) NOT NULL DEFAULT 0,
  "cumulativeSellHt" DECIMAL(14,4) NOT NULL DEFAULT 0,
  "cumulativeVat" DECIMAL(14,4) NOT NULL DEFAULT 0,
  "cumulativeTtc" DECIMAL(14,4) NOT NULL DEFAULT 0,
  "remainingSellHt" DECIMAL(14,4) NOT NULL DEFAULT 0,
  "remainingVat" DECIMAL(14,4) NOT NULL DEFAULT 0,
  "remainingTtc" DECIMAL(14,4) NOT NULL DEFAULT 0,
  "validatedAt" TIMESTAMP(3),
  "validatedById" TEXT,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CommercialProgressStatement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CommercialProgressStatementLine" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "statementId" TEXT NOT NULL,
  "sourceQuoteLineId" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "reference" TEXT,
  "designation" TEXT NOT NULL,
  "description" TEXT,
  "unit" TEXT NOT NULL DEFAULT 'U',
  "contractQuantity" DECIMAL(14,4) NOT NULL,
  "unitSellHt" DECIMAL(14,4) NOT NULL,
  "vatRate" DECIMAL(6,4) NOT NULL DEFAULT 20,
  "contractSellHt" DECIMAL(14,4) NOT NULL,
  "previousPercent" DECIMAL(8,4) NOT NULL DEFAULT 0,
  "previousQuantity" DECIMAL(14,4) NOT NULL DEFAULT 0,
  "previousSellHt" DECIMAL(14,4) NOT NULL DEFAULT 0,
  "periodPercent" DECIMAL(8,4) NOT NULL DEFAULT 0,
  "periodQuantity" DECIMAL(14,4) NOT NULL DEFAULT 0,
  "periodSellHt" DECIMAL(14,4) NOT NULL DEFAULT 0,
  "cumulativePercent" DECIMAL(8,4) NOT NULL DEFAULT 0,
  "cumulativeQuantity" DECIMAL(14,4) NOT NULL DEFAULT 0,
  "cumulativeSellHt" DECIMAL(14,4) NOT NULL DEFAULT 0,
  "remainingSellHt" DECIMAL(14,4) NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CommercialProgressStatementLine_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CommercialProgressStatement_quoteId_number_key"
  ON "CommercialProgressStatement"("quoteId", "number");

CREATE INDEX IF NOT EXISTS "CommercialProgressStatement_organizationId_status_idx"
  ON "CommercialProgressStatement"("organizationId", "status");

CREATE INDEX IF NOT EXISTS "CommercialProgressStatement_organizationId_quoteId_idx"
  ON "CommercialProgressStatement"("organizationId", "quoteId");

CREATE INDEX IF NOT EXISTS "CommercialProgressStatement_projectId_idx"
  ON "CommercialProgressStatement"("projectId");

CREATE INDEX IF NOT EXISTS "CommercialProgressStatementLine_statementId_sortOrder_idx"
  ON "CommercialProgressStatementLine"("statementId", "sortOrder");

CREATE INDEX IF NOT EXISTS "CommercialProgressStatementLine_organizationId_idx"
  ON "CommercialProgressStatementLine"("organizationId");

CREATE UNIQUE INDEX IF NOT EXISTS "CommercialInvoice_progressStatementId_key"
  ON "CommercialInvoice"("progressStatementId");

DO $$ BEGIN
  ALTER TABLE "CommercialProgressStatement"
    ADD CONSTRAINT "CommercialProgressStatement_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "CommercialProgressStatement"
    ADD CONSTRAINT "CommercialProgressStatement_quoteId_fkey"
    FOREIGN KEY ("quoteId") REFERENCES "CommercialQuote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "CommercialProgressStatement"
    ADD CONSTRAINT "CommercialProgressStatement_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "CommercialProgressStatement"
    ADD CONSTRAINT "CommercialProgressStatement_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "CommercialProgressStatement"
    ADD CONSTRAINT "CommercialProgressStatement_validatedById_fkey"
    FOREIGN KEY ("validatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "CommercialProgressStatementLine"
    ADD CONSTRAINT "CommercialProgressStatementLine_statementId_fkey"
    FOREIGN KEY ("statementId") REFERENCES "CommercialProgressStatement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "CommercialInvoice"
    ADD CONSTRAINT "CommercialInvoice_progressStatementId_fkey"
    FOREIGN KEY ("progressStatementId") REFERENCES "CommercialProgressStatement"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
