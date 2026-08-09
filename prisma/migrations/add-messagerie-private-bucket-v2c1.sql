-- MESSAGERIE-V2C.1 : bucket privé pour médias messagerie (non destructif)
-- Appliqué aussi via Supabase MCP sur le projet plateforme.
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('messagerie', 'messagerie', false, 15728640)
ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = EXCLUDED.file_size_limit;
