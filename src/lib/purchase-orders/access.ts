import { prisma } from "@/lib/prisma";
import { ensureOrganizationForOwner } from "@/lib/organization/access";
import { isAgencyOrManager, isAgent, isClientRole } from "@/lib/authz";

export type PurchaseOrderSessionUser = {
  id: string;
  role?: string | null;
  personType?: string | null;
  permissionProfile?: string | null;
  isDemo?: boolean;
  demoRootUserId?: string | null;
};

export async function resolvePurchaseOrderOrgId(
  user: PurchaseOrderSessionUser,
): Promise<string | null> {
  if (user.personType === "CLIENT_EXT") return null;

  if (user.personType === "SUPPLIER" || user.permissionProfile === "FOURNISSEUR") {
    const u = await prisma.user.findUnique({
      where: { id: user.id },
      select: { externalOrganizationId: true },
    });
    if (!u?.externalOrganizationId) return null;
    const ext = await prisma.externalOrganization.findUnique({
      where: { id: u.externalOrganizationId },
      select: { hostOrganizationId: true },
    });
    return ext?.hostOrganizationId ?? null;
  }

  const ownerId =
    user.isDemo && user.demoRootUserId ? user.demoRootUserId : user.id;

  if (isClientRole(user) || isAgencyOrManager(user) || isAgent(user)) {
    const orgId = await ensureOrganizationForOwner(ownerId);
    return orgId;
  }

  const membership = await prisma.organizationMember.findFirst({
    where: { userId: user.id },
    select: { organizationId: true },
  });
  return membership?.organizationId ?? null;
}

export function isInternalPurchaseOrderActor(user: PurchaseOrderSessionUser): boolean {
  if (user.personType === "CLIENT_EXT" || user.personType === "SUPPLIER") return false;
  if (user.permissionProfile === "CLIENT" || user.permissionProfile === "FOURNISSEUR") {
    return false;
  }
  return true;
}

export function isSupplierPurchaseOrderActor(user: PurchaseOrderSessionUser): boolean {
  return user.personType === "SUPPLIER" || user.permissionProfile === "FOURNISSEUR";
}

/** Client : aucun accès aux commandes fournisseurs. */
export function canListPurchaseOrders(user: PurchaseOrderSessionUser): boolean {
  if (user.personType === "CLIENT_EXT" || user.permissionProfile === "CLIENT") return false;
  return true;
}
