import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  isBeworkCrossOrgStaff,
  isBeworkOperationalStaff,
} from "@/lib/authz";

export type MessagingUser = {
  id: string;
  role?: string | null;
  personType?: string | null;
  permissionProfile?: string | null;
};

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
  if (isBeworkCrossOrgStaff(user)) {
    return {};
  }
  if (user.role === "AGENT" && isBeworkOperationalStaff(user)) {
    return { assignedToId: user.id };
  }
  if (user.role === "CLIENT") {
    return { clientId: user.id };
  }
  return { clientId: user.id };
}

/** Messages d'une mission visibles par l'utilisateur (filtre relation Prisma). */
export function taskMessageVisibilityRelationWhere(
  user: MessagingUser
): Prisma.TaskMessageWhereInput {
  if (!isBeworkOperationalStaff(user)) {
    return { isInternal: false };
  }
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
  if (isBeworkCrossOrgStaff(user)) return true;
  if (user.role === "AGENT" && isBeworkOperationalStaff(user)) {
    return task.assignedToId === user.id;
  }
  return task.clientId === user.id;
}

export function projectMessageVisibilityWhere(userId: string): Prisma.MessageWhereInput {
  return {
    OR: [{ senderId: userId }, { receiverId: userId }],
  };
}

export async function canAccessProjectMessaging(
  user: MessagingUser,
  project: {
    id: string;
    clientId: string;
    assignedToId: string | null;
    organizationId?: string | null;
  }
): Promise<boolean> {
  if (user.role === "CLIENT") {
    const { canClientAccessProject } = await import("@/lib/organization/access");
    if (!(await canClientAccessProject(user.id, project))) return false;
    const { userHasProjectScope } = await import("@/lib/equipe-acces/project-access");
    return userHasProjectScope(user.id, project, "messages");
  }
  if (
    (user.role === "AGENT" || user.role === "AGENCE") &&
    isBeworkOperationalStaff(user)
  ) {
    return project.assignedToId === user.id;
  }

  if (isBeworkCrossOrgStaff(user) && isManagerRole(user.role)) {
    if (project.assignedToId === user.id) return true;
    const count = await prisma.message.count({
      where: {
        projectId: project.id,
        OR: [{ senderId: user.id }, { receiverId: user.id }],
      },
    });
    return count > 0;
  }

  const { canClientAccessProject } = await import("@/lib/organization/access");
  if (!(await canClientAccessProject(user.id, project))) return false;
  const { userHasProjectScope } = await import("@/lib/equipe-acces/project-access");
  return userHasProjectScope(user.id, project, "messages");
}

/** Charge personType et calcule les canaux visibles + filtre Message. */
export async function projectMessageChannelFilter(
  userId: string,
  role?: string | null
): Promise<{ personType: string | null; channels: string[]; where: Prisma.MessageWhereInput }> {
  const {
    visibleMessageChannels,
  } = await import("@/lib/equipe-acces/nav-by-persona");
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { personType: true },
  });
  const personType = dbUser?.personType ?? null;
  const channels = visibleMessageChannels(personType, role);
  return {
    personType,
    channels,
    where: {
      channel: { in: channels },
      OR: [{ senderId: userId }, { receiverId: userId }],
    },
  };
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
