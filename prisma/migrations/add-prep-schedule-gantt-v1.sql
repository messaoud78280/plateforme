-- Gantt chantier V1 — colonne état point d'arrêt (additif, idempotent)
-- Ne modifie aucune donnée existante hors ajout de colonne nullable.

ALTER TABLE "PrepScheduleTask"
  ADD COLUMN IF NOT EXISTS "holdPointStatus" TEXT;
