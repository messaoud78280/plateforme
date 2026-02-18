-- Lien d'action sur les alertes (optionnel)
-- Permet d'afficher un bouton "Voir le projet" sur les alertes (ex. nouveau message).
-- Exécuter après supabase-add-documents-tasks.sql

ALTER TABLE "Alert" ADD COLUMN IF NOT EXISTS "actionUrl" TEXT;
