-- Créer les tables manuellement dans Supabase (si db push échoue)
-- À exécuter dans : Supabase → SQL Editor → New query → Coller ce script → Run

CREATE TYPE "UserRole" AS ENUM ('CLIENT', 'AGENCE');
CREATE TYPE "ProjectStatus" AS ENUM ('NOUVEAU', 'EN_COURS', 'EN_ATTENTE', 'TERMINE');

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "password" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "role" "UserRole" NOT NULL DEFAULT 'CLIENT',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

CREATE TABLE "Project" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "status" "ProjectStatus" NOT NULL DEFAULT 'EN_COURS',
  "clientId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Project" ADD CONSTRAINT "Project_clientId_fkey" 
  FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "Message" (
  "id" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "senderId" TEXT NOT NULL,
  "receiverId" TEXT NOT NULL,
  "read" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Message" ADD CONSTRAINT "Message_projectId_fkey" 
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" 
  FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Message" ADD CONSTRAINT "Message_receiverId_fkey" 
  FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Demandes de contact / RDV (formulaire public)
CREATE TYPE "ContactRequestStatus" AS ENUM ('NOUVEAU', 'CONFIRME', 'ANNULE');
CREATE TABLE "ContactRequest" (
  "id" TEXT NOT NULL,
  "structure" TEXT NOT NULL,
  "denominationSociale" TEXT,
  "contactName" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT,
  "formule" TEXT,
  "message" TEXT,
  "rdvDate" DATE,
  "rdvTime" TEXT,
  "sector" TEXT,
  "howKnown" TEXT,
  "status" "ContactRequestStatus" NOT NULL DEFAULT 'NOUVEAU',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ContactRequest_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ContactRequest_rdvDate_rdvTime_idx" ON "ContactRequest"("rdvDate", "rdvTime");
CREATE INDEX "ContactRequest_status_idx" ON "ContactRequest"("status");
