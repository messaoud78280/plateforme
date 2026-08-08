-- CDE-2A — Proposition livraison fournisseur (non destructif)

ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "proposedDeliveryAt" TIMESTAMP(3);
ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "proposedDeliveryComment" TEXT;
ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "proposedDeliveryStatus" TEXT NOT NULL DEFAULT 'NONE';
ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "supplierRefuseReason" TEXT;
