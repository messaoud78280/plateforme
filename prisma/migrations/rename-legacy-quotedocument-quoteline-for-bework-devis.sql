-- Ancien schéma « devis / quote » (colonnes quoteProjectId, quoteDocumentId, dateDocument, type…)
-- incompatible avec le module BeWork Prisma (projectId, documentId, issueDate, documentType…).
-- Tant que ces tables gardent le nom QuoteDocument / QuoteLine, CREATE TABLE IF NOT EXISTS ne crée rien.
--
-- Ce script renomme les anciennes tables pour libérer les noms.
-- Ensuite exécutez en entier : prisma/migrations/add-bework-quote-documents.sql
--
-- Si une erreur mentionne une contrainte / une autre table (ex. QuoteProjectWorkItem), renommez ou
-- supprimez d’abord cette table dans un autre onglet SQL, puis relancez ce fichier.

-- 1) QuoteLine en premier (enfant de QuoteDocument)
DO $$
DECLARE
  tname text;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND lower(table_name) = 'quoteline' AND column_name = 'documentid'
  ) THEN
    RAISE NOTICE 'QuoteLine a déjà documentId (schéma BeWork). Rien à faire pour QuoteLine.';
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND lower(c.relname) = 'quoteline' AND c.relkind = 'r'
  ) THEN
    RAISE NOTICE 'Pas de table QuoteLine. Rien à faire.';
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'QuoteLine_legacy_pre_bework' AND c.relkind = 'r'
  ) THEN
    RAISE EXCEPTION 'QuoteLine_legacy_pre_bework existe déjà.';
  END IF;

  SELECT c.relname INTO tname
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND lower(c.relname) = 'quoteline' AND c.relkind = 'r'
  LIMIT 1;

  EXECUTE format('ALTER TABLE %I.%I RENAME TO %I', 'public', tname, 'QuoteLine_legacy_pre_bework');
  RAISE NOTICE 'QuoteLine → QuoteLine_legacy_pre_bework';
END $$;

-- 2) QuoteDocument
DO $$
DECLARE
  tname text;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND lower(table_name) = 'quotedocument' AND column_name = 'projectid'
  ) THEN
    RAISE NOTICE 'QuoteDocument a déjà projectId (schéma BeWork). Rien à faire pour QuoteDocument.';
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND lower(c.relname) = 'quotedocument' AND c.relkind = 'r'
  ) THEN
    RAISE NOTICE 'Pas de table QuoteDocument. Rien à faire.';
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'QuoteDocument_legacy_pre_bework' AND c.relkind = 'r'
  ) THEN
    RAISE EXCEPTION 'QuoteDocument_legacy_pre_bework existe déjà.';
  END IF;

  SELECT c.relname INTO tname
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND lower(c.relname) = 'quotedocument' AND c.relkind = 'r'
  LIMIT 1;

  EXECUTE format('ALTER TABLE %I.%I RENAME TO %I', 'public', tname, 'QuoteDocument_legacy_pre_bework');
  RAISE NOTICE 'QuoteDocument → QuoteDocument_legacy_pre_bework';
END $$;
