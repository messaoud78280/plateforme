-- Agent en charge du projet (optionnel)
-- Exécuter après supabase-projets-enrichis.sql
-- Ajoute sur Project : assignedToId (référence User, rôle AGENCE)
-- Type TEXT pour correspondre à "User"."id" (cuid dans votre base).

-- Si la colonne existe déjà avec un mauvais type (ex. UUID), la supprimer d'abord :
ALTER TABLE "Project" DROP COLUMN IF EXISTS "assignedToId";

ALTER TABLE "Project"
ADD COLUMN IF NOT EXISTS "assignedToId" TEXT;

-- Clé étrangère vers User (agent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'Project_assignedToId_fkey'
    AND table_name = 'Project'
  ) THEN
    ALTER TABLE "Project"
    ADD CONSTRAINT "Project_assignedToId_fkey"
    FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Project_assignedToId_idx" ON "Project"("assignedToId");
