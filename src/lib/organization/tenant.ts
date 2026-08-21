/**
 * Contexte tenant SaaS — source de vérité serveur pour Organization + membership.
 * Ne jamais se fier uniquement à un organizationId envoyé par le client.
 */

import type {
  OrganizationMemberRole,
  OrganizationSaasStatus,
  OrganizationKind,
  PlatformSupportMode,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  ensureOrganizationForOwner,
  getUserOrganizationIds,
} from "@/lib/organization/access";
import {
  computeOrgWriteAccess,
  daysRemainingInTrial,
  effectiveSaasStatus,
  type OrgWriteAccess,
} from "@/lib/organization/lifecycle";
import { isPlatformAdminRole } from "@/lib/platform-admin/authz";
import { getActiveSupportSessionForAdmin } from "@/lib/platform-admin/support";

export type TenantUserRef = {
  id: string;
  role?: string | null;
  personType?: string | null;
  permissionProfile?: string | null;
  platformRole?: string | null;
  isDemo?: boolean;
  demoRootUserId?: string | null;
};

export type OrganizationTenantContext = {
  userId: string;
  organizationId: string;
  organization: {
    id: string;
    name: string;
    ownerUserId: string;
    kind: OrganizationKind;
    saasStatus: OrganizationSaasStatus;
    trialStartedAt: Date | null;
    trialEndsAt: Date | null;
    onboardingStep: number | null;
    onboardingCompletedAt: Date | null;
  };
  membership: {
    role: OrganizationMemberRole;
    status: string;
  } | null;
  isOwner: boolean;
  /** Statut SaaS effectif (trial expiré recalculé). */
  effectiveStatus: OrganizationSaasStatus;
  writeAccess: OrgWriteAccess;
  trialDaysRemaining: number | null;
  /** Présent uniquement pendant une SupportSession Platform Admin. */
  support?: {
    sessionId: string;
    mode: PlatformSupportMode;
    reason: string;
  } | null;
};

export class TenantAccessError extends Error {
  readonly code: "NO_ORG" | "FORBIDDEN" | "READ_ONLY" | "SUSPENDED";
  readonly status: number;

  constructor(code: TenantAccessError["code"], message: string, status = 403) {
    super(message);
    this.name = "TenantAccessError";
    this.code = code;
    this.status = status;
  }
}

/**
 * Résout l’organisation active de l’utilisateur (membership ou ownership).
 * Pour la démo : org du root démo si view-as / isDemo.
 * Platform Admin hors support → null (pas de tenant client implicite).
 */
export async function resolveActiveOrganizationId(
  user: TenantUserRef,
): Promise<string | null> {
  if (isPlatformAdminRole(user.platformRole)) {
    const support = await getActiveSupportSessionForAdmin(user.id);
    return support?.organizationId ?? null;
  }

  const effectiveUserId =
    user.isDemo && user.demoRootUserId ? user.demoRootUserId : user.id;

  const owned = await prisma.organization.findUnique({
    where: { ownerUserId: effectiveUserId },
    select: { id: true },
  });
  if (owned) return owned.id;

  const memberOrgs = await getUserOrganizationIds(user.id);
  if (memberOrgs.length > 0) return memberOrgs[0]!;

  // Owner CLIENT sans org encore matérialisée
  if (user.role === "CLIENT" || !user.role) {
    return ensureOrganizationForOwner(effectiveUserId);
  }
  return null;
}

/** Charge le contexte tenant complet — refuse si aucune organisation. */
export async function requireOrganizationContext(
  user: TenantUserRef,
): Promise<OrganizationTenantContext> {
  const support = isPlatformAdminRole(user.platformRole)
    ? await getActiveSupportSessionForAdmin(user.id)
    : null;

  const organizationId =
    support?.organizationId ?? (await resolveActiveOrganizationId(user));
  if (!organizationId) {
    throw new TenantAccessError(
      "NO_ORG",
      "Aucune entreprise BeWork associée à ce compte.",
      403,
    );
  }

  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      id: true,
      name: true,
      ownerUserId: true,
      kind: true,
      saasStatus: true,
      trialStartedAt: true,
      trialEndsAt: true,
      onboardingStep: true,
      onboardingCompletedAt: true,
    },
  });
  if (!organization) {
    throw new TenantAccessError("NO_ORG", "Organisation introuvable.", 404);
  }

  const membership = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: { organizationId, userId: user.id },
    },
    select: { role: true, status: true },
  });

  const isOwner =
    organization.ownerUserId === user.id ||
    organization.ownerUserId === user.demoRootUserId ||
    membership?.role === "OWNER";

  // Support Platform Admin : accès explicite sans membership
  if (support) {
    if (support.organizationId !== organizationId) {
      throw new TenantAccessError("FORBIDDEN", "Session support invalide.", 403);
    }
  } else if (!membership && !isOwner && user.role === "CLIENT") {
    throw new TenantAccessError(
      "FORBIDDEN",
      "Vous n’êtes pas membre de cette entreprise.",
      403,
    );
  }

  if (membership?.status === "SUSPENDED") {
    throw new TenantAccessError(
      "SUSPENDED",
      "Votre accès à cette entreprise est suspendu.",
      403,
    );
  }

  const effectiveStatus = effectiveSaasStatus(organization);
  let writeAccess = computeOrgWriteAccess(organization);
  if (support?.mode === "READ_ONLY") {
    writeAccess = {
      canWrite: false,
      canRead: true,
      reason:
        "Mode support BeWork — lecture seule. Passez en intervention pour modifier.",
    };
  }

  return {
    userId: user.id,
    organizationId,
    organization,
    membership: membership
      ? { role: membership.role, status: membership.status }
      : isOwner
        ? { role: "OWNER", status: "ACTIVE" }
        : support
          ? { role: "VIEWER", status: "ACTIVE" }
          : null,
    isOwner: support ? false : isOwner,
    effectiveStatus,
    writeAccess,
    trialDaysRemaining: daysRemainingInTrial(organization),
    support: support
      ? {
          sessionId: support.sessionId,
          mode: support.mode,
          reason: support.reason,
        }
      : null,
  };
}

/** Refuse si l’organisation n’autorise pas les écritures métier (trial expiré, etc.). */
export function assertOrgWritable(ctx: OrganizationTenantContext): void {
  if (!ctx.writeAccess.canWrite) {
    throw new TenantAccessError(
      "READ_ONLY",
      ctx.writeAccess.reason ??
        "Votre espace BeWork est en lecture seule. Activez votre abonnement pour continuer.",
      402,
    );
  }
}

/**
 * Vérifie qu’une ressource appartient bien à l’organisation courante.
 * Utiliser côté API / Server Actions avant toute mutation.
 */
export function assertSameOrganization(
  resourceOrganizationId: string | null | undefined,
  expectedOrganizationId: string,
  label = "ressource",
): void {
  if (!resourceOrganizationId || resourceOrganizationId !== expectedOrganizationId) {
    throw new TenantAccessError(
      "FORBIDDEN",
      `Accès refusé à cette ${label}.`,
      403,
    );
  }
}

/** Préfixe storage recommandé pour les nouveaux fichiers tenant. */
export function organizationStoragePrefix(organizationId: string): string {
  return `org/${organizationId}`;
}
