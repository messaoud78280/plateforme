-- ECO-1 — catégorie de dépense sur commande / ligne (nullable = anciennes commandes à classer)

ALTER TABLE "PurchaseOrder"
  ADD COLUMN IF NOT EXISTS "defaultCostCategory" TEXT;

ALTER TABLE "PurchaseOrderLine"
  ADD COLUMN IF NOT EXISTS "costCategory" TEXT;
