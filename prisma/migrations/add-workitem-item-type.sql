-- BeWork Devis : type d’ouvrage (BPU / bibliothèque) — à exécuter sur une base existante.
CREATE TYPE "WorkItemItemType" AS ENUM (
  'ouvrage_technique',
  'etude_controle',
  'prestation_administrative',
  'garantie_assurance',
  'frais_annexe'
);

ALTER TABLE "WorkItem"
  ADD COLUMN "itemType" "WorkItemItemType" NOT NULL DEFAULT 'ouvrage_technique';

CREATE INDEX "WorkItem_itemType_idx" ON "WorkItem"("itemType");
