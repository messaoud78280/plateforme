-- BeWork Devis : projets clients & documents de chiffrage (devis, DPGF, etc.)
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
