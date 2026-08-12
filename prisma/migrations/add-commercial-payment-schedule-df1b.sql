-- DF-1B — échéancier structuré devis (additive, nullable)

ALTER TABLE "CommercialQuote"
  ADD COLUMN IF NOT EXISTS "paymentScheduleJson" JSONB;

ALTER TABLE "CommercialQuoteVersion"
  ADD COLUMN IF NOT EXISTS "paymentScheduleJson" JSONB;
