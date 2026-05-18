-- BeWork Devis — Ressources chantier (V1 + regroupement / alias / variantes)
-- PRÉREQUIS : table "WorkItem" (bework-devis.sql)
-- À exécuter en entier dans Supabase SQL Editor (idempotent).

DO $$ BEGIN
  CREATE TYPE "SiteResourceType" AS ENUM (
    'materiaux',
    'consommables',
    'location_engin',
    'location_outillage',
    'equipements',
    'services'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "SiteResourceStatus" AS ENUM ('brouillon', 'a_verifier', 'valide', 'archive', 'fusionne');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "SiteResourceConfidence" AS ENUM ('faible', 'moyen', 'eleve');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "SiteResourceAliasKind" AS ENUM (
    'synonyme',
    'extraction_ouvrage',
    'fournisseur',
    'orthographe',
    'ancien_libelle',
    'court',
    'variante_libelle'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "SiteResourceLinkRole" AS ENUM (
    'materiau_principal',
    'fourniture',
    'consommable',
    'location',
    'equipement',
    'service',
    'autre'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "SiteResourceExtractedFrom" AS ENUM ('title', 'includedItems', 'fullDescription', 'manuel');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "SiteResourceGroupingProposalType" AS ENUM (
    'merge_as_alias',
    'create_variant',
    'new_resource',
    'keep_separate',
    'ignore'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "SiteResourceGroupingProposalStatus" AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "SiteResourceExtractionRunStatus" AS ENUM ('draft', 'preview', 'applied', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "SiteResource" (
    "id" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "fullDescription" TEXT NOT NULL,
    "resourceType" "SiteResourceType" NOT NULL,
    "family" TEXT NOT NULL,
    "subFamily" TEXT,
    "orderUnit" TEXT NOT NULL,
    "siteUsage" TEXT,
    "mainCharacteristics" TEXT,
    "characteristicsToVerify" TEXT,
    "businessNotes" TEXT,
    "confidenceLevel" "SiteResourceConfidence" NOT NULL DEFAULT 'moyen',
    "status" "SiteResourceStatus" NOT NULL DEFAULT 'brouillon',
    "mergedIntoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SiteResource_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "SiteResource_mergedIntoId_fkey" FOREIGN KEY ("mergedIntoId") REFERENCES "SiteResource"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "SiteResource_resourceType_family_subFamily_idx" ON "SiteResource"("resourceType", "family", "subFamily");
CREATE INDEX IF NOT EXISTS "SiteResource_status_idx" ON "SiteResource"("status");
CREATE INDEX IF NOT EXISTS "SiteResource_shortName_idx" ON "SiteResource"("shortName");
CREATE INDEX IF NOT EXISTS "SiteResource_mergedIntoId_idx" ON "SiteResource"("mergedIntoId");

CREATE TABLE IF NOT EXISTS "SiteResourceAlias" (
    "id" TEXT NOT NULL,
    "siteResourceId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "normalizedLabel" TEXT NOT NULL,
    "aliasKind" "SiteResourceAliasKind" NOT NULL DEFAULT 'extraction_ouvrage',
    "sourceWorkItemId" TEXT,
    "sourceField" "SiteResourceExtractedFrom",
    "sourceSnippet" TEXT,
    "confidenceScore" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SiteResourceAlias_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "SiteResourceAlias_siteResourceId_fkey" FOREIGN KEY ("siteResourceId") REFERENCES "SiteResource"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SiteResourceAlias_sourceWorkItemId_fkey" FOREIGN KEY ("sourceWorkItemId") REFERENCES "WorkItem"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "SiteResourceAlias_siteResourceId_idx" ON "SiteResourceAlias"("siteResourceId");
CREATE INDEX IF NOT EXISTS "SiteResourceAlias_normalizedLabel_idx" ON "SiteResourceAlias"("normalizedLabel");
CREATE INDEX IF NOT EXISTS "SiteResourceAlias_sourceWorkItemId_idx" ON "SiteResourceAlias"("sourceWorkItemId");

CREATE TABLE IF NOT EXISTS "SiteResourceVariant" (
    "id" TEXT NOT NULL,
    "siteResourceId" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "fullDescription" TEXT NOT NULL,
    "distinguishingAttributes" TEXT,
    "orderUnit" TEXT,
    "confidenceLevel" "SiteResourceConfidence" NOT NULL DEFAULT 'moyen',
    "status" "SiteResourceStatus" NOT NULL DEFAULT 'a_verifier',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SiteResourceVariant_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "SiteResourceVariant_siteResourceId_fkey" FOREIGN KEY ("siteResourceId") REFERENCES "SiteResource"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "SiteResourceVariant_siteResourceId_idx" ON "SiteResourceVariant"("siteResourceId");
CREATE INDEX IF NOT EXISTS "SiteResourceVariant_status_idx" ON "SiteResourceVariant"("status");

CREATE TABLE IF NOT EXISTS "SiteResourceExtractionRun" (
    "id" TEXT NOT NULL,
    "label" TEXT,
    "status" "SiteResourceExtractionRunStatus" NOT NULL DEFAULT 'draft',
    "workItemCount" INTEGER NOT NULL DEFAULT 0,
    "candidateCount" INTEGER NOT NULL DEFAULT 0,
    "proposalCount" INTEGER NOT NULL DEFAULT 0,
    "meta" JSONB,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SiteResourceExtractionRun_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "SiteResourceExtractionRun_status_idx" ON "SiteResourceExtractionRun"("status");
CREATE INDEX IF NOT EXISTS "SiteResourceExtractionRun_createdAt_idx" ON "SiteResourceExtractionRun"("createdAt");

CREATE TABLE IF NOT EXISTS "SiteResourceGroupingProposal" (
    "id" TEXT NOT NULL,
    "extractionRunId" TEXT,
    "proposalType" "SiteResourceGroupingProposalType" NOT NULL,
    "status" "SiteResourceGroupingProposalStatus" NOT NULL DEFAULT 'pending',
    "similarityScore" INTEGER NOT NULL,
    "sourceLabel" TEXT NOT NULL,
    "normalizedSourceLabel" TEXT NOT NULL,
    "targetSiteResourceId" TEXT,
    "sourceWorkItemId" TEXT,
    "sourceField" "SiteResourceExtractedFrom",
    "sourceSnippet" TEXT,
    "matchReasons" JSONB,
    "createdSiteResourceId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SiteResourceGroupingProposal_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "SiteResourceGroupingProposal_extractionRunId_fkey" FOREIGN KEY ("extractionRunId") REFERENCES "SiteResourceExtractionRun"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SiteResourceGroupingProposal_targetSiteResourceId_fkey" FOREIGN KEY ("targetSiteResourceId") REFERENCES "SiteResource"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SiteResourceGroupingProposal_sourceWorkItemId_fkey" FOREIGN KEY ("sourceWorkItemId") REFERENCES "WorkItem"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SiteResourceGroupingProposal_createdSiteResourceId_fkey" FOREIGN KEY ("createdSiteResourceId") REFERENCES "SiteResource"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "SiteResourceGroupingProposal_extractionRunId_idx" ON "SiteResourceGroupingProposal"("extractionRunId");
CREATE INDEX IF NOT EXISTS "SiteResourceGroupingProposal_status_idx" ON "SiteResourceGroupingProposal"("status");
CREATE INDEX IF NOT EXISTS "SiteResourceGroupingProposal_targetSiteResourceId_idx" ON "SiteResourceGroupingProposal"("targetSiteResourceId");
CREATE INDEX IF NOT EXISTS "SiteResourceGroupingProposal_normalizedSourceLabel_idx" ON "SiteResourceGroupingProposal"("normalizedSourceLabel");
CREATE INDEX IF NOT EXISTS "SiteResourceGroupingProposal_sourceWorkItemId_idx" ON "SiteResourceGroupingProposal"("sourceWorkItemId");

CREATE TABLE IF NOT EXISTS "WorkItemSiteResource" (
    "id" TEXT NOT NULL,
    "workItemId" TEXT NOT NULL,
    "siteResourceId" TEXT NOT NULL,
    "linkRole" "SiteResourceLinkRole" NOT NULL DEFAULT 'fourniture',
    "extractedFrom" "SiteResourceExtractedFrom" NOT NULL DEFAULT 'includedItems',
    "sourceSnippet" TEXT,
    "extractionRunId" TEXT,
    "confidenceScore" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WorkItemSiteResource_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "WorkItemSiteResource_workItemId_fkey" FOREIGN KEY ("workItemId") REFERENCES "WorkItem"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkItemSiteResource_siteResourceId_fkey" FOREIGN KEY ("siteResourceId") REFERENCES "SiteResource"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkItemSiteResource_extractionRunId_fkey" FOREIGN KEY ("extractionRunId") REFERENCES "SiteResourceExtractionRun"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "WorkItemSiteResource_workItemId_siteResourceId_extractedFrom_sourceSnippet_key"
  ON "WorkItemSiteResource"("workItemId", "siteResourceId", "extractedFrom", "sourceSnippet");

CREATE INDEX IF NOT EXISTS "WorkItemSiteResource_workItemId_idx" ON "WorkItemSiteResource"("workItemId");
CREATE INDEX IF NOT EXISTS "WorkItemSiteResource_siteResourceId_idx" ON "WorkItemSiteResource"("siteResourceId");
CREATE INDEX IF NOT EXISTS "WorkItemSiteResource_extractionRunId_idx" ON "WorkItemSiteResource"("extractionRunId");
