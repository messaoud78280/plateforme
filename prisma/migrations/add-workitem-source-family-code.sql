-- BeWork Devis : traçabilité import (source) + code famille pour codification BW-XXX-NNN
ALTER TABLE "WorkItem" ADD COLUMN IF NOT EXISTS "sourceCode" TEXT;
ALTER TABLE "WorkItem" ADD COLUMN IF NOT EXISTS "sourceLine" TEXT;
ALTER TABLE "WorkItem" ADD COLUMN IF NOT EXISTS "familyCode" TEXT;

CREATE INDEX IF NOT EXISTS "WorkItem_familyCode_idx" ON "WorkItem"("familyCode");
