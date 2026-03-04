-- Créer le compte agent dans Supabase (sans connexion depuis ta machine)
-- À exécuter dans : Supabase → SQL Editor → New query → Coller ce script → Run
-- Mot de passe : motdepasse123

INSERT INTO "User" (
  id,
  email,
  name,
  password,
  role,
  "createdAt",
  "updatedAt"
)
VALUES (
  gen_random_uuid()::text,
  'agent@bework.fr',
  'Agent BeWork',
  '$2b$12$rGxo6Uh7YV8gPRmUpihfre.bqsphmMmjqe3YJQ5uM2eKGS.5PQMdC',
  'AGENT',
  now(),
  now()
)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  password = EXCLUDED.password,
  role = EXCLUDED.role,
  "updatedAt" = now();
