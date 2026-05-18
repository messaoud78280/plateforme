-- Fusion doublons ouvrages (BeWork) — RÉVERSIBLE, aucune suppression de lignes
-- À exécuter manuellement sur Supabase après relecture.
-- Rollback partiel : voir section ROLLBACK en bas de fichier.

-- 1. Enums
DO $$ BEGIN
  CREATE TYPE "WorkItemMergeStatus" AS ENUM ('unique', 'canonical', 'merged');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "WorkItemMergeProposalStatus" AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Colonnes WorkItem
ALTER TABLE "WorkItem"
  ADD COLUMN IF NOT EXISTS "normalizedDesignation" TEXT,
  ADD COLUMN IF NOT EXISTS "canonicalWorkItemId" TEXT,
  ADD COLUMN IF NOT EXISTS "mergeStatus" "WorkItemMergeStatus" NOT NULL DEFAULT 'unique',
  ADD COLUMN IF NOT EXISTS "mergedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "mergeNote" TEXT;

DO $$ BEGIN
  ALTER TABLE "WorkItem"
    ADD CONSTRAINT "WorkItem_canonicalWorkItemId_fkey"
    FOREIGN KEY ("canonicalWorkItemId") REFERENCES "WorkItem"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "WorkItem_normalizedDesignation_idx" ON "WorkItem"("normalizedDesignation");
CREATE INDEX IF NOT EXISTS "WorkItem_canonicalWorkItemId_idx" ON "WorkItem"("canonicalWorkItemId");
CREATE INDEX IF NOT EXISTS "WorkItem_mergeStatus_idx" ON "WorkItem"("mergeStatus");

-- 3. Propositions de fusion
CREATE TABLE IF NOT EXISTS "WorkItemMergeProposal" (
  "id" TEXT NOT NULL,
  "status" "WorkItemMergeProposalStatus" NOT NULL DEFAULT 'pending',
  "proposedCanonicalId" TEXT,
  "canonicalDesignation" TEXT NOT NULL,
  "normalizedKey" TEXT NOT NULL,
  "similarityScore" INTEGER NOT NULL,
  "matchReasons" JSONB,
  "mergeMode" TEXT NOT NULL DEFAULT 'manual_review',
  "reviewedAt" TIMESTAMP(3),
  "reviewNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WorkItemMergeProposal_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "WorkItemMergeProposal_proposedCanonicalId_fkey"
    FOREIGN KEY ("proposedCanonicalId") REFERENCES "WorkItem"("id")
    ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "WorkItemMergeProposal_status_idx" ON "WorkItemMergeProposal"("status");
CREATE INDEX IF NOT EXISTS "WorkItemMergeProposal_normalizedKey_idx" ON "WorkItemMergeProposal"("normalizedKey");

CREATE TABLE IF NOT EXISTS "WorkItemMergeProposalMember" (
  "id" TEXT NOT NULL,
  "proposalId" TEXT NOT NULL,
  "workItemId" TEXT NOT NULL,
  "isCanonical" BOOLEAN NOT NULL DEFAULT false,
  "designation" TEXT NOT NULL,
  "similarityScore" INTEGER,
  CONSTRAINT "WorkItemMergeProposalMember_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "WorkItemMergeProposalMember_proposalId_fkey"
    FOREIGN KEY ("proposalId") REFERENCES "WorkItemMergeProposal"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "WorkItemMergeProposalMember_workItemId_fkey"
    FOREIGN KEY ("workItemId") REFERENCES "WorkItem"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "WorkItemMergeProposalMember_proposalId_workItemId_key"
    UNIQUE ("proposalId", "workItemId")
);

CREATE INDEX IF NOT EXISTS "WorkItemMergeProposalMember_workItemId_idx"
  ON "WorkItemMergeProposalMember"("workItemId");

-- ROLLBACK (manuel, si besoin) :
-- UPDATE "WorkItem" SET "mergeStatus"='unique', "canonicalWorkItemId"=NULL, "mergedAt"=NULL WHERE "mergeStatus"='merged';
-- UPDATE "WorkItem" SET "mergeStatus"='unique' WHERE "mergeStatus"='canonical';
-- DROP TABLE IF EXISTS "WorkItemMergeProposalMember";
-- DROP TABLE IF EXISTS "WorkItemMergeProposal";
-- ALTER TABLE "WorkItem" DROP COLUMN IF EXISTS "mergeNote", DROP COLUMN IF EXISTS "mergedAt", ...
