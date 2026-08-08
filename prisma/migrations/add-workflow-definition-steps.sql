-- Workflow configurable (Phase W1) — additive only, no data loss.
-- statusKey = FollowUpSheetStatus existant (pas de nouvel enum).

CREATE TABLE IF NOT EXISTS "WorkflowDefinition" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "templateKey" TEXT,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WorkflowDefinition_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "WorkflowStep" (
  "id" TEXT NOT NULL,
  "workflowId" TEXT NOT NULL,
  "statusKey" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "description" TEXT,
  "colorKey" TEXT NOT NULL DEFAULT 'jaune',
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "visibleOnBoard" BOOLEAN NOT NULL DEFAULT true,
  "defaultRole" TEXT,
  "defaultAssigneeId" TEXT,
  "delayHours" INTEGER,
  "reminderHours" INTEGER,
  "alertOrangeHours" INTEGER,
  "alertRedHours" INTEGER,
  "escalateHours" INTEGER,
  "nextActionLabel" TEXT,
  "nextActionDelayHours" INTEGER,
  "initialUrgency" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WorkflowStep_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "FollowUpSheet" ADD COLUMN IF NOT EXISTS "workflowId" TEXT;

CREATE INDEX IF NOT EXISTS "WorkflowDefinition_organizationId_isDefault_idx"
  ON "WorkflowDefinition"("organizationId", "isDefault");
CREATE INDEX IF NOT EXISTS "WorkflowDefinition_organizationId_templateKey_idx"
  ON "WorkflowDefinition"("organizationId", "templateKey");
CREATE INDEX IF NOT EXISTS "WorkflowStep_workflowId_sortOrder_idx"
  ON "WorkflowStep"("workflowId", "sortOrder");
CREATE UNIQUE INDEX IF NOT EXISTS "WorkflowStep_workflowId_statusKey_key"
  ON "WorkflowStep"("workflowId", "statusKey");
CREATE INDEX IF NOT EXISTS "FollowUpSheet_workflowId_idx"
  ON "FollowUpSheet"("workflowId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'WorkflowDefinition_organizationId_fkey'
  ) THEN
    ALTER TABLE "WorkflowDefinition"
      ADD CONSTRAINT "WorkflowDefinition_organizationId_fkey"
      FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'WorkflowStep_workflowId_fkey'
  ) THEN
    ALTER TABLE "WorkflowStep"
      ADD CONSTRAINT "WorkflowStep_workflowId_fkey"
      FOREIGN KEY ("workflowId") REFERENCES "WorkflowDefinition"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'FollowUpSheet_workflowId_fkey'
  ) THEN
    ALTER TABLE "FollowUpSheet"
      ADD CONSTRAINT "FollowUpSheet_workflowId_fkey"
      FOREIGN KEY ("workflowId") REFERENCES "WorkflowDefinition"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
