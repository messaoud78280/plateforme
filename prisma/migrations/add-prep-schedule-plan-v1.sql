-- Planification de chantier (phase 3A/3B) — additif, idempotent
-- NE PAS APPLIQUER sans accord explicite.

CREATE TABLE IF NOT EXISTS "PrepSchedulePlan" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "studyId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "quoteId" TEXT,
    "title" TEXT NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'PROFESSIONAL',
    "isDemonstration" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "revisionKind" TEXT NOT NULL DEFAULT 'INITIAL',
    "revisionNumber" INTEGER NOT NULL DEFAULT 1,
    "parentPlanId" TEXT,
    "startDate" DATE,
    "endDateBase" DATE,
    "endDateWithConditional" DATE,
    "baseDurationWorkingDays" DECIMAL(10,2),
    "withConditionalWorkingDays" DECIMAL(10,2),
    "studyVersionAtGeneration" INTEGER NOT NULL,
    "calendarJson" JSONB,
    "summaryJson" JSONB,
    "note" TEXT,
    "watermark" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PrepSchedulePlan_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PrepSchedulePlan_organizationId_idempotencyKey_key"
  ON "PrepSchedulePlan"("organizationId", "idempotencyKey");
CREATE INDEX IF NOT EXISTS "PrepSchedulePlan_studyId_createdAt_idx" ON "PrepSchedulePlan"("studyId", "createdAt");
CREATE INDEX IF NOT EXISTS "PrepSchedulePlan_projectId_idx" ON "PrepSchedulePlan"("projectId");
CREATE INDEX IF NOT EXISTS "PrepSchedulePlan_quoteId_idx" ON "PrepSchedulePlan"("quoteId");
CREATE INDEX IF NOT EXISTS "PrepSchedulePlan_organizationId_isDemonstration_idx"
  ON "PrepSchedulePlan"("organizationId", "isDemonstration");
CREATE INDEX IF NOT EXISTS "PrepSchedulePlan_parentPlanId_idx" ON "PrepSchedulePlan"("parentPlanId");

CREATE TABLE IF NOT EXISTS "PrepScheduleTask" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "stepCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "lot" TEXT,
    "description" TEXT,
    "includeInBase" BOOLEAN NOT NULL DEFAULT true,
    "holdPoint" BOOLEAN NOT NULL DEFAULT false,
    "conditional" BOOLEAN NOT NULL DEFAULT false,
    "conditionalJson" JSONB,
    "startDate" DATE,
    "endDate" DATE,
    "startHalf" INTEGER NOT NULL DEFAULT 0,
    "endHalf" INTEGER NOT NULL DEFAULT 1,
    "durationMode" TEXT NOT NULL DEFAULT 'fixed',
    "durationDays" DECIMAL(10,4) NOT NULL,
    "durationCalendar" TEXT NOT NULL DEFAULT 'working',
    "durationLockedByUser" BOOLEAN NOT NULL DEFAULT false,
    "computedDurationDays" DECIMAL(10,4),
    "driverTakeoffCode" TEXT,
    "quantitySnapshot" DECIMAL(24,10),
    "quantityUnit" TEXT,
    "rateId" TEXT,
    "rateValue" DECIMAL(14,4),
    "rateUnit" TEXT,
    "ratePer" TEXT,
    "parallelUnits" INTEGER NOT NULL DEFAULT 1,
    "takeoffCodesJson" JSONB,
    "crewJson" JSONB,
    "equipmentJson" JSONB,
    "suppliesJson" JSONB,
    "preconditionsJson" JSONB,
    "controlsJson" JSONB,
    "constraintsJson" JSONB,
    "safetyJson" JSONB,
    "proofsJson" JSONB,
    "dependsOnJson" JSONB,
    "blockingReason" TEXT,
    "sellHtSnapshot" DECIMAL(14,4),
    "costHtSnapshot" DECIMAL(14,4),
    "laborCostHtSnapshot" DECIMAL(14,4),
    "materialsCostHtSnapshot" DECIMAL(14,4),
    "equipmentCostHtSnapshot" DECIMAL(14,4),
    "subcontractCostHtSnapshot" DECIMAL(14,4),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PrepScheduleTask_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PrepScheduleTask_planId_stepCode_key" ON "PrepScheduleTask"("planId", "stepCode");
CREATE INDEX IF NOT EXISTS "PrepScheduleTask_organizationId_planId_idx" ON "PrepScheduleTask"("organizationId", "planId");
CREATE INDEX IF NOT EXISTS "PrepScheduleTask_planId_sortOrder_idx" ON "PrepScheduleTask"("planId", "sortOrder");

CREATE TABLE IF NOT EXISTS "PrepScheduleDependency" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "predecessorId" TEXT NOT NULL,
    "successorId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'FS',
    "lagDays" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "lagCalendar" TEXT NOT NULL DEFAULT 'working',
    CONSTRAINT "PrepScheduleDependency_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PrepScheduleDependency_successorId_predecessorId_type_key"
  ON "PrepScheduleDependency"("successorId", "predecessorId", "type");
CREATE INDEX IF NOT EXISTS "PrepScheduleDependency_planId_idx" ON "PrepScheduleDependency"("planId");
CREATE INDEX IF NOT EXISTS "PrepScheduleDependency_organizationId_idx" ON "PrepScheduleDependency"("organizationId");

CREATE TABLE IF NOT EXISTS "PrepScheduleTakeoffLink" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "studyLineCode" TEXT NOT NULL,
    "role" TEXT,
    CONSTRAINT "PrepScheduleTakeoffLink_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PrepScheduleTakeoffLink_taskId_studyLineCode_key"
  ON "PrepScheduleTakeoffLink"("taskId", "studyLineCode");
CREATE INDEX IF NOT EXISTS "PrepScheduleTakeoffLink_planId_idx" ON "PrepScheduleTakeoffLink"("planId");
CREATE INDEX IF NOT EXISTS "PrepScheduleTakeoffLink_organizationId_planId_idx"
  ON "PrepScheduleTakeoffLink"("organizationId", "planId");

CREATE TABLE IF NOT EXISTS "PrepScheduleQuoteLink" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "quoteLineId" TEXT NOT NULL,
    "studyLineCode" TEXT,
    "sellHt" DECIMAL(14,4),
    "costHt" DECIMAL(14,4),
    CONSTRAINT "PrepScheduleQuoteLink_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PrepScheduleQuoteLink_taskId_quoteLineId_key"
  ON "PrepScheduleQuoteLink"("taskId", "quoteLineId");
CREATE INDEX IF NOT EXISTS "PrepScheduleQuoteLink_planId_idx" ON "PrepScheduleQuoteLink"("planId");
CREATE INDEX IF NOT EXISTS "PrepScheduleQuoteLink_quoteId_idx" ON "PrepScheduleQuoteLink"("quoteId");
CREATE INDEX IF NOT EXISTS "PrepScheduleQuoteLink_organizationId_idx" ON "PrepScheduleQuoteLink"("organizationId");

CREATE TABLE IF NOT EXISTS "PrepScheduleEvent" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "detailJson" JSONB,
    "actorUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PrepScheduleEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PrepScheduleEvent_planId_createdAt_idx" ON "PrepScheduleEvent"("planId", "createdAt");
CREATE INDEX IF NOT EXISTS "PrepScheduleEvent_organizationId_idx" ON "PrepScheduleEvent"("organizationId");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PrepSchedulePlan_organizationId_fkey') THEN
    ALTER TABLE "PrepSchedulePlan" ADD CONSTRAINT "PrepSchedulePlan_organizationId_fkey"
      FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PrepSchedulePlan_studyId_fkey') THEN
    ALTER TABLE "PrepSchedulePlan" ADD CONSTRAINT "PrepSchedulePlan_studyId_fkey"
      FOREIGN KEY ("studyId") REFERENCES "PrepStudy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PrepSchedulePlan_projectId_fkey') THEN
    ALTER TABLE "PrepSchedulePlan" ADD CONSTRAINT "PrepSchedulePlan_projectId_fkey"
      FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PrepSchedulePlan_quoteId_fkey') THEN
    ALTER TABLE "PrepSchedulePlan" ADD CONSTRAINT "PrepSchedulePlan_quoteId_fkey"
      FOREIGN KEY ("quoteId") REFERENCES "CommercialQuote"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PrepSchedulePlan_parentPlanId_fkey') THEN
    ALTER TABLE "PrepSchedulePlan" ADD CONSTRAINT "PrepSchedulePlan_parentPlanId_fkey"
      FOREIGN KEY ("parentPlanId") REFERENCES "PrepSchedulePlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PrepScheduleTask_planId_fkey') THEN
    ALTER TABLE "PrepScheduleTask" ADD CONSTRAINT "PrepScheduleTask_planId_fkey"
      FOREIGN KEY ("planId") REFERENCES "PrepSchedulePlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PrepScheduleDependency_predecessorId_fkey') THEN
    ALTER TABLE "PrepScheduleDependency" ADD CONSTRAINT "PrepScheduleDependency_predecessorId_fkey"
      FOREIGN KEY ("predecessorId") REFERENCES "PrepScheduleTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PrepScheduleDependency_successorId_fkey') THEN
    ALTER TABLE "PrepScheduleDependency" ADD CONSTRAINT "PrepScheduleDependency_successorId_fkey"
      FOREIGN KEY ("successorId") REFERENCES "PrepScheduleTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PrepScheduleTakeoffLink_taskId_fkey') THEN
    ALTER TABLE "PrepScheduleTakeoffLink" ADD CONSTRAINT "PrepScheduleTakeoffLink_taskId_fkey"
      FOREIGN KEY ("taskId") REFERENCES "PrepScheduleTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PrepScheduleQuoteLink_taskId_fkey') THEN
    ALTER TABLE "PrepScheduleQuoteLink" ADD CONSTRAINT "PrepScheduleQuoteLink_taskId_fkey"
      FOREIGN KEY ("taskId") REFERENCES "PrepScheduleTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PrepScheduleEvent_planId_fkey') THEN
    ALTER TABLE "PrepScheduleEvent" ADD CONSTRAINT "PrepScheduleEvent_planId_fkey"
      FOREIGN KEY ("planId") REFERENCES "PrepSchedulePlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

ALTER TABLE "PrepSchedulePlan" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PrepScheduleTask" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PrepScheduleDependency" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PrepScheduleTakeoffLink" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PrepScheduleQuoteLink" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PrepScheduleEvent" ENABLE ROW LEVEL SECURITY;
