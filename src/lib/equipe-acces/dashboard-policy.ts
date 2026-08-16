/**
 * SEC-1 — Politique unique d’accès dashboard (pages + APIs).
 *
 * Source de vérité des domaines : whitelist `isHrefAllowedForPersona`
 * (nav-by-persona.ts), plus les extras déjà appliqués dans la sidebar
 * (Équipe, Livraisons). Sidebar, layout, proxy et APIs doivent
 * appeler `canAccessDashboardHref` — pas une deuxième matrice.
 */

import {
  canManageEquipe,
  isHrefAllowedForPersona,
} from "@/lib/equipe-acces/nav-by-persona";

export type DashboardPersonaUser = {
  personType?: string | null;
  permissionProfile?: string | null;
};

function pathOnly(href: string): string {
  const raw = href.split("?")[0] ?? href;
  if (raw.length > 1 && raw.endsWith("/")) return raw.slice(0, -1);
  return raw;
}

function matchesPrefix(path: string, prefix: string): boolean {
  return path === prefix || path.startsWith(`${prefix}/`);
}

/** Livraisons = portail fournisseur uniquement (filtre sidebar existant). */
function isLivraisonsHref(path: string): boolean {
  return matchesPrefix(path, "/dashboard/livraisons");
}

function isEquipeHref(path: string): boolean {
  return matchesPrefix(path, "/dashboard/equipe");
}

function isSupplierPersona(
  personType?: string | null,
  permissionProfile?: string | null,
): boolean {
  return personType === "SUPPLIER" || permissionProfile === "FOURNISSEUR";
}

/**
 * Autorisation domaine dashboard — même vérité que la navigation.
 * Ne jamais se fier à un persona/rôle envoyé par le client.
 */
export function canAccessDashboardHref(
  href: string,
  personType?: string | null,
  permissionProfile?: string | null,
): boolean {
  const path = pathOnly(href);
  if (!isHrefAllowedForPersona(path, personType, permissionProfile)) {
    return false;
  }
  if (isLivraisonsHref(path) && !isSupplierPersona(personType, permissionProfile)) {
    return false;
  }
  if (isEquipeHref(path) && !canManageEquipe(personType, permissionProfile)) {
    return false;
  }
  return true;
}

export function canAccessDashboardHrefForUser(
  href: string,
  user: DashboardPersonaUser | null | undefined,
): boolean {
  return canAccessDashboardHref(href, user?.personType, user?.permissionProfile);
}

/**
 * Mappe un chemin API vers le href dashboard dont il hérite l’ACL persona.
 * `null` = hors politique persona (GED, auth, health, etc.).
 */
export function requiredHrefForApiPath(apiPath: string): string | null {
  const path = pathOnly(apiPath);

  if (path.includes("/profitability")) {
    return "/dashboard/rentabilite";
  }
  if (path.startsWith("/api/commercial")) {
    return "/dashboard/devis-facturation";
  }
  if (path.startsWith("/api/supplier-invoices")) {
    return "/dashboard/depenses";
  }
  if (path.startsWith("/api/suppliers")) {
    return "/dashboard/fournisseurs";
  }
  if (path.startsWith("/api/equipe")) {
    return "/dashboard/equipe";
  }
  if (
    path.startsWith("/api/reports/stats") ||
    path.startsWith("/api/reports/export")
  ) {
    return "/dashboard/rapports";
  }
  if (path.startsWith("/api/facturation")) {
    return "/dashboard/facturation";
  }
  if (path.startsWith("/api/annual-contracts")) {
    return "/dashboard/contrats-annuels";
  }
  if (path.startsWith("/api/purchase-orders")) {
    return "/dashboard/commandes";
  }
  return null;
}

export function canAccessDashboardApi(
  apiPath: string,
  personType?: string | null,
  permissionProfile?: string | null,
): boolean {
  const href = requiredHrefForApiPath(apiPath);
  if (!href) return true;
  return canAccessDashboardHref(href, personType, permissionProfile);
}

export type PersonaGateDecision =
  | { ok: true }
  | { ok: false; status: 401 | 403; error: string };

/** Décision page dashboard (middleware / tests HTTP). */
export function decideDashboardPageAccess(
  pathname: string,
  personType?: string | null,
  permissionProfile?: string | null,
  authenticated = true,
): PersonaGateDecision {
  if (!authenticated) {
    return { ok: false, status: 401, error: "Non authentifié" };
  }
  if (!canAccessDashboardHref(pathname, personType, permissionProfile)) {
    return { ok: false, status: 403, error: "Non autorisé" };
  }
  return { ok: true };
}

/** Décision API mappée (403 si persona interdit). APIs hors carte : ok. */
export function decideApiAccess(
  apiPath: string,
  personType?: string | null,
  permissionProfile?: string | null,
  authenticated = true,
): PersonaGateDecision {
  if (!authenticated) {
    return { ok: false, status: 401, error: "Non authentifié" };
  }
  if (!canAccessDashboardApi(apiPath, personType, permissionProfile)) {
    return { ok: false, status: 403, error: "Non autorisé" };
  }
  return { ok: true };
}
