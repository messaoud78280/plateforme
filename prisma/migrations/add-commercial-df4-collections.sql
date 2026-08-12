-- DF-4 — Relances facture + annulation paiement traçable

ALTER TABLE "CommercialInvoice"
  ADD COLUMN IF NOT EXISTS "lastReminderAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "reminderCount" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "CommercialPayment"
  ADD COLUMN IF NOT EXISTS "cancelledAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "cancelledById" TEXT;

DO $$ BEGIN
  ALTER TABLE "CommercialPayment"
    ADD CONSTRAINT "CommercialPayment_cancelledById_fkey"
    FOREIGN KEY ("cancelledById") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "CommercialPayment_organizationId_cancelledAt_idx"
  ON "CommercialPayment"("organizationId", "cancelledAt");
