-- Fiches de suivi BeWork (post-it numérique) + lien agenda + config alertes

CREATE TYPE "FollowUpSheetStatus" AS ENUM (
  'NOUVEAU',
  'A_ANALYSER',
  'A_PLANIFIER',
  'PLANIFIE',
  'COMMANDE_FOURNISSEUR',
  'COMMANDE_PASSEE',
  'ATTENTE_FOURNISSEUR',
  'INTERVENTION_PREVUE',
  'EN_COURS',
  'TRAVAUX_TERMINES',
  'CR_A_RECUPERER',
  'AVENANT',
  'A_FACTURER',
  'FACTURE',
  'ATTENTE_REGLEMENT',
  'TERMINE',
  'ARCHIVE'
);

CREATE TYPE "FollowUpUrgency" AS ENUM (
  'NORMAL',
  'A_SURVEILLER',
  'IMPORTANT',
  'URGENT',
  'CRITIQUE'
);

CREATE TABLE IF NOT EXISTS "FollowUpSheet" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT,
  "ownerUserId" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "assigneeId" TEXT,
  "projectId" TEXT,
  "reference" TEXT,
  "clientName" TEXT,
  "marketLabel" TEXT,
  "siteAddress" TEXT,
  "title" TEXT NOT NULL,
  "workObject" TEXT,
  "orderNumber" TEXT,
  "osNumber" TEXT,
  "receivedAt" TIMESTAMP(3),
  "amountHt" DECIMAL(14, 2),
  "status" "FollowUpSheetStatus" NOT NULL DEFAULT 'NOUVEAU',
  "colorKey" TEXT NOT NULL DEFAULT 'bleu',
  "nextAction" TEXT,
  "nextActionAt" TIMESTAMP(3),
  "nextActionDone" BOOLEAN NOT NULL DEFAULT false,
  "urgencyOverride" "FollowUpUrgency",
  "notes" TEXT,
  "reminderOffsets" JSONB,
  "postponedFromAt" TIMESTAMP(3),
  "postponeCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FollowUpSheet_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "FollowUpSheet_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "FollowUpSheet_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "FollowUpSheet_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "FollowUpSheet_ownerUserId_status_idx" ON "FollowUpSheet"("ownerUserId", "status");
CREATE INDEX IF NOT EXISTS "FollowUpSheet_assigneeId_nextActionAt_idx" ON "FollowUpSheet"("assigneeId", "nextActionAt");
CREATE INDEX IF NOT EXISTS "FollowUpSheet_projectId_idx" ON "FollowUpSheet"("projectId");
CREATE INDEX IF NOT EXISTS "FollowUpSheet_organizationId_status_idx" ON "FollowUpSheet"("organizationId", "status");
CREATE INDEX IF NOT EXISTS "FollowUpSheet_nextActionAt_idx" ON "FollowUpSheet"("nextActionAt");

CREATE TABLE IF NOT EXISTS "FollowUpTimelineEvent" (
  "id" TEXT PRIMARY KEY,
  "sheetId" TEXT NOT NULL,
  "authorId" TEXT,
  "kind" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "detail" TEXT,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FollowUpTimelineEvent_sheetId_fkey" FOREIGN KEY ("sheetId") REFERENCES "FollowUpSheet"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "FollowUpTimelineEvent_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "FollowUpTimelineEvent_sheetId_occurredAt_idx" ON "FollowUpTimelineEvent"("sheetId", "occurredAt");

CREATE TABLE IF NOT EXISTS "FollowUpAlertSettings" (
  "id" TEXT PRIMARY KEY,
  "ownerUserId" TEXT NOT NULL UNIQUE,
  "thresholdsJson" JSONB,
  "rulesJson" JSONB,
  "escalateJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FollowUpAlertSettings_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

ALTER TABLE "AgendaEvent" ADD COLUMN IF NOT EXISTS "followUpSheetId" TEXT;
DO $$ BEGIN
  ALTER TABLE "AgendaEvent"
    ADD CONSTRAINT "AgendaEvent_followUpSheetId_fkey"
    FOREIGN KEY ("followUpSheetId") REFERENCES "FollowUpSheet"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
CREATE INDEX IF NOT EXISTS "AgendaEvent_followUpSheetId_startAt_idx" ON "AgendaEvent"("followUpSheetId", "startAt");
