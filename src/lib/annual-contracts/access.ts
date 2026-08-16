/**
 * CONTRATS-ANNUELS-1 — Accès & SEC-1 (montants).
 * Client / Fournisseur : aucun accès.
 * Conducteur : ops sans montants HT / portefeuille.
 */
import { isExternalPortalUser } from "@/lib/equipe-acces/nav-by-persona";
import { canAccessDashboardHref } from "@/lib/equipe-acces/dashboard-policy";
import { resolvePurchaseOrderOrgId } from "@/lib/purchase-orders/access";

export type AnnualContractActor = {
  id: string;
  role?: string | null;
  personType?: string | null;
  permissionProfile?: string | null;
  isDemo?: boolean;
  demoRootUserId?: string | null;
};

export function canAccessAnnualContracts(user: AnnualContractActor): boolean {
  if (isExternalPortalUser(user.personType)) return false;
  const profile = (user.permissionProfile ?? "").toUpperCase();
  if (profile === "CLIENT" || profile === "FOURNISSEUR") return false;
  return canAccessDashboardHref(
    "/dashboard/contrats-annuels",
    user.personType,
    user.permissionProfile,
  );
}

/** SEC-1 — montants / portefeuille HT réservés Direction & Administratif (+ owner sans profil). */
export function canViewAnnualContractFinancials(user: AnnualContractActor): boolean {
  if (!canAccessAnnualContracts(user)) return false;
  const profile = (user.permissionProfile ?? "").toUpperCase();
  if (!profile) return true;
  if (profile === "DIRECTION" || profile === "ADMINISTRATIF") return true;
  if (profile === "CONDUCTEUR" || profile === "CHEF_CHANTIER") return false;
  return true;
}

export async function resolveAnnualContractsOrgId(
  user: AnnualContractActor,
): Promise<string | null> {
  return resolvePurchaseOrderOrgId(user);
}
