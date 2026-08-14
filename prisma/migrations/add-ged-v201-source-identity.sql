-- GED V2.0.1 — identité source + déduplication (pas de nouvelle table)
-- Unique partiel : un fichier source ne produit qu’une entrée GED.

-- Doublons éventuels (garder le lien le plus ancien)
DELETE FROM "ChantierFileLink" a
WHERE a.id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY "entityType", "entityId"
             ORDER BY "createdAt" ASC, id ASC
           ) AS rn
    FROM "ChantierFileLink"
    WHERE "entityId" IS NOT NULL
      AND "entityType" IN (
        'message_attachment',
        'purchase_order_document',
        'commercial_quote_snapshot',
        'commercial_invoice',
        'commercial_progress',
        'doe_item',
        'pilotage_photo',
        'pilotage_market_document',
        'legacy_document',
        'pilotage_subcontractor_doc'
      )
  ) t
  WHERE rn > 1
);

CREATE UNIQUE INDEX IF NOT EXISTS "ChantierFileLink_primary_source_uidx"
  ON "ChantierFileLink" ("entityType", "entityId")
  WHERE "entityId" IS NOT NULL
    AND "entityType" IN (
      'message_attachment',
      'purchase_order_document',
      'commercial_quote_snapshot',
      'commercial_invoice',
      'commercial_progress',
      'doe_item',
      'pilotage_photo',
      'pilotage_market_document',
      'legacy_document',
      'pilotage_subcontractor_doc'
    );

CREATE INDEX IF NOT EXISTS "ChantierFile_documentType_idx"
  ON "ChantierFile" ("documentType");
