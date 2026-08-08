-- CDE-1 — Commandes chantier + enrichissement fournisseurs
-- Non destructif.

-- ExternalOrganization enrichi
ALTER TABLE "ExternalOrganization" ADD COLUMN IF NOT EXISTS "tradeName" TEXT;
ALTER TABLE "ExternalOrganization" ADD COLUMN IF NOT EXISTS "siret" TEXT;
ALTER TABLE "ExternalOrganization" ADD COLUMN IF NOT EXISTS "address" TEXT;
ALTER TABLE "ExternalOrganization" ADD COLUMN IF NOT EXISTS "city" TEXT;
ALTER TABLE "ExternalOrganization" ADD COLUMN IF NOT EXISTS "zipCode" TEXT;
ALTER TABLE "ExternalOrganization" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "ExternalOrganization" ADD COLUMN IF NOT EXISTS "email" TEXT;
ALTER TABLE "ExternalOrganization" ADD COLUMN IF NOT EXISTS "website" TEXT;
ALTER TABLE "ExternalOrganization" ADD COLUMN IF NOT EXISTS "activity" TEXT;
ALTER TABLE "ExternalOrganization" ADD COLUMN IF NOT EXISTS "paymentTerms" TEXT;
ALTER TABLE "ExternalOrganization" ADD COLUMN IF NOT EXISTS "deliveryTerms" TEXT;
ALTER TABLE "ExternalOrganization" ADD COLUMN IF NOT EXISTS "notes" TEXT;
ALTER TABLE "ExternalOrganization" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'ACTIVE';

CREATE INDEX IF NOT EXISTS "ExternalOrganization_hostOrganizationId_name_idx"
  ON "ExternalOrganization"("hostOrganizationId", "name");

-- Contacts fournisseur
CREATE TABLE IF NOT EXISTS "ExternalOrgContact" (
  "id" TEXT NOT NULL,
  "externalOrganizationId" TEXT NOT NULL,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "jobTitle" TEXT,
  "email" TEXT,
  "phone" TEXT,
  "userId" TEXT,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ExternalOrgContact_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ExternalOrgContact_externalOrganizationId_idx"
  ON "ExternalOrgContact"("externalOrganizationId");
CREATE INDEX IF NOT EXISTS "ExternalOrgContact_userId_idx"
  ON "ExternalOrgContact"("userId");
CREATE INDEX IF NOT EXISTS "ExternalOrgContact_email_idx"
  ON "ExternalOrgContact"("email");

DO $$ BEGIN
  ALTER TABLE "ExternalOrgContact"
    ADD CONSTRAINT "ExternalOrgContact_externalOrganizationId_fkey"
    FOREIGN KEY ("externalOrganizationId") REFERENCES "ExternalOrganization"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "ExternalOrgContact"
    ADD CONSTRAINT "ExternalOrgContact_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Enum statut commande
DO $$ BEGIN
  CREATE TYPE "PurchaseOrderStatus" AS ENUM (
    'BROUILLON',
    'A_VALIDER',
    'VALIDEE',
    'ENVOYEE_FOURNISSEUR',
    'A_CONFIRMER',
    'CONFIRMEE',
    'LIVRAISON_PROGRAMMEE',
    'PARTIELLEMENT_RECUE',
    'RECUE',
    'CLOTUREE',
    'ANNULEE',
    'REFUSEE'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "PurchaseOrder" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "number" TEXT NOT NULL,
  "status" "PurchaseOrderStatus" NOT NULL DEFAULT 'BROUILLON',
  "subject" TEXT NOT NULL,
  "projectId" TEXT,
  "followUpSheetId" TEXT,
  "externalOrganizationId" TEXT NOT NULL,
  "contactId" TEXT,
  "requestedById" TEXT NOT NULL,
  "responsibleId" TEXT,
  "validatorId" TEXT,
  "legacyTaskId" TEXT,
  "requestedDeliveryAt" TIMESTAMP(3),
  "confirmedDeliveryAt" TIMESTAMP(3),
  "deliveryPlaceType" TEXT NOT NULL DEFAULT 'CHANTIER',
  "deliveryAddress" TEXT,
  "supplierRef" TEXT,
  "quoteRef" TEXT,
  "quoteDate" TIMESTAMP(3),
  "amountHt" DECIMAL(14,2),
  "tvaRate" DECIMAL(5,2),
  "discountHt" DECIMAL(14,2),
  "deliveryFeesHt" DECIMAL(14,2),
  "paymentTerms" TEXT,
  "deliveryInstructions" TEXT,
  "siteContactName" TEXT,
  "siteContactPhone" TEXT,
  "partialDeliveryAllowed" BOOLEAN NOT NULL DEFAULT true,
  "internalNotes" TEXT,
  "supplierNotes" TEXT,
  "urgency" TEXT,
  "sharedWithSupplier" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PurchaseOrder_organizationId_number_key"
  ON "PurchaseOrder"("organizationId", "number");
CREATE UNIQUE INDEX IF NOT EXISTS "PurchaseOrder_legacyTaskId_key"
  ON "PurchaseOrder"("legacyTaskId");
CREATE INDEX IF NOT EXISTS "PurchaseOrder_organizationId_status_idx"
  ON "PurchaseOrder"("organizationId", "status");
CREATE INDEX IF NOT EXISTS "PurchaseOrder_projectId_idx" ON "PurchaseOrder"("projectId");
CREATE INDEX IF NOT EXISTS "PurchaseOrder_followUpSheetId_idx" ON "PurchaseOrder"("followUpSheetId");
CREATE INDEX IF NOT EXISTS "PurchaseOrder_externalOrganizationId_idx" ON "PurchaseOrder"("externalOrganizationId");
CREATE INDEX IF NOT EXISTS "PurchaseOrder_requestedById_idx" ON "PurchaseOrder"("requestedById");
CREATE INDEX IF NOT EXISTS "PurchaseOrder_responsibleId_idx" ON "PurchaseOrder"("responsibleId");

DO $$ BEGIN
  ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_followUpSheetId_fkey"
    FOREIGN KEY ("followUpSheetId") REFERENCES "FollowUpSheet"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_externalOrganizationId_fkey"
    FOREIGN KEY ("externalOrganizationId") REFERENCES "ExternalOrganization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_contactId_fkey"
    FOREIGN KEY ("contactId") REFERENCES "ExternalOrgContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_requestedById_fkey"
    FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_responsibleId_fkey"
    FOREIGN KEY ("responsibleId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_validatorId_fkey"
    FOREIGN KEY ("validatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_legacyTaskId_fkey"
    FOREIGN KEY ("legacyTaskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "PurchaseOrderLine" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "designation" TEXT NOT NULL,
  "quantity" DECIMAL(14,3) NOT NULL,
  "unit" TEXT NOT NULL DEFAULT 'U',
  "unitPriceHt" DECIMAL(14,2),
  "tvaRate" DECIMAL(5,2),
  "receivedQty" DECIMAL(14,3) NOT NULL DEFAULT 0,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PurchaseOrderLine_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "PurchaseOrderLine_orderId_idx" ON "PurchaseOrderLine"("orderId");
DO $$ BEGIN
  ALTER TABLE "PurchaseOrderLine" ADD CONSTRAINT "PurchaseOrderLine_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "PurchaseOrderEvent" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "detail" TEXT,
  "actorUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PurchaseOrderEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "PurchaseOrderEvent_orderId_createdAt_idx"
  ON "PurchaseOrderEvent"("orderId", "createdAt");
DO $$ BEGIN
  ALTER TABLE "PurchaseOrderEvent" ADD CONSTRAINT "PurchaseOrderEvent_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "PurchaseOrderEvent" ADD CONSTRAINT "PurchaseOrderEvent_actorUserId_fkey"
    FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "PurchaseOrderDocument" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "fileUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PurchaseOrderDocument_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "PurchaseOrderDocument_orderId_idx" ON "PurchaseOrderDocument"("orderId");
DO $$ BEGIN
  ALTER TABLE "PurchaseOrderDocument" ADD CONSTRAINT "PurchaseOrderDocument_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "AgendaEvent" ADD COLUMN IF NOT EXISTS "purchaseOrderId" TEXT;
CREATE INDEX IF NOT EXISTS "AgendaEvent_purchaseOrderId_startAt_idx"
  ON "AgendaEvent"("purchaseOrderId", "startAt");
DO $$ BEGIN
  ALTER TABLE "AgendaEvent" ADD CONSTRAINT "AgendaEvent_purchaseOrderId_fkey"
    FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
