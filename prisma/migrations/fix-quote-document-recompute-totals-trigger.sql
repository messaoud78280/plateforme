-- Trigger legacy : quote_document_recompute_totals référençait computedSubtotalHT/Vat/TTC
-- (colonnes supprimées) → toute suppression d'ouvrage lié à QuoteLine_legacy plantait.

CREATE OR REPLACE FUNCTION public.quote_document_recompute_totals()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE "QuoteDocument" d
  SET
    "subtotalHT" = COALESCE(s."subtotalHT", 0),
    "totalVat" = COALESCE(s."totalVat", 0),
    "totalTTC" = COALESCE(s."totalTTC", 0),
    "updatedAt" = CURRENT_TIMESTAMP
  FROM (
    SELECT
      ql."documentId",
      SUM(COALESCE(ql."totalHT", 0))::DECIMAL(14, 4) AS "subtotalHT",
      SUM(COALESCE(ql."totalVat", 0))::DECIMAL(14, 4) AS "totalVat",
      SUM(COALESCE(ql."totalTTC", 0))::DECIMAL(14, 4) AS "totalTTC"
    FROM "QuoteLine" ql
    WHERE ql."documentId" IS NOT NULL
    GROUP BY ql."documentId"
  ) s
  WHERE d."id" = s."documentId";

  RETURN NULL;
END;
$$;
