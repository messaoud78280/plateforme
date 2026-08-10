/**
 * Accès catalogue Assistant IA — internes uniquement.
 * Ne contourne jamais organizationId / ProjectAccess / GED / messagerie (principe V2).
 */

import { isExternalPortalUser } from "@/lib/equipe-acces/nav-by-persona";

export function canAccessAssistantIa(user: {
  role?: string | null;
  personType?: string | null;
  permissionProfile?: string | null;
}): boolean {
  if (isExternalPortalUser(user.personType)) return false;
  const profile = (user.permissionProfile ?? "").toUpperCase();
  if (profile === "CLIENT" || profile === "FOURNISSEUR" || profile === "SOUS_TRAITANT") {
    return false;
  }
  // Direction, Administratif, Conducteur, Chef chantier, staff legacy
  if (
    profile === "DIRECTION" ||
    profile === "ADMINISTRATIF" ||
    profile === "CONDUCTEUR" ||
    profile === "CHEF_CHANTIER"
  ) {
    return true;
  }
  if (user.role === "MANAGER" || user.role === "AGENCE" || user.role === "AGENT") {
    return true;
  }
  // Owner / CLIENT INTERNAL sans profil (Denis démo)
  if (user.role === "CLIENT" && (user.personType === "INTERNAL" || !user.personType)) {
    return true;
  }
  return false;
}
