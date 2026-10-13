import { prisma } from "@/lib/prisma";
import {
  isBeworkCrossOrgStaff,
  isBeworkOperationalStaff,
} from "@/lib/authz";

type SessionUser = {
  id: string;
  role?: string | null;
  personType?: string | null;
  permissionProfile?: string | null;
};

async function staffIdentity(user: SessionUser): Promise<SessionUser> {
  if (user.personType !== undefined && user.permissionProfile !== undefined) {
    return user;
  }
  const row = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true, personType: true, permissionProfile: true },
  });
  if (!row) return user;
  return {
    id: user.id,
    role: row.role,
    personType: row.personType,
    permissionProfile: row.permissionProfile,
  };
}

export function isChantierStaff(role?: string | null) {
  return role === "AGENCE" || role === "MANAGER" || role === "AGENT";
}

/** Vérifie l'accès lecture/écriture au chantier (projet). */
export async function canAccessChantierProject(
  user: SessionUser,
  projectId: string | null | undefined,
) {
  if (!projectId) return { ok: false as const, project: null };
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, clientId: true, assignedToId: true, organizationId: true },
  });
  if (!project) return { ok: false as const, project: null };

  const identity = await staffIdentity(user);
  if (isBeworkCrossOrgStaff(identity)) {
    return { ok: true as const, project };
  }
  if (
    isBeworkOperationalStaff(identity) &&
    identity.role === "AGENT" &&
    project.assignedToId === user.id
  ) {
    return { ok: true as const, project };
  }
  if (user.role === "CLIENT" || identity.role === "CLIENT" || !isBeworkOperationalStaff(identity)) {
    const { canClientAccessProject } = await import("@/lib/organization/access");
    if (await canClientAccessProject(user.id, project)) {
      return { ok: true as const, project };
    }
  }
  return { ok: false as const, project: null };
}

/**
 * Droit de préparer / modifier le dossier chantier
 * (métré, planning, suivi, CR, notice, lots…).
 * Même périmètre que l’accès chantier : pas de filtre staff supplémentaire.
 */
export async function canModifyChantierProject(
  user: SessionUser,
  projectId: string | null | undefined,
) {
  return canAccessChantierProject(user, projectId);
}

/** Suppression du chantier : client propriétaire ou direction BeWork (pas les agents seuls). */
export function canDeleteChantierProject(
  user: SessionUser,
  project: { clientId: string }
): boolean {
  if (isBeworkCrossOrgStaff(user)) return true;
  if (project.clientId === user.id) return true;
  return false;
}

/**
 * Suppression d’une pièce du classeur : réservée au staff BeWork.
 * Le client peut déposer, pas effacer une preuve / livrable BeWork.
 */
export function canDeleteChantierFile(user: SessionUser): boolean {
  return isChantierStaff(user.role);
}

/** Changement de statut documentaire (VALIDE, A_RELANCER…) : staff uniquement. */
export function canUpdateChantierFileStatus(user: SessionUser): boolean {
  return isChantierStaff(user.role);
}
