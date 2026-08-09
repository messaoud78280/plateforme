/**
 * Libellé métier affiché dans header / sidebar / listes.
 * Ne pas confondre avec UserRole NextAuth (CLIENT / AGENT / MANAGER).
 * TACHES-V2A.1 — privilégier profil métier / jobTitle, jamais « Agent » générique
 * si un libellé plus utile existe.
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
  jobTitle?: string | null;
}): string {
  const { role, personType, permissionProfile, jobTitle } = opts;

  if (permissionProfile && permissionProfile in PERMISSION_PROFILE_LABELS) {
    return PERMISSION_PROFILE_LABELS[permissionProfile as PermissionProfileKey];
  }

  const jt = jobTitle?.trim();
  if (jt) return jt;

  if (role === "MANAGER") return "Direction BeWork";

  /** Staff / agents internes sans profil → métier par défaut, pas « Agent ». */
  if (personType === "INTERNAL" || personType == null) {
    if (role === "AGENCE") return "Administratif";
    if (role === "AGENT") return "Conducteur de travaux";
  }

  if (role === "AGENCE") return "Agence";
  if (role === "AGENT") return "Conducteur de travaux";

  if (personType && personType in PERSON_TYPE_LABELS) {
    const pt = personType as PersonType;
    if (pt === "INTERNAL") return "Personnel interne";
    return PERSON_TYPE_LABELS[pt];
  }

  if (role === "CLIENT") return "Client";
  return role?.trim() || "Utilisateur";
}
