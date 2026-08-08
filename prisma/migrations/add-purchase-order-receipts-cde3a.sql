-- CDE-3A — Réceptions chantier + BL (non destructif)

ALTER TABLE "PurchaseOrderDocument" ADD COLUMN IF NOT EXISTS "receiptId" TEXT;
CREATE INDEX IF NOT EXISTS "PurchaseOrderDocument_receiptId_idx" ON "PurchaseOrderDocument"("receiptId");

CREATE TABLE IF NOT EXISTS "PurchaseOrderReceipt" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "purchaseOrderId" TEXT NOT NULL,
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "receivedById" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "deliveryNoteNumber" TEXT,
  "commentShared" TEXT,
  "commentInternal" TEXT,
  "agendaEventId" TEXT,
  "cancelledAt" TIMESTAMP(3),
  "cancelledById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PurchaseOrderReceipt_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PurchaseOrderReceipt_organizationId_receivedAt_idx"
  ON "PurchaseOrderReceipt"("organizationId", "receivedAt");
CREATE INDEX IF NOT EXISTS "PurchaseOrderReceipt_purchaseOrderId_receivedAt_idx"
  ON "PurchaseOrderReceipt"("purchaseOrderId", "receivedAt");
CREATE INDEX IF NOT EXISTS "PurchaseOrderReceipt_receivedById_idx"
  ON "PurchaseOrderReceipt"("receivedById");

DO $$ BEGIN
  ALTER TABLE "PurchaseOrderReceipt" ADD CONSTRAINT "PurchaseOrderReceipt_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "PurchaseOrderReceipt" ADD CONSTRAINT "PurchaseOrderReceipt_purchaseOrderId_fkey"
    FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "PurchaseOrderReceipt" ADD CONSTRAINT "PurchaseOrderReceipt_receivedById_fkey"
    FOREIGN KEY ("receivedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "PurchaseOrderReceiptLine" (
  "id" TEXT NOT NULL,
  "receiptId" TEXT NOT NULL,
  "orderLineId" TEXT NOT NULL,
  "receivedQty" DECIMAL(14,3) NOT NULL,
  "damagedQty" DECIMAL(14,3) NOT NULL DEFAULT 0,
  "refusedQty" DECIMAL(14,3) NOT NULL DEFAULT 0,
  "refuseReason" TEXT,
  "comment" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PurchaseOrderReceiptLine_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PurchaseOrderReceiptLine_receiptId_idx" ON "PurchaseOrderReceiptLine"("receiptId");
CREATE INDEX IF NOT EXISTS "PurchaseOrderReceiptLine_orderLineId_idx" ON "PurchaseOrderReceiptLine"("orderLineId");

DO $$ BEGIN
  ALTER TABLE "PurchaseOrderReceiptLine" ADD CONSTRAINT "PurchaseOrderReceiptLine_receiptId_fkey"
    FOREIGN KEY ("receiptId") REFERENCES "PurchaseOrderReceipt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "PurchaseOrderReceiptLine" ADD CONSTRAINT "PurchaseOrderReceiptLine_orderLineId_fkey"
    FOREIGN KEY ("orderLineId") REFERENCES "PurchaseOrderLine"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "PurchaseOrderDocument" ADD CONSTRAINT "PurchaseOrderDocument_receiptId_fkey"
    FOREIGN KEY ("receiptId") REFERENCES "PurchaseOrderReceipt"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Dédupliquer avant index unique (hardening CDE-2B / CDE-3A)
WITH ranked AS (
  SELECT id,
    ROW_NUMBER() OVER (
      PARTITION BY "purchaseOrderId"
      ORDER BY "createdAt" ASC
    ) AS rn
  FROM "AgendaEvent"
  WHERE "type" = 'LIVRAISON'
    AND "status" <> 'ANNULE'
    AND "purchaseOrderId" IS NOT NULL
)
UPDATE "AgendaEvent" e
SET
  "status" = 'ANNULE',
  "description" = COALESCE(e."description", '') || E'\nDoublon annulé avant index unique CDE-3A.'
FROM ranked r
WHERE e.id = r.id AND r.rn > 1;

-- Un seul AgendaEvent LIVRAISON actif par commande
CREATE UNIQUE INDEX IF NOT EXISTS "AgendaEvent_one_active_livraison_per_po"
  ON "AgendaEvent" ("purchaseOrderId")
  WHERE "type" = 'LIVRAISON' AND "status" <> 'ANNULE' AND "purchaseOrderId" IS NOT NULL;
