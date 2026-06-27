-- Fiches pédagogiques Analyse DPGF (PostgreSQL / Supabase)
-- À exécuter après le schéma BeWork Devis existant.

CREATE TYPE "DpgfAnalysisSheetSource" AS ENUM ('dpgf', 'bpu', 'cctp', 'manuel', 'import');
CREATE TYPE "DpgfAnalysisComprehensionLevel" AS ENUM ('debutant', 'intermediaire', 'confirme');

CREATE TABLE "DpgfAnalysisSheet" (
    "id" TEXT NOT NULL,
    "codeSheet" TEXT NOT NULL,
    "lot" TEXT NOT NULL,
    "tradeCode" TEXT,
    "familyName" TEXT,
    "ouvrageType" TEXT,
    "originalDesignation" TEXT NOT NULL,
    "simplifiedDesignation" TEXT,
    "unit" TEXT NOT NULL,
    "source" "DpgfAnalysisSheetSource" NOT NULL DEFAULT 'manuel',
    "status" "WorkItemStatus" NOT NULL DEFAULT 'brouillon',
    "comprehensionLevel" "DpgfAnalysisComprehensionLevel" NOT NULL DEFAULT 'intermediaire',
    "hasModeOperatoire" BOOLEAN NOT NULL DEFAULT false,
    "hasVigilancePoints" BOOLEAN NOT NULL DEFAULT false,
    "hasQuestions" BOOLEAN NOT NULL DEFAULT false,
    "content" JSONB NOT NULL,
    "links" JSONB,
    "dceFillSessionId" TEXT,
    "dceLineIndex" INTEGER,
    "workItemId" TEXT,
    "quoteDocumentId" TEXT,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DpgfAnalysisSheet_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DpgfAnalysisSheet_codeSheet_key" ON "DpgfAnalysisSheet"("codeSheet");
CREATE INDEX "DpgfAnalysisSheet_lot_idx" ON "DpgfAnalysisSheet"("lot");
CREATE INDEX "DpgfAnalysisSheet_tradeCode_idx" ON "DpgfAnalysisSheet"("tradeCode");
CREATE INDEX "DpgfAnalysisSheet_status_idx" ON "DpgfAnalysisSheet"("status");
CREATE INDEX "DpgfAnalysisSheet_comprehensionLevel_idx" ON "DpgfAnalysisSheet"("comprehensionLevel");
CREATE INDEX "DpgfAnalysisSheet_source_idx" ON "DpgfAnalysisSheet"("source");
CREATE INDEX "DpgfAnalysisSheet_hasModeOperatoire_idx" ON "DpgfAnalysisSheet"("hasModeOperatoire");
CREATE INDEX "DpgfAnalysisSheet_hasVigilancePoints_idx" ON "DpgfAnalysisSheet"("hasVigilancePoints");
CREATE INDEX "DpgfAnalysisSheet_hasQuestions_idx" ON "DpgfAnalysisSheet"("hasQuestions");
CREATE INDEX "DpgfAnalysisSheet_updatedAt_idx" ON "DpgfAnalysisSheet"("updatedAt");
CREATE INDEX "DpgfAnalysisSheet_dceFillSessionId_idx" ON "DpgfAnalysisSheet"("dceFillSessionId");
CREATE INDEX "DpgfAnalysisSheet_workItemId_idx" ON "DpgfAnalysisSheet"("workItemId");

ALTER TABLE "DpgfAnalysisSheet" ADD CONSTRAINT "DpgfAnalysisSheet_dceFillSessionId_fkey"
  FOREIGN KEY ("dceFillSessionId") REFERENCES "DcePricingFillSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DpgfAnalysisSheet" ADD CONSTRAINT "DpgfAnalysisSheet_workItemId_fkey"
  FOREIGN KEY ("workItemId") REFERENCES "WorkItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DpgfAnalysisSheet" ADD CONSTRAINT "DpgfAnalysisSheet_quoteDocumentId_fkey"
  FOREIGN KEY ("quoteDocumentId") REFERENCES "QuoteDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;
