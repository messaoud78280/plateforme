-- Nettoyage bibliothèque ouvrages : jobs batch + propositions de reclassement
-- À exécuter manuellement sur Supabase (SQL Editor ou psql).

CREATE TYPE "LibraryCleanupJobType" AS ENUM (
  'classification_preview',
  'classification_apply',
  'duplicate_detection',
  'duplicate_merge',
  'recodification_preview',
  'recodification_apply',
  'normalize_designations'
);

CREATE TYPE "LibraryCleanupJobStatus" AS ENUM (
  'pending',
  'running',
  'completed',
  'failed',
  'cancelled'
);

CREATE TYPE "WorkItemClassificationConfidence" AS ENUM (
  'haute',
  'moyenne',
  'faible'
);

CREATE TYPE "WorkItemClassificationProposalStatus" AS ENUM (
  'pending',
  'approved',
  'rejected',
  'ignored'
);

CREATE TABLE "LibraryCleanupJob" (
  "id" TEXT NOT NULL,
  "jobType" "LibraryCleanupJobType" NOT NULL,
  "status" "LibraryCleanupJobStatus" NOT NULL DEFAULT 'pending',
  "dryRun" BOOLEAN NOT NULL DEFAULT true,
  "batchSize" INTEGER NOT NULL DEFAULT 50,
  "processedCount" INTEGER NOT NULL DEFAULT 0,
  "successCount" INTEGER NOT NULL DEFAULT 0,
  "errorCount" INTEGER NOT NULL DEFAULT 0,
  "lastProcessedId" TEXT,
  "cursorMeta" JSONB,
  "logs" JSONB,
  "errorMessage" TEXT,
  "startedAt" TIMESTAMP(3),
  "finishedAt" TIMESTAMP(3),
  "createdByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LibraryCleanupJob_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WorkItemClassificationProposal" (
  "id" TEXT NOT NULL,
  "workItemId" TEXT NOT NULL,
  "jobId" TEXT,
  "currentFamilyCode" TEXT,
  "currentLot" TEXT,
  "proposedFamilyCode" TEXT NOT NULL,
  "proposedLot" TEXT,
  "proposedFamily" TEXT,
  "confidence" "WorkItemClassificationConfidence" NOT NULL,
  "matchReason" TEXT NOT NULL,
  "status" "WorkItemClassificationProposalStatus" NOT NULL DEFAULT 'pending',
  "reviewedAt" TIMESTAMP(3),
  "reviewNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WorkItemClassificationProposal_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "WorkItemClassificationProposal_workItemId_fkey"
    FOREIGN KEY ("workItemId") REFERENCES "WorkItem"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "WorkItemClassificationProposal_jobId_fkey"
    FOREIGN KEY ("jobId") REFERENCES "LibraryCleanupJob"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "LibraryCleanupJob_jobType_idx" ON "LibraryCleanupJob"("jobType");
CREATE INDEX "LibraryCleanupJob_status_idx" ON "LibraryCleanupJob"("status");
CREATE INDEX "LibraryCleanupJob_createdAt_idx" ON "LibraryCleanupJob"("createdAt");

CREATE INDEX "WorkItemClassificationProposal_workItemId_idx" ON "WorkItemClassificationProposal"("workItemId");
CREATE INDEX "WorkItemClassificationProposal_jobId_idx" ON "WorkItemClassificationProposal"("jobId");
CREATE INDEX "WorkItemClassificationProposal_status_idx" ON "WorkItemClassificationProposal"("status");
CREATE INDEX "WorkItemClassificationProposal_confidence_idx" ON "WorkItemClassificationProposal"("confidence");
CREATE INDEX "WorkItemClassificationProposal_proposedFamilyCode_idx" ON "WorkItemClassificationProposal"("proposedFamilyCode");

ALTER TABLE "LibraryCleanupJob" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WorkItemClassificationProposal" ENABLE ROW LEVEL SECURITY;
