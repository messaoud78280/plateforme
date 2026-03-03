-- Exécuter dans Supabase SQL Editor pour ajouter les tables Appointment et AppointmentAttachment
-- Après: npx prisma generate
-- Note : CREATE TYPE ne supporte pas IF NOT EXISTS en PostgreSQL, on utilise un bloc DO

DO $$ BEGIN
  CREATE TYPE "AppointmentStatus" AS ENUM ('CONFIRME', 'ANNULE', 'TERMINE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "Appointment" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "startAt" TIMESTAMP(3) NOT NULL,
  "endAt" TIMESTAMP(3) NOT NULL,
  "organizerId" TEXT NOT NULL,
  "clientId" TEXT,
  "clientEmail" TEXT,
  "clientName" TEXT,
  "projectId" TEXT,
  "notes" TEXT,
  "comments" JSONB,
  "recurrence" TEXT,
  "recurrenceEndAt" TIMESTAMP(3),
  "reminderSentAt" TIMESTAMP(3),
  "status" "AppointmentStatus" NOT NULL DEFAULT 'CONFIRME',
  "contactRequestId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Appointment_contactRequestId_key" UNIQUE ("contactRequestId")
);

CREATE TABLE IF NOT EXISTS "AppointmentAttachment" (
  "id" TEXT NOT NULL,
  "appointmentId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "fileUrl" TEXT NOT NULL,
  "fileSize" INTEGER NOT NULL,
  "mimeType" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AppointmentAttachment_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "AppointmentAttachment" ADD CONSTRAINT "AppointmentAttachment_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "Appointment_organizerId_idx" ON "Appointment"("organizerId");
CREATE INDEX IF NOT EXISTS "Appointment_clientId_idx" ON "Appointment"("clientId");
CREATE INDEX IF NOT EXISTS "Appointment_startAt_idx" ON "Appointment"("startAt");
