import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type MessagingUser = { id: string; role?: string | null };

export function isManagerRole(role?: string | null): boolean {
  return role === "MANAGER";
}

/** Agent opérationnel (assistante / équipe terrain) — pas le gérant. */
export function isStaffAgent(role?: string | null): boolean {
  return role === "AGENT" || role === "AGENCE";
}

/** Uniquement les messages dont l'utilisateur est expéditeur ou destinataire. */
export function participantTaskMessageWhere(userId: string): Prisma.TaskMessageWhereInput {
  return {
    OR: [{ senderId: userId }, { receiverId: userId }],
  };
}

/** Tâches visibles dans la messagerie missions (liste). */
export function taskMessagerieWhere(user: MessagingUser): Prisma.TaskWhereInput {
  if (user.role === "CLIENT") {
    return { clientId: user.id };
  }
  if (user.role === "AGENT") {
    return { assignedToId: user.id };
  }
  // MANAGER + AGENCE : vue entreprise (pas seulement les fils où ils ont déjà écrit)
  if (isManagerRole(user.role) || user.role === "AGENCE") {
    return {};
  }
  return { id: { in: [] } };
}

/** Messages d'une mission visibles par l'utilisateur (filtre relation Prisma). */
export function taskMessageVisibilityRelationWhere(
  user: MessagingUser
): Prisma.TaskMessageWhereInput {
  if (user.role === "CLIENT") {
    return {
      isInternal: false,
      ...participantTaskMessageWhere(user.id),
    };
  }
  // Gérant / Agence / Agent : fil complet une fois l’accès mission validé
  // (sinon le gérant voit la mission mais une conversation vide).
  return {};
}

/** Messages d'une mission visibles par l'utilisateur (requête directe). */
export function taskMessageVisibilityWhere(
  user: MessagingUser,
  taskId: string
): Prisma.TaskMessageWhereInput {
  const visibility = taskMessageVisibilityRelationWhere(user);
  return Object.keys(visibility).length === 0
    ? { taskId }
    : { taskId, ...visibility };
}

export async function canAccessTaskThread(
  user: MessagingUser,
  task: { id: string; clientId: string; assignedToId: string | null }
): Promise<boolean> {
  if (user.role === "CLIENT") return task.clientId === user.id;
  // Gérant et agence : accès à toutes les missions (aligné GET /api/tasks/[id] isAgence)
  if (isManagerRole(user.role) || user.role === "AGENCE") return true;
  if (user.role === "AGENT") return task.assignedToId === user.id;
  return false;
}

export function projectMessageVisibilityWhere(userId: string): Prisma.MessageWhereInput {
  return {
    OR: [{ senderId: userId }, { receiverId: userId }],
  };
}

export async function canAccessProjectMessaging(
  user: MessagingUser,
  project: { id: string; clientId: string; assignedToId: string | null }
): Promise<boolean> {
  if (user.role === "CLIENT") return project.clientId === user.id;
  if (isStaffAgent(user.role)) return project.assignedToId === user.id;

  if (isManagerRole(user.role)) {
    if (project.assignedToId === user.id) return true;
    const count = await prisma.message.count({
      where: {
        projectId: project.id,
        OR: [{ senderId: user.id }, { receiverId: user.id }],
      },
    });
    return count > 0;
  }

  return false;
}

/** Filtre strict : l'utilisateur doit être expéditeur ou destinataire. */
export function directMessageParticipantWhere(userId: string) {
  return {
    OR: [{ senderId: userId }, { receiverId: userId }],
  };
}

/** Fil d'une conversation 1:1 (les deux participants). */
export function directMessageThreadWhere(userId: string, otherUserId: string) {
  return {
    OR: [
      { senderId: userId, receiverId: otherUserId },
      { senderId: otherUserId, receiverId: userId },
    ],
  };
}
