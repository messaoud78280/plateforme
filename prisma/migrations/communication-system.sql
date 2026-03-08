-- Système de communication BeWork : TaskMessage, Notification, statuts tâche, notes internes
-- À exécuter dans Supabase → SQL Editor après le schéma existant

-- 1. Nouveaux statuts de tâche (PostgreSQL : ajouter les valeurs à l'enum)
DO $$ BEGIN
  ALTER TYPE "TaskStatus" ADD VALUE 'NOUVEAU';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE "TaskStatus" ADD VALUE 'ASSIGNEE';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE "TaskStatus" ADD VALUE 'EN_ANALYSE';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE "TaskStatus" ADD VALUE 'EN_ATTENTE_INFO';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE "TaskStatus" ADD VALUE 'A_VALIDER';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Table TaskMessage (messages client↔agent par tâche, ou internes gérante↔agent)
CREATE TABLE IF NOT EXISTS "TaskMessage" (
  "id" TEXT NOT NULL,
  "taskId" TEXT NOT NULL,
  "senderId" TEXT NOT NULL,
  "receiverId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "read" BOOLEAN NOT NULL DEFAULT false,
  "isInternal" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TaskMessage_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "TaskMessage_taskId_idx" ON "TaskMessage"("taskId");
CREATE INDEX IF NOT EXISTS "TaskMessage_receiverId_idx" ON "TaskMessage"("receiverId");
DO $$ BEGIN
  ALTER TABLE "TaskMessage" ADD CONSTRAINT "TaskMessage_taskId_fkey"
    FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "TaskMessage" ADD CONSTRAINT "TaskMessage_senderId_fkey"
    FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "TaskMessage" ADD CONSTRAINT "TaskMessage_receiverId_fkey"
    FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. Table Notification (tous les rôles)
CREATE TABLE IF NOT EXISTS "Notification" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "read" BOOLEAN NOT NULL DEFAULT false,
  "actionUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Notification_userId_idx" ON "Notification"("userId");
CREATE INDEX IF NOT EXISTS "Notification_read_idx" ON "Notification"("read");
DO $$ BEGIN
  ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4. Colonne isInternal sur TaskComment
ALTER TABLE "TaskComment" ADD COLUMN IF NOT EXISTS "isInternal" BOOLEAN NOT NULL DEFAULT false;

-- 5. Valeur par défaut du statut des nouvelles tâches (optionnel, géré par l'app)
-- Les tâches existantes gardent leur statut. Les nouvelles tâches créées par l'app utiliseront NOUVEAU.
