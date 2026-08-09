-- GED-V2A.2 — Rollback bucket documents (si flux critique oublié)
-- Réactive l’accès public historique. À n’utiliser qu’en urgence.
--
-- FORWARD (déjà appliqué via MCP) :
--   UPDATE storage.buckets SET public = false WHERE id = 'documents';
--   DROP POLICY IF EXISTS "Allow read documents" ON storage.objects;
--
-- ROLLBACK :

UPDATE storage.buckets
SET public = true
WHERE id = 'documents';

-- Recréer la lecture publique large (état antérieur)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Allow read documents'
  ) THEN
    CREATE POLICY "Allow read documents"
      ON storage.objects
      FOR SELECT
      TO public
      USING (bucket_id = 'documents');
  END IF;
END $$;

-- Note : les références DB restent en storage://documents/... après rollback.
-- L’app continue de signer via service role ; le risque est uniquement
-- la réouverture des anciennes URL /object/public/documents/...
