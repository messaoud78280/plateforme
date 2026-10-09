-- Approvisionnements — historique des prix d'offre (ADDITIVE, non destructif).
-- priceHistory : tableau JSON append-only des valeurs précédentes.

ALTER TABLE "SupplyOffer"
  ADD COLUMN IF NOT EXISTS "priceHistory" JSONB;
