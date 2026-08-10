import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessTaskThread } from "@/lib/messaging/access";
import {
  applyReactionToMap,
  getReactionsFromPayload,
  mergeReactionsIntoPayload,
  MESSAGE_REACTION_EMOJIS,
} from "@/lib/messagerie/message-reactions";
import { broadcastMessagerieToUser } from "@/lib/messagerie/broadcast";

type Kind = "DIRECT" | "TASK" | "PROJECT";

/**
 * POST /api/messages/react
 * Réactions via payloadJson (Direct / Task). Project : 501 jusqu’à migration.
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const messageKind = body.messageKind as Kind;
  const messageId = typeof body.messageId === "string" ? body.messageId : "";
  const emojiRaw = body.emoji;
  const emoji =
    emojiRaw === null || emojiRaw === undefined
      ? null
      : typeof emojiRaw === "string"
        ? emojiRaw.trim()
        : "";

  if (!messageId || !["DIRECT", "TASK", "PROJECT"].includes(messageKind)) {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
  }
  if (emoji !== null && !(MESSAGE_REACTION_EMOJIS as readonly string[]).includes(emoji)) {
    return NextResponse.json({ error: "Réaction non supportée" }, { status: 400 });
  }

  if (messageKind === "PROJECT") {
    return NextResponse.json(
      {
        error:
          "Réactions chantier (Message) nécessitent une colonne payloadJson — MESSAGERIE-V2D.",
      },
      { status: 501 },
    );
  }

  try {
    if (messageKind === "DIRECT") {
      const msg = await prisma.directMessage.findUnique({
        where: { id: messageId },
        select: {
          id: true,
          senderId: true,
          receiverId: true,
          payloadJson: true,
          content: true,
          createdAt: true,
        },
      });
      if (!msg) return NextResponse.json({ error: "Message introuvable" }, { status: 404 });

      if (msg.senderId !== session.user.id && msg.receiverId !== session.user.id) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
      }

      const map = applyReactionToMap(
        getReactionsFromPayload(msg.payloadJson),
        session.user.id,
        emoji,
      );
      const payloadJson = mergeReactionsIntoPayload(msg.payloadJson, map);
      const updated = await prisma.directMessage.update({
        where: { id: messageId },
        data: { payloadJson: payloadJson as object },
        select: { id: true, payloadJson: true },
      });

      const otherId = msg.senderId === session.user.id ? msg.receiverId : msg.senderId;
      void broadcastMessagerieToUser({
        receiverId: otherId,
        senderId: session.user.id,
        senderName: session.user.name ?? "Quelqu’un",
        title: "Réaction",
        preview: emoji ? `${emoji} sur un message` : "Réaction retirée",
        href: `/dashboard/messagerie?with=${session.user.id}`,
        at: new Date().toISOString(),
        kind: "DIRECT",
        conversationKey: `DIRECT:${otherId}`,
      });

      return NextResponse.json({
        id: updated.id,
        reactions: getReactionsFromPayload(updated.payloadJson),
      });
    }

    // TASK
    const msg = await prisma.taskMessage.findUnique({
      where: { id: messageId },
      select: {
        id: true,
        senderId: true,
        receiverId: true,
        isInternal: true,
        payloadJson: true,
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
    if (!msg) return NextResponse.json({ error: "Message introuvable" }, { status: 404 });

    const threadOk = await canAccessTaskThread(session.user, msg.task);
    if (!threadOk) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }
    if (msg.isInternal && session.user.role === "CLIENT") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const map = applyReactionToMap(
      getReactionsFromPayload(msg.payloadJson),
      session.user.id,
      emoji,
    );
    const payloadJson = mergeReactionsIntoPayload(msg.payloadJson, map);
    const updated = await prisma.taskMessage.update({
      where: { id: messageId },
      data: { payloadJson: payloadJson as object },
      select: { id: true, payloadJson: true },
    });

    const notifyIds = new Set(
      [msg.task.clientId, msg.task.assignedToId, msg.senderId, msg.receiverId].filter(
        Boolean,
      ) as string[],
    );
    notifyIds.delete(session.user.id);
    for (const rid of notifyIds) {
      if (msg.isInternal && rid === msg.task.clientId) continue;
      void broadcastMessagerieToUser({
        receiverId: rid,
        senderId: session.user.id,
        senderName: session.user.name ?? "Quelqu’un",
        title: msg.task.title,
        preview: emoji ? `${emoji} sur un message` : "Réaction retirée",
        href: `/dashboard/messagerie?task=${msg.taskId}&messageId=${messageId}`,
        at: new Date().toISOString(),
        kind: "TASK",
        conversationKey: `TASK:${msg.taskId}`,
      });
    }

    return NextResponse.json({
      id: updated.id,
      reactions: getReactionsFromPayload(updated.payloadJson),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erreur réaction" }, { status: 500 });
  }
}
