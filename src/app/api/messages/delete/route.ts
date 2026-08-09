import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  canAccessProjectMessaging,
  canAccessTaskThread,
} from "@/lib/messaging/access";
import { broadcastMessagerieToUser } from "@/lib/messagerie/broadcast";
import type { MessageDeleteKind, MessageDeleteMode } from "@/lib/messagerie/message-delete";

type Body = {
  messageKind?: MessageDeleteKind;
  messageId?: string;
  messageIds?: string[];
  mode?: MessageDeleteMode;
};

/**
 * POST /api/messages/delete
 * mode=me → MessageUserHide (persistant, cet utilisateur)
 * mode=everyone → soft-delete (auteur uniquement, re-check serveur)
 * Ne purge pas Storage ni Action BeWork (sourceMessage* conservés).
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as Body;
  const messageKind = body.messageKind;
  const mode = body.mode;
  const ids = Array.isArray(body.messageIds)
    ? body.messageIds.filter((id) => typeof id === "string" && id.trim())
    : typeof body.messageId === "string" && body.messageId.trim()
      ? [body.messageId.trim()]
      : [];

  if (!messageKind || !["DIRECT", "TASK", "PROJECT"].includes(messageKind)) {
    return NextResponse.json({ error: "Type de message invalide" }, { status: 400 });
  }
  if (!mode || !["me", "everyone"].includes(mode)) {
    return NextResponse.json({ error: "Mode invalide" }, { status: 400 });
  }
  if (ids.length === 0 || ids.length > 40) {
    return NextResponse.json({ error: "Sélection invalide" }, { status: 400 });
  }

  const results: {
    id: string;
    mode: MessageDeleteMode;
    deletedAt?: string | null;
    deletedById?: string | null;
  }[] = [];

  try {
    for (const messageId of ids) {
      if (mode === "me") {
        const ok = await assertCanAccessMessage(session.user, messageKind, messageId);
        if (!ok) {
          return NextResponse.json(
            { error: "Vous n’avez pas accès à ce message", messageId },
            { status: 403 },
          );
        }
        await prisma.messageUserHide.upsert({
          where: {
            userId_messageKind_messageId: {
              userId: session.user.id,
              messageKind,
              messageId,
            },
          },
          create: {
            userId: session.user.id,
            messageKind,
            messageId,
          },
          update: {},
        });
        results.push({ id: messageId, mode: "me" });
        continue;
      }

      // everyone — auteur uniquement
      const soft = await softDeleteEveryone(session.user, messageKind, messageId);
      if (!soft.ok) {
        return NextResponse.json(
          { error: soft.error, messageId },
          { status: soft.status },
        );
      }
      results.push({
        id: messageId,
        mode: "everyone",
        deletedAt: soft.deletedAt,
        deletedById: soft.deletedById,
      });
      for (const rid of soft.notifyIds) {
        void broadcastMessagerieToUser({
          receiverId: rid,
          senderId: session.user.id,
          senderName: session.user.name ?? "Quelqu’un",
          title: soft.title,
          preview: "Message supprimé",
          href: soft.href,
          at: soft.deletedAt,
          kind: messageKind,
          conversationKey: soft.conversationKey,
          op: "deleted_everyone",
          messageId,
        });
      }
    }

    return NextResponse.json({ ok: true, results });
  } catch (e) {
    console.error("[messages/delete]", e);
    return NextResponse.json({ error: "Impossible de supprimer le message" }, { status: 500 });
  }
}

async function assertCanAccessMessage(
  user: { id: string; role?: string | null },
  kind: MessageDeleteKind,
  messageId: string,
): Promise<boolean> {
  if (kind === "DIRECT") {
    const msg = await prisma.directMessage.findUnique({
      where: { id: messageId },
      select: { senderId: true, receiverId: true },
    });
    if (!msg) return false;
    return msg.senderId === user.id || msg.receiverId === user.id;
  }
  if (kind === "TASK") {
    const msg = await prisma.taskMessage.findUnique({
      where: { id: messageId },
      select: {
        isInternal: true,
        task: { select: { id: true, clientId: true, assignedToId: true } },
      },
    });
    if (!msg) return false;
    const threadOk = await canAccessTaskThread(user, msg.task);
    if (!threadOk) return false;
    if (msg.isInternal && user.role === "CLIENT") return false;
    return true;
  }
  const msg = await prisma.message.findUnique({
    where: { id: messageId },
    select: {
      project: {
        select: { id: true, clientId: true, assignedToId: true, organizationId: true },
      },
    },
  });
  if (!msg) return false;
  return canAccessProjectMessaging(user, msg.project);
}

async function softDeleteEveryone(
  user: { id: string; role?: string | null; name?: string | null },
  kind: MessageDeleteKind,
  messageId: string,
): Promise<
  | {
      ok: true;
      deletedAt: string;
      deletedById: string;
      notifyIds: string[];
      title: string;
      href: string;
      conversationKey: string;
    }
  | { ok: false; error: string; status: number }
> {
  const now = new Date();

  if (kind === "DIRECT") {
    const msg = await prisma.directMessage.findUnique({
      where: { id: messageId },
      select: { id: true, senderId: true, receiverId: true, deletedAt: true },
    });
    if (!msg) return { ok: false, error: "Message introuvable", status: 404 };
    if (msg.senderId !== user.id) {
      return { ok: false, error: "Seul l’auteur peut supprimer pour tous", status: 403 };
    }
    if (!msg.deletedAt) {
      await prisma.directMessage.update({
        where: { id: messageId },
        data: { deletedAt: now, deletedById: user.id },
      });
    }
    const other = msg.receiverId === user.id ? msg.senderId : msg.receiverId;
    return {
      ok: true,
      deletedAt: now.toISOString(),
      deletedById: user.id,
      notifyIds: [other],
      title: "Message direct",
      href: `/dashboard/messagerie?tab=messages-directs&with=${user.id}`,
      conversationKey: `DIRECT:${other}`,
    };
  }

  if (kind === "TASK") {
    const msg = await prisma.taskMessage.findUnique({
      where: { id: messageId },
      select: {
        id: true,
        senderId: true,
        receiverId: true,
        deletedAt: true,
        isInternal: true,
        taskId: true,
        task: {
          select: {
            id: true,
            title: true,
            clientId: true,
            assignedToId: true,
          },
        },
      },
    });
    if (!msg) return { ok: false, error: "Message introuvable", status: 404 };
    if (msg.senderId !== user.id) {
      return { ok: false, error: "Seul l’auteur peut supprimer pour tous", status: 403 };
    }
    const threadOk = await canAccessTaskThread(user, msg.task);
    if (!threadOk) return { ok: false, error: "Non autorisé", status: 403 };

    if (!msg.deletedAt) {
      await prisma.taskMessage.update({
        where: { id: messageId },
        data: { deletedAt: now, deletedById: user.id },
      });
    }

    const notifyIds = new Set(
      [msg.task.clientId, msg.task.assignedToId, msg.senderId, msg.receiverId].filter(
        Boolean,
      ) as string[],
    );
    notifyIds.delete(user.id);
    if (msg.isInternal) notifyIds.delete(msg.task.clientId);

    return {
      ok: true,
      deletedAt: now.toISOString(),
      deletedById: user.id,
      notifyIds: [...notifyIds],
      title: msg.task.title,
      href: `/dashboard/messagerie?task=${msg.taskId}&messageId=${messageId}`,
      conversationKey: `TASK:${msg.taskId}`,
    };
  }

  // PROJECT
  const msg = await prisma.message.findUnique({
    where: { id: messageId },
    select: {
      id: true,
      senderId: true,
      receiverId: true,
      deletedAt: true,
      projectId: true,
      channel: true,
      project: {
        select: {
          id: true,
          title: true,
          clientId: true,
          assignedToId: true,
          organizationId: true,
        },
      },
    },
  });
  if (!msg) return { ok: false, error: "Message introuvable", status: 404 };
  if (msg.senderId !== user.id) {
    return { ok: false, error: "Seul l’auteur peut supprimer pour tous", status: 403 };
  }
  const projectOk = await canAccessProjectMessaging(user, msg.project);
  if (!projectOk) return { ok: false, error: "Non autorisé", status: 403 };

  if (!msg.deletedAt) {
    await prisma.message.update({
      where: { id: messageId },
      data: { deletedAt: now, deletedById: user.id },
    });
  }

  const notifyIds = new Set(
    [msg.receiverId, msg.project.clientId, msg.project.assignedToId].filter(
      Boolean,
    ) as string[],
  );
  notifyIds.delete(user.id);

  return {
    ok: true,
    deletedAt: now.toISOString(),
    deletedById: user.id,
    notifyIds: [...notifyIds],
    title: msg.project.title,
    href: `/dashboard/messagerie?view=chantiers&project=${msg.projectId}&channel=${msg.channel}`,
    conversationKey: `PROJECT:${msg.projectId}:${msg.channel}`,
  };
}
