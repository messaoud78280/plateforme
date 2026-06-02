import { UserRole } from "@prisma/client";

/** Mot de passe commun équipe BeWork (gérantes + agents). */
export const BEWORK_TEAM_PASSWORD = "Samana78";

export const BEWORK_TEAM = [
  { name: "Laure Olivié", email: "laure@bework.fr", role: UserRole.MANAGER },
  { name: "Hana", email: "hana@bework.fr", role: UserRole.MANAGER },
  { name: "Alya", email: "alya@bework.fr", role: UserRole.MANAGER },
  { name: "Lina", email: "lina@bework.fr", role: UserRole.AGENT },
  { name: "Sara", email: "sara@bework.fr", role: UserRole.AGENT },
  { name: "Sonia", email: "sonia@bework.fr", role: UserRole.AGENT },
  { name: "Eva", email: "eva@bework.fr", role: UserRole.AGENT },
] as const;
