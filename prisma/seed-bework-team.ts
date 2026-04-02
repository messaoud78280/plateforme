/**
 * Comptes équipe BeWork (gérantes + agents) — mot de passe commun pour la démo.
 * Utilisé par prisma/seed.ts et prisma/seed-equipe-bework.ts
 */
import { UserRole } from "@prisma/client";

export const BEWORK_TEAM_PASSWORD = "Samana78";

export const BEWORK_TEAM = [
  { name: "Laure Olivié", email: "laure@bework.fr", role: UserRole.MANAGER },
  { name: "Hana", email: "hana@bework.fr", role: UserRole.MANAGER },
  { name: "Lina", email: "lina@bework.fr", role: UserRole.AGENT },
  { name: "Sara", email: "sara@bework.fr", role: UserRole.AGENT },
  { name: "Sonia", email: "sonia@bework.fr", role: UserRole.AGENT },
  { name: "Eva", email: "eva@bework.fr", role: UserRole.AGENT },
] as const;
