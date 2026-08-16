/**
 * VISITES-METRES-1 — Accès (SEC-1 personas, pas de permissions parallèles).
 */
import { isExternalPortalUser } from "@/lib/equipe-acces/nav-by-persona";
import { canAccessDashboardHref } from "@/lib/equipe-acces/dashboard-policy";
import { resolvePurchaseOrderOrgId } from "@/lib/purchase-orders/access";

export type SiteVisitActor = {
  id: string;
  role?: string | null;
  personType?: string | null;
  permissionProfile?: string | null;
  isDemo?: boolean;
  demoRootUserId?: string | null;
};

export type SiteVisitPermissionUser = {
  id?: string;
  role?: string | null;
  personType?: string | null;
  permissionProfile?: string | null;
};

export function canAccessSiteVisits(user: SiteVisitPermissionUser): boolean {
  if (isExternalPortalUser(user.personType)) return false;
  const profile = (user.permissionProfile ?? "").toUpperCase();
  if (profile === "CLIENT" || profile === "FOURNISSEUR") return false;
  return canAccessDashboardHref(
    "/dashboard/visites-metres",
    user.personType,
    user.permissionProfile,
  );
}

/** Créer un devis Commercial depuis une visite — même gate que Devis & Facturation. */
export function canCreateQuoteFromVisit(user: SiteVisitPermissionUser): boolean {
  if (!canAccessSiteVisits(user)) return false;
  return canAccessDashboardHref(
    "/dashboard/devis-facturation",
    user.personType,
    user.permissionProfile,
  );
}

export async function resolveSiteVisitsOrgId(
  user: SiteVisitActor,
): Promise<string | null> {
  return resolvePurchaseOrderOrgId(user);
}
