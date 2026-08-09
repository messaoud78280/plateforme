import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  ensureOrganizationForOwner,
  getUserOrganizationIds,
} from "@/lib/organization/access";

export type EquipeAdminContext = {
  actorId: string;
  /** Propriétaire facturation / tenant (owner ou soi-même si owner). */
  ownerUserId: string;
  organizationId: string;
  isOwner: boolean;
};

/**
 * Admin « Équipe & partenaires » : propriétaire CLIENT ou membre org OWNER/ADMIN.
 */
export async function requireEquipeAdmin(): Promise<
  | { ok: true; ctx: EquipeAdminContext }
  | { ok: false; status: number; error: string }
> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { ok: false, status: 401, error: "Non autorisé" };
  }
  if (session.user.role !== "CLIENT") {
    return { ok: false, status: 403, error: "Réservé aux comptes entreprise" };
  }

  const actor = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      invitedById: true,
      teamRole: true,
      accessStatus: true,
      personType: true,
      permissionProfile: true,
    },
  });
  if (!actor) {
    return { ok: false, status: 401, error: "Non autorisé" };
  }
  if (actor.accessStatus === "SUSPENDED" || actor.accessStatus === "DISABLED") {
    return { ok: false, status: 403, error: "Compte suspendu ou désactivé" };
  }
  if (actor.personType && actor.personType !== "INTERNAL") {
    return { ok: false, status: 403, error: "Réservé aux administrateurs de l’entreprise" };
  }

  const ownerUserId = actor.invitedById ?? actor.id;
  const organizationId = await ensureOrganizationForOwner(ownerUserId);
  if (!organizationId) {
    return { ok: false, status: 403, error: "Organisation introuvable" };
  }

  const membership = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: { organizationId, userId: actor.id },
    },
    select: { role: true },
  });

  const isOwner = !actor.invitedById && actor.id === ownerUserId;
  const orgAdmin =
    membership?.role === "OWNER" || membership?.role === "ADMIN";
  const profileAdmin =
    actor.permissionProfile === "DIRECTION" ||
    actor.permissionProfile === "ADMINISTRATIF" ||
    (!actor.permissionProfile && (isOwner || actor.teamRole === "ADMIN"));

  // V2A : Direction / Administratif / owner org — pas Conducteur (même si teamRole SUPERVISEUR)
  if (!isOwner && !orgAdmin && !profileAdmin) {
    return {
      ok: false,
      status: 403,
      error: "Réservé aux administrateurs de l’entreprise",
    };
  }

  return {
    ok: true,
    ctx: {
      actorId: actor.id,
      ownerUserId,
      organizationId,
      isOwner,
    },
  };
}

/** Vérifie qu’un user cible appartient au tenant (invité ou membre org). */
export async function isUserInTenant(
  ctx: EquipeAdminContext,
  targetUserId: string
): Promise<boolean> {
  if (targetUserId === ctx.ownerUserId) return true;
  const target = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { invitedById: true },
  });
  if (target?.invitedById === ctx.ownerUserId) return true;
  const orgIds = await getUserOrganizationIds(targetUserId);
  return orgIds.includes(ctx.organizationId);
}

export function mapProfileToOrgRole(
  permissionProfile: string | null | undefined,
  personType: string | null | undefined
): "ADMIN" | "MEMBER" | "VIEWER" {
  if (personType && personType !== "INTERNAL") {
    return permissionProfile === "CLIENT" ? "MEMBER" : "VIEWER";
  }
  if (permissionProfile === "DIRECTION" || permissionProfile === "ADMINISTRATIF") {
    return "ADMIN";
  }
  return "MEMBER";
}

export function mapProfileToLegacyTeamRole(
  permissionProfile: string | null | undefined
): string {
  if (permissionProfile === "DIRECTION" || permissionProfile === "ADMINISTRATIF") {
    return "ADMIN";
  }
  if (permissionProfile === "CONDUCTEUR") return "SUPERVISEUR";
  return "USER";
}
