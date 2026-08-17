-- VISITES-METRES-2.2 — Préparation technique de visite

ALTER TABLE "SiteVisit"
  ADD COLUMN IF NOT EXISTS "prepJson" JSONB;
