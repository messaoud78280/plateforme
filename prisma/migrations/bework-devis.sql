-- BeWork Devis — bibliothèque ouvrages / prix / sources (PostgreSQL)
-- À appliquer sur Supabase : SQL Editor ou `psql`
--
-- IMPORTANT : exécuter CE FICHIER ENTIER d’un seul bloc (Ctrl+A → Run).
-- Si vous ne lancez que CREATE TABLE "PriceEntry", Postgres répondra :
--   type "BeWorkPriceDocSourceType" does not exist
-- car les CREATE TYPE et les tables WorkItem / PriceSource doivent exister avant.

CREATE TYPE "WorkItemQualityLevel" AS ENUM ('standard', 'confort', 'premium');
CREATE TYPE "WorkItemStatus" AS ENUM ('brouillon', 'a_completer', 'a_verifier', 'valide', 'archive');
CREATE TYPE "WorkItemItemType" AS ENUM (
  'ouvrage_technique',
  'etude_controle',
  'prestation_administrative',
  'garantie_assurance',
  'frais_annexe'
);
CREATE TYPE "BeWorkPriceDocSourceType" AS ENUM ('devis', 'bpu', 'dpgf', 'marche_public', 'estimation_interne', 'autre');

CREATE TABLE "WorkItem" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "lot" TEXT NOT NULL,
    "subLot" TEXT,
    "family" TEXT,
    "title" TEXT NOT NULL,
    "shortDescription" TEXT,
    "fullDescription" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "qualityLevel" "WorkItemQualityLevel" NOT NULL DEFAULT 'standard',
    "technicalReference" TEXT,
    "includedItems" TEXT,
    "excludedItems" TEXT,
    "vigilancePoints" TEXT,
    "clientQuestions" TEXT,
    "companyQuestions" TEXT,
    "internalNotes" TEXT,
    "status" "WorkItemStatus" NOT NULL DEFAULT 'brouillon',
    "itemType" "WorkItemItemType" NOT NULL DEFAULT 'ouvrage_technique',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WorkItem_code_key" ON "WorkItem"("code");
CREATE INDEX "WorkItem_lot_idx" ON "WorkItem"("lot");
CREATE INDEX "WorkItem_status_idx" ON "WorkItem"("status");
CREATE INDEX "WorkItem_unit_idx" ON "WorkItem"("unit");
CREATE INDEX "WorkItem_itemType_idx" ON "WorkItem"("itemType");

CREATE TABLE "PriceSource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sourceType" "BeWorkPriceDocSourceType" NOT NULL,
    "clientName" TEXT,
    "projectName" TEXT,
    "projectLocation" TEXT,
    "department" TEXT,
    "dateDocument" DATE,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PriceSource_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PriceSource_sourceType_idx" ON "PriceSource"("sourceType");

CREATE TABLE "PriceEntry" (
    "id" TEXT NOT NULL,
    "workItemId" TEXT NOT NULL,
    "priceSourceId" TEXT,
    "sourceName" TEXT NOT NULL,
    "sourceType" "BeWorkPriceDocSourceType" NOT NULL,
    "unitPriceHT" DECIMAL(14,4) NOT NULL,
    "vatRate" DECIMAL(6,4) NOT NULL,
    "unitPriceTTC" DECIMAL(14,4) NOT NULL,
    "quantity" DECIMAL(14,4),
    "totalHT" DECIMAL(14,4),
    "totalTTC" DECIMAL(14,4),
    "region" TEXT,
    "department" TEXT,
    "projectType" TEXT,
    "qualityLevel" TEXT,
    "dateObserved" DATE,
    "reliabilityScore" INTEGER NOT NULL DEFAULT 3,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PriceEntry_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "PriceEntry_workItemId_fkey" FOREIGN KEY ("workItemId") REFERENCES "WorkItem"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PriceEntry_priceSourceId_fkey" FOREIGN KEY ("priceSourceId") REFERENCES "PriceSource"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "PriceEntry_workItemId_idx" ON "PriceEntry"("workItemId");
CREATE INDEX "PriceEntry_sourceType_idx" ON "PriceEntry"("sourceType");
CREATE INDEX "PriceEntry_department_idx" ON "PriceEntry"("department");

CREATE TYPE "QuoteDocumentType" AS ENUM (
  'devis_estimatif',
  'dpgf_consultation',
  'devis_corrige',
  'comparatif_devis',
  'devis_contractuel'
);

CREATE TYPE "QuoteDocumentStatus" AS ENUM (
  'brouillon',
  'a_verifier',
  'pret_a_envoyer',
  'envoye',
  'archive'
);

CREATE TABLE "QuoteProject" (
    "id" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "clientEmail" TEXT,
    "clientPhone" TEXT,
    "projectName" TEXT NOT NULL,
    "projectAddress" TEXT,
    "projectCity" TEXT,
    "projectDepartment" TEXT,
    "projectType" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuoteProject_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "QuoteProject_clientName_idx" ON "QuoteProject"("clientName");
CREATE INDEX "QuoteProject_projectName_idx" ON "QuoteProject"("projectName");

CREATE TABLE "QuoteDocument" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "documentNumber" TEXT NOT NULL,
    "documentType" "QuoteDocumentType" NOT NULL DEFAULT 'devis_estimatif',
    "title" TEXT NOT NULL,
    "status" "QuoteDocumentStatus" NOT NULL DEFAULT 'brouillon',
    "issueDate" DATE NOT NULL,
    "validityDate" DATE,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "globalVatRate" DECIMAL(6,4) NOT NULL DEFAULT 20,
    "subtotalHT" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "totalVat" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "totalTTC" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "notesClient" TEXT,
    "internalNotes" TEXT,
    "legalDisclaimer" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuoteDocument_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "QuoteDocument_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "QuoteProject"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "QuoteDocument_documentNumber_key" ON "QuoteDocument"("documentNumber");
CREATE INDEX "QuoteDocument_projectId_idx" ON "QuoteDocument"("projectId");
CREATE INDEX "QuoteDocument_status_idx" ON "QuoteDocument"("status");
CREATE INDEX "QuoteDocument_documentType_idx" ON "QuoteDocument"("documentType");

CREATE TABLE "QuoteLine" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "workItemId" TEXT,
    "lot" TEXT NOT NULL,
    "family" TEXT,
    "code" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "quantity" DECIMAL(14,4) NOT NULL,
    "unitPriceHT" DECIMAL(14,4) NOT NULL,
    "vatRate" DECIMAL(6,4) NOT NULL,
    "totalHT" DECIMAL(14,4) NOT NULL,
    "totalVat" DECIMAL(14,4) NOT NULL,
    "totalTTC" DECIMAL(14,4) NOT NULL,
    "includedItems" TEXT,
    "excludedItems" TEXT,
    "vigilancePoints" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuoteLine_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "QuoteLine_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "QuoteDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "QuoteLine_workItemId_fkey" FOREIGN KEY ("workItemId") REFERENCES "WorkItem"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "QuoteLine_documentId_idx" ON "QuoteLine"("documentId");
CREATE INDEX "QuoteLine_workItemId_idx" ON "QuoteLine"("workItemId");
CREATE INDEX "QuoteLine_lot_idx" ON "QuoteLine"("lot");
