-- Migration : ajouter pièces jointes aux messages directs
-- Exécuter dans Supabase SQL Editor si la table DirectMessage existe déjà

ALTER TABLE "DirectMessage" ADD COLUMN IF NOT EXISTS "attachmentsJson" JSONB;
