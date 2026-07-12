import { prisma } from "@/lib/prisma";

type SessionUser = { id: string; role?: string | null };

export function isChantierStaff(role?: string | null) {
  return role === "AGENCE" || role === "MANAGER" || role === "AGENT";
}

/** Vérifie l'accès lecture/écriture au chantier (projet). */
export async function canAccessChantierProject(user: SessionUser, projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { clientId: true, assignedToId: true },
  });
  if (!project) return { ok: false as const, project: null };

  if (user.role === "MANAGER" || user.role === "AGENCE") {
    return { ok: true as const, project };
  }
  if (user.role === "AGENT" && project.assignedToId === user.id) {
    return { ok: true as const, project };
  }
  if (project.clientId === user.id) {
    return { ok: true as const, project };
  }
  return { ok: false as const, project: null };
}

/** Suppression du chantier : client propriétaire ou direction BeWork (pas les agents seuls). */
export function canDeleteChantierProject(
  user: SessionUser,
  project: { clientId: string }
): boolean {
  if (user.role === "MANAGER" || user.role === "AGENCE") return true;
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
