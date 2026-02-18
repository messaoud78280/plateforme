-- Script IDEMPOTENT : crée uniquement ce qui n'existe pas.
-- À exécuter dans Supabase → SQL Editor si vous n'êtes pas sûr de l'état de la base.
-- Peut être exécuté plusieurs fois sans erreur "already exists".

-- ========== ENUMS (ignorer si déjà existants) ==========
DO $$ BEGIN
  CREATE TYPE "UserRole" AS ENUM ('CLIENT', 'AGENCE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE "ProjectStatus" AS ENUM ('NOUVEAU', 'EN_COURS', 'EN_ATTENTE', 'TERMINE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE "DocumentCategory" AS ENUM ('FACTURE', 'CONTRAT', 'RH', 'FISCAL', 'AUTRE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE "DocumentStatus" AS ENUM ('EN_ATTENTE', 'EN_TRAITEMENT', 'TRAITE', 'ARCHIVE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE "TaskStatus" AS ENUM ('EN_COURS', 'COMPLETE', 'EN_ATTENTE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE "AlertLevel" AS ENUM ('INFO', 'WARNING', 'URGENT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ========== TABLES (IF NOT EXISTS) ==========
CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "password" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "role" "UserRole" NOT NULL DEFAULT 'CLIENT',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");

CREATE TABLE IF NOT EXISTS "Project" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "status" "ProjectStatus" NOT NULL DEFAULT 'EN_COURS',
  "clientId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);
DO $$ BEGIN
  ALTER TABLE "Project" ADD CONSTRAINT "Project_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "Message" (
  "id" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "senderId" TEXT NOT NULL,
  "receiverId" TEXT NOT NULL,
  "read" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);
DO $$ BEGIN
  ALTER TABLE "Message" ADD CONSTRAINT "Message_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey"
    FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "Message" ADD CONSTRAINT "Message_receiverId_fkey"
    FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "Document" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "category" "DocumentCategory" NOT NULL DEFAULT 'AUTRE',
  "fileUrl" TEXT NOT NULL,
  "fileSize" INTEGER NOT NULL,
  "mimeType" TEXT,
  "status" "DocumentStatus" NOT NULL DEFAULT 'EN_ATTENTE',
  "clientId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);
DO $$ BEGIN
  ALTER TABLE "Document" ADD CONSTRAINT "Document_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "Task" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "status" "TaskStatus" NOT NULL DEFAULT 'EN_COURS',
  "clientId" TEXT NOT NULL,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);
DO $$ BEGIN
  ALTER TABLE "Task" ADD CONSTRAINT "Task_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "Activity" (
  "id" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "detail" TEXT,
  "clientId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);
DO $$ BEGIN
  ALTER TABLE "Activity" ADD CONSTRAINT "Activity_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "Alert" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "level" "AlertLevel" NOT NULL DEFAULT 'INFO',
  "clientId" TEXT NOT NULL,
  "read" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);
DO $$ BEGIN
  ALTER TABLE "Alert" ADD CONSTRAINT "Alert_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
