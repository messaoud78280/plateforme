-- GESTION-COMMERCIALE-V1C-B — FK CommercialInvoice.amendmentId → CommercialAmendment
-- Cardinalité : N factures → 0..1 avenant (facturation partielle OK).
-- Multi-avenants dans une même facture = P2 (table de lien), non couvert ici.

CREATE INDEX IF NOT EXISTS "CommercialInvoice_amendmentId_idx"
  ON "CommercialInvoice"("amendmentId");

DO $$ BEGIN
  ALTER TABLE "CommercialInvoice"
    ADD CONSTRAINT "CommercialInvoice_amendmentId_fkey"
    FOREIGN KEY ("amendmentId") REFERENCES "CommercialAmendment"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
