import { isClient, isAgentRole, isManager } from "@/types";
import { isDemoEmail } from "@/lib/demo-environment/constants";

export type TeamLoginGate = "gerante" | "agents" | "clients" | "demo";

/** Évite de renvoyer vers /connexion après login (boucle). */
export function safeTeamLoginRedirect(raw: string): string {
  const path = raw.trim();
  if (!path.startsWith("/") || path.startsWith("//")) return "/dashboard";
  if (path.startsWith("/connexion")) return "/dashboard";
  return path;
}

export function parseTeamLoginGate(raw: unknown): TeamLoginGate | null {
  const value = typeof raw === "string" ? raw.trim() : "";
  if (value === "gerante" || value === "agents" || value === "clients" || value === "demo") {
    return value;
  }
  return null;
}

export function gateAllows(role: string, gate: TeamLoginGate, email?: string | null): boolean {
  if (gate === "gerante") return isManager(role) && !isDemoEmail(email);
  if (gate === "agents") return isAgentRole(role) && !isDemoEmail(email);
  if (gate === "demo") return isClient(role);
  // Portail clients : comptes clients réels uniquement (pas les démos)
  return isClient(role) && !isDemoEmail(email);
}
