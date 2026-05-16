-- BeWork Devis — bibliothèque ouvrages / prix / sources (PostgreSQL)
-- À appliquer sur Supabase : SQL Editor ou `psql`
--
-- IMPORTANT : exécuter CE FICHIER ENTIER d’un seul bloc (Ctrl+A → Run).
-- Si vous ne lancez que CREATE TABLE "PriceEntry", Postgres répondra :
--   type "BeWorkPriceDocSourceType" does not exist
-- car les CREATE TYPE et les tables WorkItem / PriceSource doivent exister avant.
-- Pour les devis (QuoteProject / QuoteDocument / QuoteLine) : add-bework-quote-documents.sql après celui-ci.

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
    "familyCode" TEXT,
    "sourceCode" TEXT,
    "sourceLine" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WorkItem_code_key" ON "WorkItem"("code");
CREATE INDEX "WorkItem_lot_idx" ON "WorkItem"("lot");
CREATE INDEX "WorkItem_status_idx" ON "WorkItem"("status");
CREATE INDEX "WorkItem_unit_idx" ON "WorkItem"("unit");
CREATE INDEX "WorkItem_itemType_idx" ON "WorkItem"("itemType");
CREATE INDEX "WorkItem_familyCode_idx" ON "WorkItem"("familyCode");

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

-- Devis / projets / lignes : fichier séparé idempotent → prisma/migrations/add-bework-quote-documents.sql
-- (évite les erreurs « type existe déjà » si vous lancez les deux scripts ou si vous relancez ce fichier.)
