import { isAgentRole, isClient, isManager } from "@/types";

export type TeamLoginGate = "gerante" | "agents" | "clients";

/** Évite de renvoyer vers /connexion après login (boucle). */
export function safeTeamLoginRedirect(raw: string): string {
  const path = raw.trim();
  if (!path.startsWith("/") || path.startsWith("//")) return "/dashboard";
  if (path.startsWith("/connexion")) return "/dashboard";
  return path;
}

export function parseTeamLoginGate(raw: unknown): TeamLoginGate | null {
  const value = typeof raw === "string" ? raw.trim() : "";
  if (value === "gerante" || value === "agents" || value === "clients") return value;
  return null;
}

export function gateAllows(role: string, gate: TeamLoginGate): boolean {
  if (gate === "gerante") return isManager(role);
  if (gate === "agents") return isAgentRole(role);
  return isClient(role);
}
