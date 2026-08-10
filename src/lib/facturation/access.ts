/**
 * ACL Facturation V1A-lite — internes uniquement (pas de portail externe).
 */
import { isAgencyOrManager, isAgent } from "@/lib/authz";
import { isExternalPortalUser } from "@/lib/equipe-acces/nav-by-persona";

export function canAccessFacturation(user: {
  role?: string | null;
  personType?: string | null;
  permissionProfile?: string | null;
}): boolean {
  if (isExternalPortalUser(user.personType)) return false;
  if (user.permissionProfile === "CLIENT" || user.permissionProfile === "FOURNISSEUR") {
    return false;
  }
  // Direction / Admin / Conducteur interne / roles staff
  if (isAgencyOrManager(user) || isAgent(user)) return true;
  if (user.personType === "INTERNAL" || !user.personType) return true;
  // Owner CLIENT (entreprise) — accès ops interne
  if (user.role === "CLIENT" && user.personType !== "CLIENT_EXT") return true;
  return false;
}
