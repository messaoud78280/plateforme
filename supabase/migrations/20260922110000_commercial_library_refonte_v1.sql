-- Refonte bibliothèque commerciale — colonnes & tables additives (non destructif)
-- Mirror of applied remote migration commercial_library_refonte_v1

ALTER TABLE "CommercialWorkItem"
  ADD COLUMN IF NOT EXISTS "shortDescription" TEXT,
  ADD COLUMN IF NOT EXISTS "costKnown" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "parentWorkItemId" TEXT,
  ADD COLUMN IF NOT EXISTS "variantKind" TEXT,
  ADD COLUMN IF NOT EXISTS "technicalAttributes" JSONB,
  ADD COLUMN IF NOT EXISTS "internalNotes" TEXT,
  ADD COLUMN IF NOT EXISTS "implementationTips" TEXT,
  ADD COLUMN IF NOT EXISTS "vigilancePoints" TEXT;

CREATE INDEX IF NOT EXISTS "CommercialWorkItem_organizationId_parentWorkItemId_idx"
  ON "CommercialWorkItem"("organizationId", "parentWorkItemId");
CREATE INDEX IF NOT EXISTS "CommercialWorkItem_organizationId_updatedAt_idx"
  ON "CommercialWorkItem"("organizationId", "updatedAt");
CREATE INDEX IF NOT EXISTS "CommercialWorkItem_parentWorkItemId_idx"
  ON "CommercialWorkItem"("parentWorkItemId");
