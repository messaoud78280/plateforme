-- DF-6C — Provision / retenue compte prorata (situations)

DO $$ BEGIN
  CREATE TYPE "CommercialProrataBaseMode" AS ENUM ('PERIOD_WORK_HT');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "CommercialQuote"
  ADD COLUMN IF NOT EXISTS "prorataEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "prorataPercent" DECIMAL(6,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "prorataBaseMode" "CommercialProrataBaseMode" NOT NULL DEFAULT 'PERIOD_WORK_HT',
  ADD COLUMN IF NOT EXISTS "prorataLabel" TEXT;

ALTER TABLE "CommercialProgressStatement"
  ADD COLUMN IF NOT EXISTS "prorataEnabledSnapshot" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "prorataRateSnapshot" DECIMAL(6,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "prorataBaseModeSnapshot" "CommercialProrataBaseMode" NOT NULL DEFAULT 'PERIOD_WORK_HT',
  ADD COLUMN IF NOT EXISTS "prorataBaseAmountHt" DECIMAL(14,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "prorataLabelSnapshot" TEXT,
  ADD COLUMN IF NOT EXISTS "prorataPreviousHt" DECIMAL(14,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "prorataPeriodHt" DECIMAL(14,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "prorataCumulativeHt" DECIMAL(14,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "postProrataPeriodSellHt" DECIMAL(14,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "postProrataPeriodVat" DECIMAL(14,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "postProrataPeriodTtc" DECIMAL(14,4) NOT NULL DEFAULT 0;

-- Backfill : sans prorata, postProrata = net après RG (comportement DF-6B)
UPDATE "CommercialProgressStatement"
SET
  "postProrataPeriodSellHt" = "netPeriodSellHt",
  "postProrataPeriodVat" = "netPeriodVat",
  "postProrataPeriodTtc" = "netPeriodTtc"
WHERE "postProrataPeriodSellHt" = 0
  AND "postProrataPeriodVat" = 0
  AND "postProrataPeriodTtc" = 0
  AND (
    "netPeriodSellHt" <> 0
    OR "netPeriodVat" <> 0
    OR "netPeriodTtc" <> 0
  );

ALTER TABLE "CommercialInvoice"
  ADD COLUMN IF NOT EXISTS "prorataAmountHt" DECIMAL(14,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "prorataRate" DECIMAL(6,4);
