-- Civilité pour la page "Votre profil" / Informations personnelles
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "civilite" TEXT;
