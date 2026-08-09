-- GED-V2A.2 — FORWARD : bucket documents privé
-- Appliqué sur le projet Supabase plateforme (jaxgjtryrnlyelniisrf).
-- Idempotent : peut être relancé sans effet de bord.
--
-- Prérequis :
--   - refs DB converties (npm run migrate:documents-storage-refs -- --apply)
--   - uploads métier → storage://documents/...
--   - preview/download via ACL + signed URL (pas de getPublicUrl)
--
-- Rollback d’urgence : scripts/sql/rollback-documents-bucket-public.sql
-- (les refs storage:// restent valides après rollback).

UPDATE storage.buckets
SET public = false
WHERE id = 'documents';

DROP POLICY IF EXISTS "Allow read documents" ON storage.objects;
