/**
 * DEMO-NOTIFICATIONS-CLEANUP-V1
 *
 * Nettoie uniquement les notifications / alertes Messagerie des DemoEnvironment
 * dont l’actionUrl est encore un deep-link générique (pré NOTIF-DEEPLINK-V1).
 *
 * INTERDIT hors DemoEnvironment. Pas de hot path UI.
 */

import { prisma } from "@/lib/prisma";
import {
  resolveMessageNotificationHref,
} from "@/lib/messagerie/resolve-conversation";

/** Href Messagerie sans conversation précise (liste ou tab générique). */
export function isGenericMessagerieHref(url: string | null | undefined): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (!trimmed.startsWith("/dashboard/messagerie")) return false;
  try {
    const u = new URL(trimmed, "https://bework.local");
    if (u.pathname !== "/dashboard/messagerie") return false;
    if (u.searchParams.get("with")) return false;
    if (u.searchParams.get("task")) return false;
    if (u.searchParams.get("channelId")) return false;
    // project + channel legacy = ciblé assez pour la démo
    if (u.searchParams.get("project") && u.searchParams.get("channel")) return false;
    return true;
  } catch {
    return (
      trimmed === "/dashboard/messagerie" ||
      trimmed.startsWith("/dashboard/messagerie?tab=messages-directs")
    );
  }
}

function parseDirectSenderName(message: string): string | null {
  const m = message.match(/^(.+?)\s+vous a envoyé un message direct\.?$/i);
  const name = m?.[1]?.trim();
  return name && name.length > 1 ? name : null;
}

function parseTaskTitleFromMessage(message: string): string | null {
  const m =
    message.match(/mission\s+«\s*(.+?)\s*»/i) ||
    message.match(/sur la mission\s+«\s*(.+?)\s*»/i);
  const title = m?.[1]?.trim();
  return title && title.length > 1 ? title : null;
}

function parseProjectTitleFromMessage(message: string): string | null {
  const m = message.match(/message sur\s+«\s*(.+?)\s*»/i);
  const title = m?.[1]?.trim();
  return title && title.length > 1 ? title : null;
}

async function demoUserIds(opts: {
  rootUserId: string;
  organizationId: string | null;
}): Promise<string[]> {
  const ids = new Set<string>([opts.rootUserId]);
  if (opts.organizationId) {
    const members = await prisma.organizationMember.findMany({
      where: { organizationId: opts.organizationId },
      select: { userId: true },
    });
    for (const m of members) ids.add(m.userId);
  }
  return [...ids];
}

export type CleanupMessagerieNotifHrefResult = {
  demoId: string;
  companyName: string;
  scanned: number;
  genericFound: number;
  rewritten: number;
  deleted: number;
  alertsDeleted: number;
  userCount: number;
};

/**
 * Réécrit ou purge les deep-links Messagerie génériques — DEMO ONLY.
 */
export async function cleanupDemoMessagerieNotificationHrefs(
  demoId: string,
): Promise<CleanupMessagerieNotifHrefResult | null> {
  const demo = await prisma.demoEnvironment.findUnique({
    where: { id: demoId },
    select: {
      id: true,
      companyName: true,
      rootUserId: true,
      organizationId: true,
      status: true,
    },
  });
  if (!demo) return null;

  const userIds = await demoUserIds({
    rootUserId: demo.rootUserId,
    organizationId: demo.organizationId,
  });

  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true },
  });
  const nameToIds = new Map<string, string[]>();
  for (const u of users) {
    const key = (u.name ?? "").trim().toLowerCase();
    if (!key) continue;
    const list = nameToIds.get(key) ?? [];
    list.push(u.id);
    nameToIds.set(key, list);
  }

  const notifications = await prisma.notification.findMany({
    where: {
      userId: { in: userIds },
      OR: [
        { type: "MESSAGE_RECEIVED" },
        { actionUrl: { startsWith: "/dashboard/messagerie" } },
        { title: { contains: "message", mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      userId: true,
      type: true,
      title: true,
      message: true,
      actionUrl: true,
    },
  });

  let rewritten = 0;
  let deleted = 0;
  let genericFound = 0;
  const idsToDelete: string[] = [];

  for (const n of notifications) {
    if (!isGenericMessagerieHref(n.actionUrl)) continue;
    genericFound += 1;

    let nextHref: string | null = null;

    // DIRECT — résolu uniquement si le libellé nomme un membre DEMO unique
    const senderName = parseDirectSenderName(n.message);
    if (senderName) {
      const matches = nameToIds.get(senderName.toLowerCase()) ?? [];
      if (matches.length === 1) {
        const peerId = matches[0]!;
        if (peerId !== n.userId) {
          const latest = await prisma.directMessage.findFirst({
            where: {
              OR: [
                { senderId: peerId, receiverId: n.userId },
                { senderId: n.userId, receiverId: peerId },
              ],
            },
            orderBy: { createdAt: "desc" },
            select: { id: true, senderId: true, receiverId: true },
          });
          nextHref = resolveMessageNotificationHref({
            sourceType: "DIRECT",
            senderId: latest?.senderId ?? peerId,
            receiverId: latest?.receiverId ?? n.userId,
            notifyUserId: n.userId,
            messageId: latest?.id,
          });
        }
      }
    }

    // TASK — titre mission exact unique dans le périmètre DEMO
    if (!nextHref) {
      const taskTitle = parseTaskTitleFromMessage(n.message);
      if (taskTitle) {
        const tasks = await prisma.task.findMany({
          where: {
            title: taskTitle,
            OR: [
              { clientId: { in: userIds } },
              { assignedToId: { in: userIds } },
              ...(demo.organizationId
                ? [{ project: { organizationId: demo.organizationId } }]
                : []),
            ],
          },
          select: { id: true },
          take: 2,
        });
        if (tasks.length === 1) {
          nextHref = resolveMessageNotificationHref({
            sourceType: "TASK",
            taskId: tasks[0]!.id,
          });
        }
      }
    }

    if (nextHref && !isGenericMessagerieHref(nextHref)) {
      await prisma.notification.update({
        where: { id: n.id },
        data: { actionUrl: nextHref },
      });
      rewritten += 1;
    } else {
      // Démo commerciale : supprimer plutôt que laisser un lien liste trompeur
      idsToDelete.push(n.id);
    }
  }

  if (idsToDelete.length > 0) {
    deleted = (
      await prisma.notification.deleteMany({ where: { id: { in: idsToDelete } } })
    ).count;
  }

  // Alertes chantier avec href générique → même politique (pas d’invention de channel)
  const alerts = await prisma.alert.findMany({
    where: {
      clientId: { in: userIds },
      actionUrl: { startsWith: "/dashboard/messagerie" },
    },
    select: { id: true, actionUrl: true, message: true, title: true },
  });

  const alertIdsToDelete: string[] = [];
  for (const a of alerts) {
    if (!isGenericMessagerieHref(a.actionUrl)) continue;
    genericFound += 1;

    let nextHref: string | null = null;
    const projectTitle = parseProjectTitleFromMessage(a.message);
    if (projectTitle && demo.organizationId) {
      const projects = await prisma.project.findMany({
        where: {
          organizationId: demo.organizationId,
          title: projectTitle,
        },
        select: { id: true },
        take: 2,
      });
      if (projects.length === 1) {
        const channels = await prisma.projectChannel.findMany({
          where: { projectId: projects[0]!.id },
          select: { id: true },
          take: 2,
        });
        // Un seul canal → sûr ; sinon ne pas inventer Point.P vs Client
        if (channels.length === 1) {
          nextHref = resolveMessageNotificationHref({
            sourceType: "PROJECT_CHANNEL",
            projectId: projects[0]!.id,
            channelId: channels[0]!.id,
          });
        }
      }
    }

    if (nextHref && !isGenericMessagerieHref(nextHref)) {
      await prisma.alert.update({
        where: { id: a.id },
        data: { actionUrl: nextHref },
      });
      rewritten += 1;
    } else {
      alertIdsToDelete.push(a.id);
    }
  }

  let alertsDeleted = 0;
  if (alertIdsToDelete.length > 0) {
    alertsDeleted = (
      await prisma.alert.deleteMany({ where: { id: { in: alertIdsToDelete } } })
    ).count;
    deleted += alertsDeleted;
  }

  return {
    demoId: demo.id,
    companyName: demo.companyName,
    scanned: notifications.length + alerts.length,
    genericFound,
    rewritten,
    deleted,
    alertsDeleted,
    userCount: userIds.length,
  };
}

/** Tous les environnements DEMO non archivés. */
export async function cleanupAllDemoMessagerieNotificationHrefs(): Promise<
  CleanupMessagerieNotifHrefResult[]
> {
  const demos = await prisma.demoEnvironment.findMany({
    where: { status: { not: "ARCHIVED" } },
    select: { id: true },
  });
  const results: CleanupMessagerieNotifHrefResult[] = [];
  for (const d of demos) {
    const r = await cleanupDemoMessagerieNotificationHrefs(d.id);
    if (r) results.push(r);
  }
  return results;
}
