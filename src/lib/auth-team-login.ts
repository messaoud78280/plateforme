export type TeamLoginGate = "gerante" | "agents" | "clients";

/** Évite de renvoyer vers /connexion après login (boucle). */
export function safeTeamLoginRedirect(raw: string): string {
  const path = raw.trim();
  if (!path.startsWith("/") || path.startsWith("//")) return "/dashboard";
  if (path.startsWith("/connexion")) return "/dashboard";
  return path;
}
