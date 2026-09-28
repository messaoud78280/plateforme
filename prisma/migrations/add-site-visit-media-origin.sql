-- Photo de visite : origine terrain ou illustration de démonstration.
-- Les lignes existantes restent des photos terrain. Aucun fichier n’est recopié.

ALTER TABLE "SiteVisitMedia"
  ADD COLUMN IF NOT EXISTS "origin" TEXT NOT NULL DEFAULT 'TERRAIN';
