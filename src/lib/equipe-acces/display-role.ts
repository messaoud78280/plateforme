/**
 * Libellé métier affiché dans header / sidebar.
 * Ne pas confondre avec UserRole NextAuth (CLIENT / AGENT / MANAGER).
 */
import {
  PERMISSION_PROFILE_LABELS,
  PERSON_TYPE_LABELS,
  type PermissionProfileKey,
  type PersonType,
} from "@/lib/equipe-acces/types";

export function displayUserRoleLabel(opts: {
  role?: string | null;
  personType?: string | null;
  permissionProfile?: string | null;
}): string {
  const { role, personType, permissionProfile } = opts;

  if (permissionProfile && permissionProfile in PERMISSION_PROFILE_LABELS) {
    return PERMISSION_PROFILE_LABELS[permissionProfile as PermissionProfileKey];
  }

  if (role === "MANAGER") return "Direction BeWork";
  if (role === "AGENCE") return "Agence";
  if (role === "AGENT") return "Agent";

  if (personType && personType in PERSON_TYPE_LABELS) {
    const pt = personType as PersonType;
    if (pt === "INTERNAL") return "Personnel interne";
    return PERSON_TYPE_LABELS[pt];
  }

  if (role === "CLIENT") return "Client";
  return role?.trim() || "Utilisateur";
}
