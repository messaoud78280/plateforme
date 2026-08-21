import { isClient, isAgentRole, isManager } from "@/types";
import { isDemoEmail } from "@/lib/demo-environment/constants";
import { isPlatformAdminRole } from "@/lib/platform-admin/authz";

export type TeamLoginGate = "gerante" | "agents" | "clients" | "demo" | "admin";

/** Évite de renvoyer vers /connexion après login (boucle). */
export function safeTeamLoginRedirect(raw: string): string {
  const path = raw.trim();
  if (!path.startsWith("/") || path.startsWith("//")) return "/dashboard";
  if (path.startsWith("/connexion")) return "/dashboard";
  return path;
}

export function parseTeamLoginGate(raw: unknown): TeamLoginGate | null {
  const value = typeof raw === "string" ? raw.trim() : "";
  if (
    value === "gerante" ||
    value === "agents" ||
    value === "clients" ||
    value === "demo" ||
    value === "admin"
  ) {
    return value;
  }
  return null;
}

/**
 * @param platformRole — User.platformRole (DB). Requis pour le portail admin.
 * Un Platform Admin ne passe pas par gérant / clients / agents.
 */
export function gateAllows(
  role: string,
  gate: TeamLoginGate,
  email?: string | null,
  platformRole?: string | null,
): boolean {
  if (gate === "admin") {
    return isPlatformAdminRole(platformRole);
  }
  // Platform Admin : uniquement /admin/connexion
  if (isPlatformAdminRole(platformRole)) {
    return false;
  }
  if (gate === "gerante") return isManager(role) && !isDemoEmail(email);
  if (gate === "agents") return isAgentRole(role) && !isDemoEmail(email);
  if (gate === "demo") return isClient(role);
  return isClient(role) && !isDemoEmail(email);
}
