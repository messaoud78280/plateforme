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
