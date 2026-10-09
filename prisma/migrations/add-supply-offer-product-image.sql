-- Approvisionnements — photo produit sur SupplyOffer (ADDITIVE, non destructif).
-- productImageUrl : storage://documents/... ou https://...
-- productImageOrigin : USER_UPLOAD | USER_URL | SUPPLIER_URL

ALTER TABLE "SupplyOffer"
  ADD COLUMN IF NOT EXISTS "productImageUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "productImageOrigin" TEXT;
