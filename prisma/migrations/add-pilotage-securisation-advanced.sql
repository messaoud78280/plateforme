
ALTER TABLE "WorksitePilotage" ADD COLUMN IF NOT EXISTS "contractRiskScore" INTEGER;
ALTER TABLE "WorksitePilotage" ADD COLUMN IF NOT EXISTS "contractRiskLabel" TEXT;
ALTER TABLE "WorksitePilotage" ADD COLUMN IF NOT EXISTS "contractRiskUpdatedAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "PilotageSensitiveDeadline" (
  "id" TEXT PRIMARY KEY,
  "pilotageId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "deadlineType" TEXT NOT NULL,
  "sourceType" TEXT NOT NULL DEFAULT 'Saisie manuelle',
  "articleRef" TEXT,
  "pageRef" TEXT,
  "startAt" DATE,
  "dueAt" DATE,
  "calculationMode" TEXT,
  "responsibleName" TEXT,
  "confirmationLevel" TEXT NOT NULL DEFAULT 'À vérifier',
  "priority" TEXT NOT NULL DEFAULT 'Haute',
  "status" TEXT NOT NULL DEFAULT 'À vérifier',
  "linkedActionId" TEXT,
  "proofNote" TEXT,
  "comment" TEXT,
  "archivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "PilotageSensitiveDeadline_pilotageId_status_idx" ON "PilotageSensitiveDeadline"("pilotageId","status");
CREATE INDEX IF NOT EXISTS "PilotageSensitiveDeadline_dueAt_idx" ON "PilotageSensitiveDeadline"("dueAt");

CREATE TABLE IF NOT EXISTS "PilotagePricingAssumption" (
  "id" TEXT PRIMARY KEY,
  "pilotageId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "category" TEXT NOT NULL DEFAULT 'Organisation',
  "lot" TEXT,
  "sourceType" TEXT NOT NULL DEFAULT 'Saisie manuelle',
  "authorName" TEXT,
  "assumedValue" TEXT,
  "justification" TEXT,
  "verificationStatus" TEXT NOT NULL DEFAULT 'Hypothèse d’étude',
  "realityObserved" TEXT,
  "gapSummary" TEXT,
  "impactCost" TEXT,
  "impactDelay" TEXT,
  "impactOrg" TEXT,
  "decision" TEXT,
  "archivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "PilotagePricingAssumption_pilotageId_verificationStatus_idx" ON "PilotagePricingAssumption"("pilotageId","verificationStatus");

CREATE TABLE IF NOT EXISTS "PilotageHandover" (
  "id" TEXT PRIMARY KEY,
  "pilotageId" TEXT NOT NULL,
  "title" TEXT NOT NULL DEFAULT 'Passation du marché',
  "status" TEXT NOT NULL DEFAULT 'À préparer',
  "meetingAt" TIMESTAMP(3),
  "meetingNotes" TEXT,
  "preparedByName" TEXT,
  "presentedToName" TEXT,
  "closedAt" TIMESTAMP(3),
  "archivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "PilotageHandover_pilotageId_status_idx" ON "PilotageHandover"("pilotageId","status");

CREATE TABLE IF NOT EXISTS "PilotageHandoverItem" (
  "id" TEXT PRIMARY KEY,
  "handoverId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "category" TEXT NOT NULL DEFAULT 'Général',
  "description" TEXT,
  "sourceType" TEXT,
  "studiesOwner" TEXT,
  "worksOwner" TEXT,
  "transmitted" BOOLEAN NOT NULL DEFAULT false,
  "includedInScope" BOOLEAN,
  "validated" BOOLEAN NOT NULL DEFAULT false,
  "comment" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "archivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "PilotageHandoverItem_handoverId_sortOrder_idx" ON "PilotageHandoverItem"("handoverId","sortOrder");

CREATE TABLE IF NOT EXISTS "PilotageTradeInterface" (
  "id" TEXT PRIMARY KEY,
  "pilotageId" TEXT NOT NULL,
  "primaryLot" TEXT NOT NULL,
  "relatedLot" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "description" TEXT,
  "zone" TEXT,
  "planRef" TEXT,
  "whoSupplies" TEXT,
  "whoInstalls" TEXT,
  "whoPrepares" TEXT,
  "whoValidates" TEXT,
  "dueAt" DATE,
  "linkedMilestone" TEXT,
  "riskLevel" TEXT NOT NULL DEFAULT 'Modéré',
  "status" TEXT NOT NULL DEFAULT 'À définir',
  "decision" TEXT,
  "proofNote" TEXT,
  "archivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "PilotageTradeInterface_pilotageId_status_idx" ON "PilotageTradeInterface"("pilotageId","status");

CREATE TABLE IF NOT EXISTS "PilotageEmbeddedElement" (
  "id" TEXT PRIMARY KEY,
  "pilotageId" TEXT NOT NULL,
  "reference" TEXT,
  "title" TEXT NOT NULL,
  "elementType" TEXT NOT NULL DEFAULT 'Réservation',
  "requestingLot" TEXT,
  "executingLot" TEXT,
  "building" TEXT,
  "level" TEXT,
  "zone" TEXT,
  "planRef" TEXT,
  "planIndice" TEXT,
  "locationNote" TEXT,
  "dueAt" DATE,
  "pourAt" DATE,
  "responsibleName" TEXT,
  "validatorName" TEXT,
  "status" TEXT NOT NULL DEFAULT 'À identifier',
  "photoUrl" TEXT,
  "proofNote" TEXT,
  "observation" TEXT,
  "impact" TEXT,
  "archivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "PilotageEmbeddedElement_pilotageId_status_idx" ON "PilotageEmbeddedElement"("pilotageId","status");
CREATE INDEX IF NOT EXISTS "PilotageEmbeddedElement_pourAt_idx" ON "PilotageEmbeddedElement"("pourAt");

CREATE TABLE IF NOT EXISTS "PilotageSensitiveWork" (
  "id" TEXT PRIMARY KEY,
  "pilotageId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "lot" TEXT,
  "zone" TEXT,
  "description" TEXT,
  "sensitivityLevel" TEXT NOT NULL DEFAULT 'Élevé',
  "risks" TEXT,
  "requiredDocs" TEXT,
  "requiredPlans" TEXT,
  "requiredVisas" TEXT,
  "requiredChecks" TEXT,
  "photosRequired" BOOLEAN NOT NULL DEFAULT true,
  "responsibleName" TEXT,
  "plannedAt" DATE,
  "actualAt" DATE,
  "status" TEXT NOT NULL DEFAULT 'À préparer',
  "proofNote" TEXT,
  "archivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "PilotageSensitiveWork_pilotageId_status_idx" ON "PilotageSensitiveWork"("pilotageId","status");

CREATE TABLE IF NOT EXISTS "PilotageNonConformity" (
  "id" TEXT PRIMARY KEY,
  "pilotageId" TEXT NOT NULL,
  "reference" TEXT,
  "lot" TEXT,
  "zone" TEXT,
  "description" TEXT NOT NULL,
  "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "detectedByName" TEXT,
  "origin" TEXT,
  "severity" TEXT NOT NULL DEFAULT 'Important',
  "rootCause" TEXT,
  "correctiveAction" TEXT,
  "responsibleName" TEXT,
  "dueAt" DATE,
  "proofCorrection" TEXT,
  "controllerName" TEXT,
  "controlledAt" TIMESTAMP(3),
  "decision" TEXT,
  "status" TEXT NOT NULL DEFAULT 'Détectée',
  "impactCost" TEXT,
  "impactDelay" TEXT,
  "photoUrl" TEXT,
  "archivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "PilotageNonConformity_pilotageId_status_idx" ON "PilotageNonConformity"("pilotageId","status");
CREATE INDEX IF NOT EXISTS "PilotageNonConformity_severity_idx" ON "PilotageNonConformity"("severity");

CREATE TABLE IF NOT EXISTS "PilotageDelayEvent" (
  "id" TEXT PRIMARY KEY,
  "pilotageId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "startedAt" DATE,
  "endedAt" DATE,
  "durationDaysEst" INTEGER,
  "durationDaysActual" INTEGER,
  "causeCategory" TEXT NOT NULL DEFAULT 'À analyser',
  "presumedOrigin" TEXT,
  "impactedMilestone" TEXT,
  "impactedTask" TEXT,
  "proofNote" TEXT,
  "letterSent" BOOLEAN NOT NULL DEFAULT false,
  "measureTaken" TEXT,
  "impactCost" TEXT,
  "impactDelay" TEXT,
  "confirmationLevel" TEXT NOT NULL DEFAULT 'À vérifier',
  "status" TEXT NOT NULL DEFAULT 'Identifié',
  "archivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "PilotageDelayEvent_pilotageId_status_idx" ON "PilotageDelayEvent"("pilotageId","status");

CREATE TABLE IF NOT EXISTS "PilotageMeeting" (
  "id" TEXT PRIMARY KEY,
  "pilotageId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "meetingType" TEXT NOT NULL DEFAULT 'Réunion de chantier',
  "scheduledAt" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'À préparer',
  "participants" TEXT,
  "agendaJson" JSONB,
  "decisionsJson" JSONB,
  "notes" TEXT,
  "archivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "PilotageMeeting_pilotageId_status_idx" ON "PilotageMeeting"("pilotageId","status");

CREATE TABLE IF NOT EXISTS "PilotagePhoto" (
  "id" TEXT PRIMARY KEY,
  "pilotageId" TEXT NOT NULL,
  "title" TEXT,
  "category" TEXT NOT NULL DEFAULT 'Pendant travaux',
  "caption" TEXT,
  "fileUrl" TEXT NOT NULL,
  "lot" TEXT,
  "zone" TEXT,
  "building" TEXT,
  "level" TEXT,
  "linkedType" TEXT,
  "linkedId" TEXT,
  "authorName" TEXT,
  "takenAt" TIMESTAMP(3),
  "visibility" TEXT NOT NULL DEFAULT 'Interne entreprise cliente',
  "archivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "PilotagePhoto_pilotageId_category_idx" ON "PilotagePhoto"("pilotageId","category");

CREATE TABLE IF NOT EXISTS "PilotageLesson" (
  "id" TEXT PRIMARY KEY,
  "pilotageId" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "lot" TEXT,
  "worksiteType" TEXT,
  "cause" TEXT,
  "consequence" TEXT,
  "solution" TEXT,
  "effectiveness" TEXT,
  "recommendation" TEXT,
  "validationStatus" TEXT NOT NULL DEFAULT 'Brouillon',
  "approvedByName" TEXT,
  "approvedAt" TIMESTAMP(3),
  "enrichModels" BOOLEAN NOT NULL DEFAULT false,
  "archivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "PilotageLesson_pilotageId_idx" ON "PilotageLesson"("pilotageId");
CREATE INDEX IF NOT EXISTS "PilotageLesson_validationStatus_idx" ON "PilotageLesson"("validationStatus");

CREATE TABLE IF NOT EXISTS "PilotageTimelineEvent" (
  "id" TEXT PRIMARY KEY,
  "pilotageId" TEXT NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "eventType" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "actorInternal" TEXT,
  "actorExternal" TEXT,
  "linkedType" TEXT,
  "linkedId" TEXT,
  "linkedLabel" TEXT,
  "confirmationLevel" TEXT NOT NULL DEFAULT 'À vérifier',
  "visibility" TEXT NOT NULL DEFAULT 'Interne BeWork',
  "proofNote" TEXT,
  "archivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "PilotageTimelineEvent_pilotageId_occurredAt_idx" ON "PilotageTimelineEvent"("pilotageId","occurredAt");
CREATE INDEX IF NOT EXISTS "PilotageTimelineEvent_eventType_idx" ON "PilotageTimelineEvent"("eventType");

DO $$ BEGIN
  ALTER TABLE "PilotageSensitiveDeadline" ADD CONSTRAINT "PilotageSensitiveDeadline_pilotageId_fkey"
    FOREIGN KEY ("pilotageId") REFERENCES "WorksitePilotage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "PilotagePricingAssumption" ADD CONSTRAINT "PilotagePricingAssumption_pilotageId_fkey"
    FOREIGN KEY ("pilotageId") REFERENCES "WorksitePilotage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "PilotageHandover" ADD CONSTRAINT "PilotageHandover_pilotageId_fkey"
    FOREIGN KEY ("pilotageId") REFERENCES "WorksitePilotage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "PilotageHandoverItem" ADD CONSTRAINT "PilotageHandoverItem_handoverId_fkey"
    FOREIGN KEY ("handoverId") REFERENCES "PilotageHandover"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "PilotageTradeInterface" ADD CONSTRAINT "PilotageTradeInterface_pilotageId_fkey"
    FOREIGN KEY ("pilotageId") REFERENCES "WorksitePilotage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "PilotageEmbeddedElement" ADD CONSTRAINT "PilotageEmbeddedElement_pilotageId_fkey"
    FOREIGN KEY ("pilotageId") REFERENCES "WorksitePilotage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "PilotageSensitiveWork" ADD CONSTRAINT "PilotageSensitiveWork_pilotageId_fkey"
    FOREIGN KEY ("pilotageId") REFERENCES "WorksitePilotage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "PilotageNonConformity" ADD CONSTRAINT "PilotageNonConformity_pilotageId_fkey"
    FOREIGN KEY ("pilotageId") REFERENCES "WorksitePilotage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "PilotageDelayEvent" ADD CONSTRAINT "PilotageDelayEvent_pilotageId_fkey"
    FOREIGN KEY ("pilotageId") REFERENCES "WorksitePilotage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "PilotageMeeting" ADD CONSTRAINT "PilotageMeeting_pilotageId_fkey"
    FOREIGN KEY ("pilotageId") REFERENCES "WorksitePilotage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "PilotagePhoto" ADD CONSTRAINT "PilotagePhoto_pilotageId_fkey"
    FOREIGN KEY ("pilotageId") REFERENCES "WorksitePilotage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "PilotageLesson" ADD CONSTRAINT "PilotageLesson_pilotageId_fkey"
    FOREIGN KEY ("pilotageId") REFERENCES "WorksitePilotage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "PilotageTimelineEvent" ADD CONSTRAINT "PilotageTimelineEvent_pilotageId_fkey"
    FOREIGN KEY ("pilotageId") REFERENCES "WorksitePilotage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
