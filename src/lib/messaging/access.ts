import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type MessagingUser = { id: string; role?: string | null };

export function isAgenceOrManager(role?: string | null): boolean {
  return role === "AGENCE" || role === "MANAGER";
}

/** Tâches visibles dans la messagerie missions (liste). */
export function taskMessagerieWhere(user: MessagingUser): Prisma.TaskWhereInput {
  if (user.role === "CLIENT") {
    return { clientId: user.id };
  }
  if (user.role === "AGENT") {
    return { assignedToId: user.id };
  }
  if (isAgenceOrManager(user.role)) {
    return {
      OR: [
        { assignedToId: user.id },
        {
          taskMessages: {
            some: {
              OR: [{ senderId: user.id }, { receiverId: user.id }],
            },
          },
        },
      ],
    };
  }
  return { id: { in: [] } };
}

/** Messages d'une mission visibles par l'utilisateur (filtre relation Prisma). */
export function taskMessageVisibilityRelationWhere(
  user: MessagingUser
): Prisma.TaskMessageWhereInput {
  if (user.role === "CLIENT") {
    return { isInternal: false };
  }
  if (user.role === "AGENT") {
    return {
      OR: [
        { isInternal: false },
        {
          isInternal: true,
          OR: [{ senderId: user.id }, { receiverId: user.id }],
        },
      ],
    };
  }
  return {
    OR: [{ senderId: user.id }, { receiverId: user.id }],
  };
}

/** Messages d'une mission visibles par l'utilisateur (requête directe). */
export function taskMessageVisibilityWhere(
  user: MessagingUser,
  taskId: string
): Prisma.TaskMessageWhereInput {
  return { taskId, ...taskMessageVisibilityRelationWhere(user) };
}

export async function canAccessTaskThread(
  user: MessagingUser,
  task: { id: string; clientId: string; assignedToId: string | null }
): Promise<boolean> {
  if (user.role === "CLIENT") return task.clientId === user.id;
  if (user.role === "AGENT") return task.assignedToId === user.id;

  if (isAgenceOrManager(user.role)) {
    if (task.assignedToId === user.id) return true;
    const count = await prisma.taskMessage.count({
      where: {
        taskId: task.id,
        OR: [{ senderId: user.id }, { receiverId: user.id }],
      },
    });
    return count > 0;
  }

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
  if (user.role === "AGENT") return project.assignedToId === user.id;

  if (isAgenceOrManager(user.role)) {
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
