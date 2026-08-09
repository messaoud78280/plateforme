import { prisma } from "@/lib/prisma";

/** Profils capables de gérer Utilisateurs & accès. */
export const EQUIPE_ADMIN_PROFILES = ["DIRECTION", "ADMINISTRATIF"] as const;

export function isEquipeAdminProfile(permissionProfile: string | null | undefined): boolean {
  return (
    !permissionProfile ||
    EQUIPE_ADMIN_PROFILES.includes(
      permissionProfile as (typeof EQUIPE_ADMIN_PROFILES)[number],
    )
  );
}

/**
 * Compte les administrateurs actifs du tenant (Direction / Administratif).
 * Le propriétaire compte toujours.
 */
export async function countActiveEquipeAdmins(opts: {
  ownerUserId: string;
  organizationId: string;
}): Promise<number> {
  const users = await prisma.user.findMany({
    where: {
      accessStatus: "ACTIVE",
      OR: [
        { id: opts.ownerUserId },
        { invitedById: opts.ownerUserId },
        {
          organizationMemberships: {
            some: { organizationId: opts.organizationId },
          },
        },
      ],
    },
    select: {
      id: true,
      permissionProfile: true,
      personType: true,
      invitedById: true,
    },
  });

  return users.filter((u) => {
    if (u.id === opts.ownerUserId) return true;
    if (u.personType && u.personType !== "INTERNAL") return false;
    return (
      u.permissionProfile === "DIRECTION" || u.permissionProfile === "ADMINISTRATIF"
    );
  }).length;
}

/** Empêche de se retrouver sans admin capable de gérer les accès. */
export async function wouldRemoveLastEquipeAdmin(opts: {
  ownerUserId: string;
  organizationId: string;
  targetUserId: string;
  nextAccessStatus?: string | null;
  nextPermissionProfile?: string | null;
}): Promise<boolean> {
  if (opts.targetUserId === opts.ownerUserId) {
    // propriétaire déjà protégé ailleurs
    return false;
  }

  const target = await prisma.user.findUnique({
    where: { id: opts.targetUserId },
    select: {
      accessStatus: true,
      permissionProfile: true,
      personType: true,
    },
  });
  if (!target) return false;
  if (target.personType && target.personType !== "INTERNAL") return false;

  const wasAdmin =
    target.accessStatus === "ACTIVE" &&
    (target.permissionProfile === "DIRECTION" ||
      target.permissionProfile === "ADMINISTRATIF");
  if (!wasAdmin) return false;

  const nextStatus = opts.nextAccessStatus ?? target.accessStatus;
  const nextProfile = opts.nextPermissionProfile ?? target.permissionProfile;
  const stillAdmin =
    nextStatus === "ACTIVE" &&
    (nextProfile === "DIRECTION" || nextProfile === "ADMINISTRATIF");
  if (stillAdmin) return false;

  const count = await countActiveEquipeAdmins({
    ownerUserId: opts.ownerUserId,
    organizationId: opts.organizationId,
  });
  return count <= 1;
}
