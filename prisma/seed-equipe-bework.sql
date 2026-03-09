-- 6 comptes équipe BeWork : 2 gérantes (MANAGER) + 4 agents (AGENT)
-- Mot de passe commun : Samana78
-- Exécuter dans Supabase → SQL Editor sur la base liée à la plateforme.

-- Gérantes
INSERT INTO "User" ("id", "email", "password", "name", "role", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'laure@bework.fr', '$2b$12$1ZBU7Q4JzRnZpC2UXCMDJu6BierRu4hQDYEdsCfyIbdDSfpXvLdA.', 'Laure Olivié', 'MANAGER', NOW(), NOW()),
  (gen_random_uuid()::text, 'hana@bework.fr',  '$2b$12$1ZBU7Q4JzRnZpC2UXCMDJu6BierRu4hQDYEdsCfyIbdDSfpXvLdA.', 'Hana', 'MANAGER', NOW(), NOW())
ON CONFLICT ("email") DO UPDATE SET "name" = EXCLUDED."name", "role" = EXCLUDED."role", "password" = EXCLUDED."password", "updatedAt" = NOW();

-- Agents
INSERT INTO "User" ("id", "email", "password", "name", "role", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'lina@bework.fr',  '$2b$12$1ZBU7Q4JzRnZpC2UXCMDJu6BierRu4hQDYEdsCfyIbdDSfpXvLdA.', 'Lina', 'AGENT', NOW(), NOW()),
  (gen_random_uuid()::text, 'sara@bework.fr',  '$2b$12$1ZBU7Q4JzRnZpC2UXCMDJu6BierRu4hQDYEdsCfyIbdDSfpXvLdA.', 'Sara', 'AGENT', NOW(), NOW()),
  (gen_random_uuid()::text, 'sonia@bework.fr', '$2b$12$1ZBU7Q4JzRnZpC2UXCMDJu6BierRu4hQDYEdsCfyIbdDSfpXvLdA.', 'Sonia', 'AGENT', NOW(), NOW()),
  (gen_random_uuid()::text, 'eva@bework.fr',   '$2b$12$1ZBU7Q4JzRnZpC2UXCMDJu6BierRu4hQDYEdsCfyIbdDSfpXvLdA.', 'Eva', 'AGENT', NOW(), NOW())
ON CONFLICT ("email") DO UPDATE SET "name" = EXCLUDED."name", "role" = EXCLUDED."role", "password" = EXCLUDED."password", "updatedAt" = NOW();
