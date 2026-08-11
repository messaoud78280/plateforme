-- Commercial* domain migration (additive only)

DO $$ BEGIN
  CREATE TYPE "CommercialQuoteStatus" AS ENUM ('DRAFT', 'TO_VALIDATE', 'VALIDATED', 'SENT', 'VIEWED', 'ACCEPTED', 'REFUSED', 'EXPIRED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "CommercialAmendmentStatus" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'REFUSED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "CommercialInvoiceType" AS ENUM ('STANDARD', 'DEPOSIT', 'PROGRESS', 'FINAL', 'CREDIT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "CommercialInvoiceStatus" AS ENUM ('DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "CommercialComponentType" AS ENUM ('MATERIAL', 'LABOR', 'EQUIPMENT', 'SUBCONTRACT', 'OTHER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "CommercialLineKind" AS ENUM ('WORK', 'COMMENT', 'OPTION', 'SUBTOTAL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "CommercialOrgSettings" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "defaultVatRate" DECIMAL(6,4) NOT NULL DEFAULT 20,
    "defaultCurrency" TEXT NOT NULL DEFAULT 'EUR',
    "targetMarginPercent" DECIMAL(8,4),
    "defaultPaymentTerms" TEXT,
    "bankIban" TEXT,
    "bankBic" TEXT,
    "bankName" TEXT,
    "insuranceMentions" TEXT,
    "legalMentions" TEXT,
    "quotePrefix" TEXT NOT NULL DEFAULT 'DEV',
    "invoicePrefix" TEXT NOT NULL DEFAULT 'FAC',
    "amendmentPrefix" TEXT NOT NULL DEFAULT 'AV',
    "nextQuoteSeq" INTEGER NOT NULL DEFAULT 1,
    "nextInvoiceSeq" INTEGER NOT NULL DEFAULT 1,
    "nextAmendmentSeq" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommercialOrgSettings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CommercialQuote" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" "CommercialQuoteStatus" NOT NULL DEFAULT 'DRAFT',
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "projectId" TEXT,
    "clientExternalOrgId" TEXT,
    "clientSnapshotJson" JSONB,
    "issuerSnapshotJson" JSONB,
    "siteAddressSnapshot" TEXT,
    "issueDate" DATE NOT NULL,
    "validityDate" DATE,
    "responsibleId" TEXT,
    "createdById" TEXT NOT NULL,
    "internalNotes" TEXT,
    "clientNotes" TEXT,
    "paymentTerms" TEXT,
    "depositPercent" DECIMAL(6,4),
    "depositAmountHt" DECIMAL(14,4),
    "defaultVatRate" DECIMAL(6,4) NOT NULL DEFAULT 20,
    "currentVersionId" TEXT,
    "acceptedAt" TIMESTAMP(3),
    "acceptedVersionId" TEXT,
    "sentAt" TIMESTAMP(3),
    "totalCostHt" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "totalSellHt" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "totalVat" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "totalTtc" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "marginAmount" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "marginPercent" DECIMAL(8,4) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommercialQuote_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CommercialQuoteVersion" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "label" TEXT,
    "lockState" TEXT NOT NULL DEFAULT 'DRAFT',
    "issuedAt" TIMESTAMP(3),
    "clientSnapshotJson" JSONB,
    "issuerSnapshotJson" JSONB,
    "paymentTerms" TEXT,
    "clientNotes" TEXT,
    "totalCostHt" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "totalSellHt" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "totalVat" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "totalTtc" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "marginAmount" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "marginPercent" DECIMAL(8,4) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommercialQuoteVersion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CommercialQuoteSection" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommercialQuoteSection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CommercialQuoteLine" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "sectionId" TEXT,
    "kind" "CommercialLineKind" NOT NULL DEFAULT 'WORK',
    "reference" TEXT,
    "designation" TEXT NOT NULL,
    "description" TEXT,
    "quantity" DECIMAL(14,4) NOT NULL DEFAULT 1,
    "unit" TEXT NOT NULL DEFAULT 'U',
    "unitCostHt" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "unitSellHt" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "discountPercent" DECIMAL(6,4) NOT NULL DEFAULT 0,
    "vatRate" DECIMAL(6,4) NOT NULL DEFAULT 20,
    "lineCostHt" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "lineSellHt" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "lineVat" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "lineTtc" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "marginAmount" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "commercialWorkItemId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isOptional" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommercialQuoteLine_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CommercialAmendment" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" "CommercialAmendmentStatus" NOT NULL DEFAULT 'DRAFT',
    "issueDate" DATE NOT NULL,
    "totalSellHt" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "totalVat" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "totalTtc" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "clientNotes" TEXT,
    "internalNotes" TEXT,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommercialAmendment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CommercialAmendmentLine" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "amendmentId" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "quantity" DECIMAL(14,4) NOT NULL DEFAULT 1,
    "unit" TEXT NOT NULL DEFAULT 'U',
    "unitSellHt" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "vatRate" DECIMAL(6,4) NOT NULL DEFAULT 20,
    "lineSellHt" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "lineVat" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "lineTtc" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommercialAmendmentLine_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CommercialInvoice" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "type" "CommercialInvoiceType" NOT NULL DEFAULT 'STANDARD',
    "status" "CommercialInvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "quoteId" TEXT,
    "amendmentId" TEXT,
    "projectId" TEXT,
    "clientExternalOrgId" TEXT,
    "clientSnapshotJson" JSONB,
    "issuerSnapshotJson" JSONB,
    "issueDate" DATE NOT NULL,
    "dueDate" DATE,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "subject" TEXT,
    "totalSellHt" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "totalVat" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "totalTtc" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "amountPaid" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "amountDue" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "depositPercent" DECIMAL(6,4),
    "issuedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "internalNotes" TEXT,
    "clientNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommercialInvoice_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CommercialInvoiceLine" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "description" TEXT,
    "quantity" DECIMAL(14,4) NOT NULL DEFAULT 1,
    "unit" TEXT NOT NULL DEFAULT 'U',
    "unitSellHt" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "vatRate" DECIMAL(6,4) NOT NULL DEFAULT 20,
    "lineSellHt" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "lineVat" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "lineTtc" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommercialInvoiceLine_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CommercialPayment" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "amount" DECIMAL(14,4) NOT NULL,
    "paidAt" DATE NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'VIREMENT',
    "reference" TEXT,
    "comment" TEXT,
    "recordedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommercialPayment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CommercialWorkItem" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "reference" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "family" TEXT,
    "subFamily" TEXT,
    "saleUnit" TEXT NOT NULL DEFAULT 'U',
    "unitCostHt" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "unitSellHt" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "marginPercent" DECIMAL(8,4) NOT NULL DEFAULT 0,
    "sourceWorkItemId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommercialWorkItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CommercialWorkItemComponent" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "workItemId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CommercialComponentType" NOT NULL DEFAULT 'MATERIAL',
    "quantityPerUnit" DECIMAL(14,4) NOT NULL DEFAULT 1,
    "unit" TEXT NOT NULL DEFAULT 'U',
    "unitCostHt" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "lineCostHt" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "materialId" TEXT,
    "laborId" TEXT,
    "equipmentId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommercialWorkItemComponent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CommercialMaterial" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "reference" TEXT,
    "family" TEXT,
    "unit" TEXT NOT NULL DEFAULT 'U',
    "supplierName" TEXT,
    "currentPriceHt" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommercialMaterial_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CommercialMaterialPrice" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "priceHt" DECIMAL(14,4) NOT NULL,
    "source" TEXT,
    "notedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommercialMaterialPrice_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CommercialLaborResource" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hourlyCostHt" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "loadedCostHt" DECIMAL(14,4),
    "notes" TEXT,
    "validFrom" DATE,
    "validTo" DATE,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommercialLaborResource_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CommercialEquipmentResource" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'OWNED',
    "hourlyCostHt" DECIMAL(14,4),
    "dailyCostHt" DECIMAL(14,4),
    "unit" TEXT NOT NULL DEFAULT 'h',
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommercialEquipmentResource_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CommercialStatusEvent" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "detail" TEXT,
    "actorUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommercialStatusEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CommercialOrgSettings_organizationId_key" ON "CommercialOrgSettings"("organizationId");

CREATE UNIQUE INDEX IF NOT EXISTS "CommercialQuote_currentVersionId_key" ON "CommercialQuote"("currentVersionId");

CREATE INDEX IF NOT EXISTS "CommercialQuote_organizationId_status_idx" ON "CommercialQuote"("organizationId", "status");

CREATE INDEX IF NOT EXISTS "CommercialQuote_organizationId_updatedAt_idx" ON "CommercialQuote"("organizationId", "updatedAt");

CREATE INDEX IF NOT EXISTS "CommercialQuote_projectId_idx" ON "CommercialQuote"("projectId");

CREATE INDEX IF NOT EXISTS "CommercialQuote_clientExternalOrgId_idx" ON "CommercialQuote"("clientExternalOrgId");

CREATE UNIQUE INDEX IF NOT EXISTS "CommercialQuote_organizationId_number_key" ON "CommercialQuote"("organizationId", "number");

CREATE INDEX IF NOT EXISTS "CommercialQuoteVersion_organizationId_idx" ON "CommercialQuoteVersion"("organizationId");

CREATE INDEX IF NOT EXISTS "CommercialQuoteVersion_quoteId_idx" ON "CommercialQuoteVersion"("quoteId");

CREATE UNIQUE INDEX IF NOT EXISTS "CommercialQuoteVersion_quoteId_versionNumber_key" ON "CommercialQuoteVersion"("quoteId", "versionNumber");

CREATE INDEX IF NOT EXISTS "CommercialQuoteSection_versionId_sortOrder_idx" ON "CommercialQuoteSection"("versionId", "sortOrder");

CREATE INDEX IF NOT EXISTS "CommercialQuoteSection_organizationId_idx" ON "CommercialQuoteSection"("organizationId");

CREATE INDEX IF NOT EXISTS "CommercialQuoteLine_versionId_sortOrder_idx" ON "CommercialQuoteLine"("versionId", "sortOrder");

CREATE INDEX IF NOT EXISTS "CommercialQuoteLine_sectionId_idx" ON "CommercialQuoteLine"("sectionId");

CREATE INDEX IF NOT EXISTS "CommercialQuoteLine_organizationId_idx" ON "CommercialQuoteLine"("organizationId");

CREATE INDEX IF NOT EXISTS "CommercialQuoteLine_commercialWorkItemId_idx" ON "CommercialQuoteLine"("commercialWorkItemId");

CREATE INDEX IF NOT EXISTS "CommercialAmendment_organizationId_status_idx" ON "CommercialAmendment"("organizationId", "status");

CREATE INDEX IF NOT EXISTS "CommercialAmendment_quoteId_idx" ON "CommercialAmendment"("quoteId");

CREATE UNIQUE INDEX IF NOT EXISTS "CommercialAmendment_organizationId_number_key" ON "CommercialAmendment"("organizationId", "number");

CREATE INDEX IF NOT EXISTS "CommercialAmendmentLine_amendmentId_sortOrder_idx" ON "CommercialAmendmentLine"("amendmentId", "sortOrder");

CREATE INDEX IF NOT EXISTS "CommercialAmendmentLine_organizationId_idx" ON "CommercialAmendmentLine"("organizationId");

CREATE INDEX IF NOT EXISTS "CommercialInvoice_organizationId_status_idx" ON "CommercialInvoice"("organizationId", "status");

CREATE INDEX IF NOT EXISTS "CommercialInvoice_quoteId_idx" ON "CommercialInvoice"("quoteId");

CREATE INDEX IF NOT EXISTS "CommercialInvoice_projectId_idx" ON "CommercialInvoice"("projectId");

CREATE INDEX IF NOT EXISTS "CommercialInvoice_clientExternalOrgId_idx" ON "CommercialInvoice"("clientExternalOrgId");

CREATE UNIQUE INDEX IF NOT EXISTS "CommercialInvoice_organizationId_number_key" ON "CommercialInvoice"("organizationId", "number");

CREATE INDEX IF NOT EXISTS "CommercialInvoiceLine_invoiceId_sortOrder_idx" ON "CommercialInvoiceLine"("invoiceId", "sortOrder");

CREATE INDEX IF NOT EXISTS "CommercialInvoiceLine_organizationId_idx" ON "CommercialInvoiceLine"("organizationId");

CREATE INDEX IF NOT EXISTS "CommercialPayment_organizationId_idx" ON "CommercialPayment"("organizationId");

CREATE INDEX IF NOT EXISTS "CommercialPayment_invoiceId_idx" ON "CommercialPayment"("invoiceId");

CREATE INDEX IF NOT EXISTS "CommercialWorkItem_organizationId_name_idx" ON "CommercialWorkItem"("organizationId", "name");

CREATE INDEX IF NOT EXISTS "CommercialWorkItem_organizationId_family_idx" ON "CommercialWorkItem"("organizationId", "family");

CREATE INDEX IF NOT EXISTS "CommercialWorkItem_sourceWorkItemId_idx" ON "CommercialWorkItem"("sourceWorkItemId");

CREATE INDEX IF NOT EXISTS "CommercialWorkItemComponent_workItemId_sortOrder_idx" ON "CommercialWorkItemComponent"("workItemId", "sortOrder");

CREATE INDEX IF NOT EXISTS "CommercialWorkItemComponent_organizationId_idx" ON "CommercialWorkItemComponent"("organizationId");

CREATE INDEX IF NOT EXISTS "CommercialMaterial_organizationId_name_idx" ON "CommercialMaterial"("organizationId", "name");

CREATE INDEX IF NOT EXISTS "CommercialMaterialPrice_materialId_notedAt_idx" ON "CommercialMaterialPrice"("materialId", "notedAt");

CREATE INDEX IF NOT EXISTS "CommercialMaterialPrice_organizationId_idx" ON "CommercialMaterialPrice"("organizationId");

CREATE INDEX IF NOT EXISTS "CommercialLaborResource_organizationId_name_idx" ON "CommercialLaborResource"("organizationId", "name");

CREATE INDEX IF NOT EXISTS "CommercialEquipmentResource_organizationId_name_idx" ON "CommercialEquipmentResource"("organizationId", "name");

CREATE INDEX IF NOT EXISTS "CommercialStatusEvent_organizationId_entityType_entityId_idx" ON "CommercialStatusEvent"("organizationId", "entityType", "entityId");

CREATE INDEX IF NOT EXISTS "CommercialStatusEvent_createdAt_idx" ON "CommercialStatusEvent"("createdAt");

DO $$ BEGIN
  ALTER TABLE "CommercialOrgSettings" ADD CONSTRAINT "CommercialOrgSettings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "CommercialQuote" ADD CONSTRAINT "CommercialQuote_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "CommercialQuote" ADD CONSTRAINT "CommercialQuote_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "CommercialQuote" ADD CONSTRAINT "CommercialQuote_clientExternalOrgId_fkey" FOREIGN KEY ("clientExternalOrgId") REFERENCES "ExternalOrganization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "CommercialQuote" ADD CONSTRAINT "CommercialQuote_responsibleId_fkey" FOREIGN KEY ("responsibleId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "CommercialQuote" ADD CONSTRAINT "CommercialQuote_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "CommercialQuote" ADD CONSTRAINT "CommercialQuote_currentVersionId_fkey" FOREIGN KEY ("currentVersionId") REFERENCES "CommercialQuoteVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "CommercialQuoteVersion" ADD CONSTRAINT "CommercialQuoteVersion_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "CommercialQuote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "CommercialQuoteSection" ADD CONSTRAINT "CommercialQuoteSection_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "CommercialQuoteVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "CommercialQuoteLine" ADD CONSTRAINT "CommercialQuoteLine_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "CommercialQuoteVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "CommercialQuoteLine" ADD CONSTRAINT "CommercialQuoteLine_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "CommercialQuoteSection"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "CommercialQuoteLine" ADD CONSTRAINT "CommercialQuoteLine_commercialWorkItemId_fkey" FOREIGN KEY ("commercialWorkItemId") REFERENCES "CommercialWorkItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "CommercialAmendment" ADD CONSTRAINT "CommercialAmendment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "CommercialAmendment" ADD CONSTRAINT "CommercialAmendment_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "CommercialQuote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "CommercialAmendmentLine" ADD CONSTRAINT "CommercialAmendmentLine_amendmentId_fkey" FOREIGN KEY ("amendmentId") REFERENCES "CommercialAmendment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "CommercialInvoice" ADD CONSTRAINT "CommercialInvoice_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "CommercialInvoice" ADD CONSTRAINT "CommercialInvoice_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "CommercialQuote"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "CommercialInvoice" ADD CONSTRAINT "CommercialInvoice_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "CommercialInvoice" ADD CONSTRAINT "CommercialInvoice_clientExternalOrgId_fkey" FOREIGN KEY ("clientExternalOrgId") REFERENCES "ExternalOrganization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "CommercialInvoice" ADD CONSTRAINT "CommercialInvoice_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "CommercialInvoiceLine" ADD CONSTRAINT "CommercialInvoiceLine_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "CommercialInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "CommercialPayment" ADD CONSTRAINT "CommercialPayment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "CommercialPayment" ADD CONSTRAINT "CommercialPayment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "CommercialInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "CommercialPayment" ADD CONSTRAINT "CommercialPayment_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "CommercialWorkItem" ADD CONSTRAINT "CommercialWorkItem_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "CommercialWorkItemComponent" ADD CONSTRAINT "CommercialWorkItemComponent_workItemId_fkey" FOREIGN KEY ("workItemId") REFERENCES "CommercialWorkItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "CommercialWorkItemComponent" ADD CONSTRAINT "CommercialWorkItemComponent_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "CommercialMaterial"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "CommercialWorkItemComponent" ADD CONSTRAINT "CommercialWorkItemComponent_laborId_fkey" FOREIGN KEY ("laborId") REFERENCES "CommercialLaborResource"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "CommercialWorkItemComponent" ADD CONSTRAINT "CommercialWorkItemComponent_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "CommercialEquipmentResource"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "CommercialMaterial" ADD CONSTRAINT "CommercialMaterial_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "CommercialMaterialPrice" ADD CONSTRAINT "CommercialMaterialPrice_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "CommercialMaterial"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "CommercialLaborResource" ADD CONSTRAINT "CommercialLaborResource_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "CommercialEquipmentResource" ADD CONSTRAINT "CommercialEquipmentResource_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "CommercialStatusEvent" ADD CONSTRAINT "CommercialStatusEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "CommercialStatusEvent" ADD CONSTRAINT "CommercialStatusEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
