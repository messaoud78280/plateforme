-- CONTRATS-ANNUELS-2 — lien unique intervention ↔ CommercialInvoice

CREATE UNIQUE INDEX IF NOT EXISTS "AnnualServiceIntervention_commercialInvoiceId_key"
  ON "AnnualServiceIntervention"("commercialInvoiceId");

DO $$ BEGIN
  ALTER TABLE "AnnualServiceIntervention"
    ADD CONSTRAINT "AnnualServiceIntervention_commercialInvoiceId_fkey"
    FOREIGN KEY ("commercialInvoiceId") REFERENCES "CommercialInvoice"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
