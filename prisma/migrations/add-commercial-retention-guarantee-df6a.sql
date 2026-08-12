-- DF-6A — Retenue de garantie BTP

DO $$ BEGIN
  CREATE TYPE "CommercialRetentionStatus" AS ENUM ('HELD', 'DUE', 'RELEASED', 'SETTLED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "CommercialQuote"
  ADD COLUMN IF NOT EXISTS "retentionGuaranteePercent" DECIMAL(6,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "retentionReleaseDueDate" DATE;

ALTER TABLE "CommercialProgressStatement"
  ADD COLUMN IF NOT EXISTS "retentionRateSnapshot" DECIMAL(6,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "retentionCapHt" DECIMAL(14,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "retentionPreviousHt" DECIMAL(14,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "retentionPeriodHt" DECIMAL(14,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "retentionCumulativeHt" DECIMAL(14,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "netPeriodSellHt" DECIMAL(14,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "netPeriodVat" DECIMAL(14,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "netPeriodTtc" DECIMAL(14,4) NOT NULL DEFAULT 0;

ALTER TABLE "CommercialInvoice"
  ADD COLUMN IF NOT EXISTS "worksSellHt" DECIMAL(14,4),
  ADD COLUMN IF NOT EXISTS "worksVat" DECIMAL(14,4),
  ADD COLUMN IF NOT EXISTS "worksTtc" DECIMAL(14,4),
  ADD COLUMN IF NOT EXISTS "retentionAmountHt" DECIMAL(14,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "retentionRate" DECIMAL(6,4);

CREATE TABLE IF NOT EXISTS "CommercialRetentionGuarantee" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "quoteId" TEXT NOT NULL,
  "progressStatementId" TEXT NOT NULL,
  "situationInvoiceId" TEXT,
  "settlementInvoiceId" TEXT,
  "amountHt" DECIMAL(14,4) NOT NULL,
  "amountVat" DECIMAL(14,4) NOT NULL DEFAULT 0,
  "amountTtc" DECIMAL(14,4) NOT NULL,
  "ratePercent" DECIMAL(6,4) NOT NULL,
  "status" "CommercialRetentionStatus" NOT NULL DEFAULT 'HELD',
  "plannedReleaseDate" DATE,
  "releasedAt" TIMESTAMP(3),
  "releasedById" TEXT,
  "settledAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CommercialRetentionGuarantee_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CommercialRetentionGuarantee_progressStatementId_key"
  ON "CommercialRetentionGuarantee"("progressStatementId");

CREATE UNIQUE INDEX IF NOT EXISTS "CommercialRetentionGuarantee_settlementInvoiceId_key"
  ON "CommercialRetentionGuarantee"("settlementInvoiceId");

CREATE INDEX IF NOT EXISTS "CommercialRetentionGuarantee_organizationId_status_idx"
  ON "CommercialRetentionGuarantee"("organizationId", "status");

CREATE INDEX IF NOT EXISTS "CommercialRetentionGuarantee_quoteId_idx"
  ON "CommercialRetentionGuarantee"("quoteId");

CREATE INDEX IF NOT EXISTS "CommercialRetentionGuarantee_plannedReleaseDate_idx"
  ON "CommercialRetentionGuarantee"("plannedReleaseDate");

DO $$ BEGIN
  ALTER TABLE "CommercialRetentionGuarantee"
    ADD CONSTRAINT "CommercialRetentionGuarantee_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "CommercialRetentionGuarantee"
    ADD CONSTRAINT "CommercialRetentionGuarantee_quoteId_fkey"
    FOREIGN KEY ("quoteId") REFERENCES "CommercialQuote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "CommercialRetentionGuarantee"
    ADD CONSTRAINT "CommercialRetentionGuarantee_progressStatementId_fkey"
    FOREIGN KEY ("progressStatementId") REFERENCES "CommercialProgressStatement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "CommercialRetentionGuarantee"
    ADD CONSTRAINT "CommercialRetentionGuarantee_situationInvoiceId_fkey"
    FOREIGN KEY ("situationInvoiceId") REFERENCES "CommercialInvoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "CommercialRetentionGuarantee"
    ADD CONSTRAINT "CommercialRetentionGuarantee_settlementInvoiceId_fkey"
    FOREIGN KEY ("settlementInvoiceId") REFERENCES "CommercialInvoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "CommercialRetentionGuarantee"
    ADD CONSTRAINT "CommercialRetentionGuarantee_releasedById_fkey"
    FOREIGN KEY ("releasedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
