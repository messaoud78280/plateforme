import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureOrganizationForOwner } from "@/lib/organization/access";
import { isAgencyOrManager, isAgent, isClientRole } from "@/lib/authz";

export type CommercialSessionUser = {
  id: string;
  role?: string | null;
  personType?: string | null;
  permissionProfile?: string | null;
  isDemo?: boolean;
  demoRootUserId?: string | null;
};

/** Multi-tenant : organisation résolue côté serveur (pattern commandes). */
export async function resolveCommercialOrgId(
  user: CommercialSessionUser,
): Promise<string | null> {
  if (user.personType === "CLIENT_EXT") return null;
  if (user.personType === "SUPPLIER" || user.permissionProfile === "FOURNISSEUR") {
    return null;
  }

  const ownerId =
    user.isDemo && user.demoRootUserId ? user.demoRootUserId : user.id;

  if (isClientRole(user) || isAgencyOrManager(user) || isAgent(user)) {
    const orgId = await ensureOrganizationForOwner(ownerId);
    if (orgId) return orgId;
  }

  const membership = await prisma.organizationMember.findFirst({
    where: { userId: ownerId },
    select: { organizationId: true },
  });
  if (membership?.organizationId) return membership.organizationId;

  if (ownerId !== user.id) {
    const own = await prisma.organizationMember.findFirst({
      where: { userId: user.id },
      select: { organizationId: true },
    });
    return own?.organizationId ?? null;
  }

  return null;
}

/** Module interne entreprise — pas clients externes / fournisseurs. */
export function canAccessCommercialModule(user: CommercialSessionUser): boolean {
  if (user.personType === "CLIENT_EXT" || user.personType === "SUPPLIER") return false;
  if (user.permissionProfile === "CLIENT" || user.permissionProfile === "FOURNISSEUR") {
    return false;
  }
  return true;
}

/** Session obligatoire + accès module ; sinon redirection. */
export async function requireCommercialSession(
  callbackUrl = "/dashboard/devis-facturation",
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect(`/connexion?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }
  if (!canAccessCommercialModule(session.user)) {
    redirect("/dashboard");
  }
  return session;
}

export async function requireCommercialApiSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "Non authentifié" as const, status: 401 as const, session: null };
  }
  if (!canAccessCommercialModule(session.user)) {
    return { error: "Non autorisé" as const, status: 403 as const, session: null };
  }
  const orgId = await resolveCommercialOrgId(session.user);
  if (!orgId) {
    return {
      error: "Organisation introuvable" as const,
      status: 403 as const,
      session: null,
    };
  }
  return { error: null, status: 200 as const, session, orgId };
}
