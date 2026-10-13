/**
 * Autorisations transverses — remplace les vérifications de rôle dupliquées
 * (`session.user.role === "AGENCE" || session.user.role === "MANAGER"`, etc.)
 * répétées dans une vingtaine de routes API.
 *
 * Additif uniquement : ces helpers reproduisent exactement les combinaisons de rôles
 * déjà utilisées dans le code, sans changer le périmètre d'accès existant.
 * Pour les vérifications d'accès à une ressource précise (chantier, tâche…),
 * voir `@/lib/chantier-dossier/access` et les modules équivalents.
 */

export type SessionUser = {
  id?: string | null;
  role?: string | null;
  personType?: string | null;
  permissionProfile?: string | null;
} | null | undefined;

/** Comptes écosystème : jamais d’accès transversal, même si UserRole est staff. */
const CLIENT_SIDE_PERSON_TYPES = new Set([
  "CLIENT_EXT",
  "SUPPLIER",
  "SUBCONTRACTOR",
  "MOE",
  "CONTROL_OFFICE",
  "PARTNER",
]);

const CLIENT_SIDE_PROFILES = new Set([
  "CLIENT",
  "FOURNISSEUR",
  "SOUS_TRAITANT",
  "PARTENAIRE",
]);

function isClientSideIdentity(user: SessionUser): boolean {
  if (!user) return true;
  if (user.role === "CLIENT") return true;
  if (user.personType && CLIENT_SIDE_PERSON_TYPES.has(user.personType)) {
    return true;
  }
  if (user.permissionProfile && CLIENT_SIDE_PROFILES.has(user.permissionProfile)) {
    return true;
  }
  return false;
}

/**
 * Staff BeWork opérationnel (gérant, agence, agent assigné).
 * Exclut les comptes clients et portails externes.
 */
export function isBeworkOperationalStaff(user: SessionUser): boolean {
  if (!user?.role || !isBeworkStaff(user)) return false;
  return !isClientSideIdentity(user);
}

/**
 * Accès transversal aux organisations : uniquement MANAGER et AGENCE BeWork.
 * L’agent reste limité à ses chantiers assignés.
 */
export function isBeworkCrossOrgStaff(user: SessionUser): boolean {
  if (!isAgencyOrManager(user)) return false;
  return !isClientSideIdentity(user);
}

/** Gérant BeWork — accès complet, administration. */
export function isManager(user: SessionUser): boolean {
  return user?.role === "MANAGER";
}

/** Décideur métier BeWork (gérant ou agence) — qualifie, assigne, valide. */
export function isAgencyOrManager(user: SessionUser): boolean {
  return user?.role === "AGENCE" || user?.role === "MANAGER";
}

/** Assistant BeWork assigné à une mission (exécution). */
export function isAgent(user: SessionUser): boolean {
  return user?.role === "AGENT";
}

/** Tout le staff BeWork (décideurs + agents) — le client en est exclu. */
export function isBeworkStaff(user: SessionUser): boolean {
  return isAgencyOrManager(user) || isAgent(user);
}

/** Client BeWork. */
export function isClientRole(user: SessionUser): boolean {
  return user?.role === "CLIENT";
}
