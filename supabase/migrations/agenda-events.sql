-- Agenda BeWork : événements + participants
-- À appliquer sur Postgres (Supabase) si `prisma db push` échoue en local.

CREATE TYPE "AgendaEventType" AS ENUM (
  'REUNION_CHANTIER',
  'VISITE_CHANTIER',
  'RDV_CLIENT',
  'RDV_FOURNISSEUR',
  'LIVRAISON',
  'INTERVENTION',
  'ECHEANCE',
  'ADMINISTRATIF',
  'COMMANDE',
  'FACTURATION',
  'SITUATION',
  'RECEPTION',
  'LEVEE_RESERVES',
  'CONTROLE',
  'FORMATION',
  'CONGE',
  'INTERNE',
  'AUTRE'
);

CREATE TYPE "AgendaEventStatus" AS ENUM (
  'PLANIFIE',
  'CONFIRME',
  'TERMINE',
  'ANNULE'
);

CREATE TYPE "AgendaAttendeeStatus" AS ENUM (
  'INVITE',
  'ACCEPTE',
  'REFUSE',
  'EN_ATTENTE'
);

CREATE TABLE IF NOT EXISTS "AgendaEvent" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT,
  "ownerUserId" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "location" TEXT,
  "type" "AgendaEventType" NOT NULL DEFAULT 'AUTRE',
  "status" "AgendaEventStatus" NOT NULL DEFAULT 'PLANIFIE',
  "startAt" TIMESTAMP(3) NOT NULL,
  "endAt" TIMESTAMP(3) NOT NULL,
  "allDay" BOOLEAN NOT NULL DEFAULT false,
  "projectId" TEXT,
  "appointmentId" TEXT UNIQUE,
  "responsibleId" TEXT,
  "reminderMinutes" INTEGER,
  "recurrence" TEXT,
  "recurrenceRule" TEXT,
  "colorKey" TEXT,
  "externalUid" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AgendaEvent_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AgendaEvent_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AgendaEvent_responsibleId_fkey" FOREIGN KEY ("responsibleId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "AgendaEvent_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "AgendaEvent_ownerUserId_startAt_idx" ON "AgendaEvent"("ownerUserId", "startAt");
CREATE INDEX IF NOT EXISTS "AgendaEvent_organizationId_startAt_idx" ON "AgendaEvent"("organizationId", "startAt");
CREATE INDEX IF NOT EXISTS "AgendaEvent_projectId_startAt_idx" ON "AgendaEvent"("projectId", "startAt");
CREATE INDEX IF NOT EXISTS "AgendaEvent_type_startAt_idx" ON "AgendaEvent"("type", "startAt");

CREATE TABLE IF NOT EXISTS "AgendaEventAttendee" (
  "id" TEXT PRIMARY KEY,
  "eventId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "status" "AgendaAttendeeStatus" NOT NULL DEFAULT 'EN_ATTENTE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AgendaEventAttendee_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "AgendaEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AgendaEventAttendee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "AgendaEventAttendee_eventId_userId_key" ON "AgendaEventAttendee"("eventId", "userId");
CREATE INDEX IF NOT EXISTS "AgendaEventAttendee_userId_idx" ON "AgendaEventAttendee"("userId");
