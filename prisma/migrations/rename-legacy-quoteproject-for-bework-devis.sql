-- Conflit de nom : une table "QuoteProject" existe déjà avec un AUTRE schéma
-- (ex. colonnes code, name, projectLocation…) que celui du module BeWork Devis dans Prisma
-- (projectName, projectAddress, clientEmail…).
-- Dans ce cas CREATE TABLE IF NOT EXISTS ne fait rien et les ALTER n’alignent pas le bon modèle.
--
-- Ce script renomme l’ancienne table pour libérer le nom "QuoteProject".
-- Ensuite exécutez en entier : prisma/migrations/add-bework-quote-documents.sql
--
-- Les lignes de l’ancienne table restent dans "QuoteProject_legacy_pre_bework" (aucune suppression).

DO $$
DECLARE
  tname text;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND lower(table_name) = 'quoteproject'
      AND column_name = 'projectname'
  ) THEN
    RAISE NOTICE 'QuoteProject a déjà la colonne projectName (schéma BeWork). Aucun renommage.';
    RETURN;
  END IF;

  SELECT c.relname INTO tname
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind = 'r'
    AND lower(c.relname) = 'quoteproject'
  LIMIT 1;

  IF tname IS NULL THEN
    RAISE NOTICE 'Aucune table QuoteProject trouvée. Passez directement à add-bework-quote-documents.sql.';
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'QuoteProject_legacy_pre_bework' AND c.relkind = 'r'
  ) THEN
    RAISE EXCEPTION
      'La table QuoteProject_legacy_pre_bework existe déjà. Supprimez ou renommez-la manuellement avant de relancer.';
  END IF;

  EXECUTE format('ALTER TABLE %I.%I RENAME TO %I', 'public', tname, 'QuoteProject_legacy_pre_bework');
  RAISE NOTICE 'Ancienne table renommée en QuoteProject_legacy_pre_bework. Lancez maintenant add-bework-quote-documents.sql en entier.';
END $$;
