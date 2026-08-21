import { redirect } from "next/navigation";
import { getServerSession, type Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureOrganizationForOwner } from "@/lib/organization/access";
import { isAgencyOrManager, isAgent, isClientRole } from "@/lib/authz";
import { canAccessDashboardHref } from "@/lib/equipe-acces/dashboard-policy";

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
    where: { userId: ownerId, status: "ACTIVE" },
    select: { organizationId: true },
  });
  if (membership?.organizationId) return membership.organizationId;

  if (ownerId !== user.id) {
    const own = await prisma.organizationMember.findFirst({
      where: { userId: user.id, status: "ACTIVE" },
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

/** Session obligatoire + accès module + persona sur le href demandé. */
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
  if (
    !canAccessDashboardHref(
      callbackUrl,
      session.user.personType,
      session.user.permissionProfile,
    )
  ) {
    redirect("/dashboard");
  }
  return session;
}

export type CommercialApiAuth =
  | { error: null; status: 200; session: Session; orgId: string }
  | {
      error: string;
      status: 401 | 402 | 403;
      session: null;
      orgId?: undefined;
      code?: string;
    };

/**
 * Session API commerciale + orgId.
 * - string arg : requiredHref (compat historique)
 * - object : { requiredHref?, requireWrite? }
 */
export async function requireCommercialApiSession(
  requiredHrefOrOpts:
    | string
    | { requiredHref?: string; requireWrite?: boolean } = "/dashboard/devis-facturation",
): Promise<CommercialApiAuth> {
  const opts =
    typeof requiredHrefOrOpts === "string"
      ? { requiredHref: requiredHrefOrOpts, requireWrite: false }
      : {
          requiredHref: requiredHrefOrOpts.requiredHref ?? "/dashboard/devis-facturation",
          requireWrite: Boolean(requiredHrefOrOpts.requireWrite),
        };

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "Non authentifié", status: 401, session: null };
  }
  if (!canAccessCommercialModule(session.user)) {
    return { error: "Non autorisé", status: 403, session: null };
  }
  if (
    !canAccessDashboardHref(
      opts.requiredHref,
      session.user.personType,
      session.user.permissionProfile,
    )
  ) {
    return { error: "Non autorisé", status: 403, session: null };
  }
  const orgId = await resolveCommercialOrgId(session.user);
  if (!orgId) {
    return { error: "Organisation introuvable", status: 403, session: null };
  }

  if (opts.requireWrite) {
    try {
      const { requireOrganizationContext, assertOrgWritable, TenantAccessError } =
        await import("@/lib/organization/tenant");
      const ctx = await requireOrganizationContext(session.user);
      if (ctx.organizationId !== orgId) {
        return { error: "Organisation non autorisée", status: 403, session: null };
      }
      assertOrgWritable(ctx);
    } catch (e) {
      const { TenantAccessError } = await import("@/lib/organization/tenant");
      if (e instanceof TenantAccessError) {
        return {
          error: e.message,
          status: (e.status === 402 ? 402 : 403) as 402 | 403,
          session: null,
          code: e.code,
        };
      }
      throw e;
    }
  }

  return { error: null, status: 200, session, orgId };
}
