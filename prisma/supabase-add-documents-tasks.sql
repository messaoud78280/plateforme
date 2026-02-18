-- À exécuter dans Supabase SQL Editor si vous aviez déjà les tables User, Project, Message
-- Ajoute les tables Document, Task, Activity, Alert

CREATE TYPE "DocumentCategory" AS ENUM ('FACTURE', 'CONTRAT', 'RH', 'FISCAL', 'AUTRE');
CREATE TYPE "DocumentStatus" AS ENUM ('EN_ATTENTE', 'EN_TRAITEMENT', 'TRAITE', 'ARCHIVE');
CREATE TYPE "TaskStatus" AS ENUM ('EN_COURS', 'COMPLETE', 'EN_ATTENTE');
CREATE TYPE "AlertLevel" AS ENUM ('INFO', 'WARNING', 'URGENT');

CREATE TABLE "Document" (
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

ALTER TABLE "Document" ADD CONSTRAINT "Document_clientId_fkey"
  FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "Task" (
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

ALTER TABLE "Task" ADD CONSTRAINT "Task_clientId_fkey"
  FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "Activity" (
  "id" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "detail" TEXT,
  "clientId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Activity" ADD CONSTRAINT "Activity_clientId_fkey"
  FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "Alert" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "level" "AlertLevel" NOT NULL DEFAULT 'INFO',
  "clientId" TEXT NOT NULL,
  "read" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Alert" ADD CONSTRAINT "Alert_clientId_fkey"
  FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
