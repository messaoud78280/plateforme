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

export type SessionUser = { id?: string | null; role?: string | null } | null | undefined;

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
