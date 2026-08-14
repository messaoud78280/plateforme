-- PILOTAGE-2 — Factures fournisseurs / dépenses réelles

DO $$ BEGIN
  CREATE TYPE "SupplierInvoiceStatus" AS ENUM ('DRAFT', 'RECORDED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "SupplierInvoiceKind" AS ENUM ('STANDARD', 'CREDIT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "SupplierInvoice" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "purchaseOrderId" TEXT,
  "externalOrganizationId" TEXT NOT NULL,
  "supplierNumber" TEXT NOT NULL,
  "kind" "SupplierInvoiceKind" NOT NULL DEFAULT 'STANDARD',
  "status" "SupplierInvoiceStatus" NOT NULL DEFAULT 'RECORDED',
  "category" TEXT NOT NULL,
  "invoiceDate" DATE NOT NULL,
  "amountHt" DECIMAL(14,4) NOT NULL,
  "amountVat" DECIMAL(14,4) NOT NULL DEFAULT 0,
  "amountTtc" DECIMAL(14,4) NOT NULL,
  "notes" TEXT,
  "createdById" TEXT NOT NULL,
  "cancelledAt" TIMESTAMP(3),
  "cancelledById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SupplierInvoice_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SupplierInvoice_org_supplier_number_key"
  ON "SupplierInvoice"("organizationId", "externalOrganizationId", "supplierNumber");
CREATE INDEX IF NOT EXISTS "SupplierInvoice_organizationId_projectId_idx"
  ON "SupplierInvoice"("organizationId", "projectId");
CREATE INDEX IF NOT EXISTS "SupplierInvoice_organizationId_status_idx"
  ON "SupplierInvoice"("organizationId", "status");
CREATE INDEX IF NOT EXISTS "SupplierInvoice_purchaseOrderId_idx"
  ON "SupplierInvoice"("purchaseOrderId");
CREATE INDEX IF NOT EXISTS "SupplierInvoice_externalOrganizationId_idx"
  ON "SupplierInvoice"("externalOrganizationId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SupplierInvoice_organizationId_fkey') THEN
    ALTER TABLE "SupplierInvoice"
      ADD CONSTRAINT "SupplierInvoice_organizationId_fkey"
      FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SupplierInvoice_projectId_fkey') THEN
    ALTER TABLE "SupplierInvoice"
      ADD CONSTRAINT "SupplierInvoice_projectId_fkey"
      FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SupplierInvoice_purchaseOrderId_fkey') THEN
    ALTER TABLE "SupplierInvoice"
      ADD CONSTRAINT "SupplierInvoice_purchaseOrderId_fkey"
      FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SupplierInvoice_externalOrganizationId_fkey') THEN
    ALTER TABLE "SupplierInvoice"
      ADD CONSTRAINT "SupplierInvoice_externalOrganizationId_fkey"
      FOREIGN KEY ("externalOrganizationId") REFERENCES "ExternalOrganization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SupplierInvoice_createdById_fkey') THEN
    ALTER TABLE "SupplierInvoice"
      ADD CONSTRAINT "SupplierInvoice_createdById_fkey"
      FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SupplierInvoice_cancelledById_fkey') THEN
    ALTER TABLE "SupplierInvoice"
      ADD CONSTRAINT "SupplierInvoice_cancelledById_fkey"
      FOREIGN KEY ("cancelledById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
