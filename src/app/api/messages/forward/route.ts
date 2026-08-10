import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  canAccessProjectMessaging,
  canAccessTaskThread,
  isManagerRole,
  isStaffAgent,
} from "@/lib/messaging/access";
import {
  canForwardAttachments,
  evaluateForwardSafety,
  scopeFromChannel,
  scopeFromTaskInternal,
  type ForwardScope,
} from "@/lib/messagerie/forward-safety";
import { formatMediaPreview, type MsgAttachment } from "@/lib/messagerie/media-preview";
import { createNotification } from "@/lib/notifications";
import { broadcastMessagerieToUser } from "@/lib/messagerie/broadcast";
import { ttlInvalidatePrefix } from "@/lib/perf/ttl-cache";
import {
  canPostToMessageChannel,
  defaultMessageChannelForPerson,
  type MessageChannel,
} from "@/lib/equipe-acces/nav-by-persona";
import { resolveMessageNotificationHref } from "@/lib/messagerie/resolve-conversation";
type Kind = "DIRECT" | "TASK" | "PROJECT";

type SourcePayload = {
  content: string;
  attachments: MsgAttachment[];
  scope: ForwardScope;
  senderName: string;
};

async function loadSource(
  user: { id: string; role?: string | null },
  kind: Kind,
  id: string,
): Promise<SourcePayload | { error: string; status: number }> {
  if (kind === "DIRECT") {
    const m = await prisma.directMessage.findUnique({
      where: { id },
      include: { sender: { select: { name: true } } },
    });
    if (!m) return { error: "Message source introuvable", status: 404 };
    if (m.senderId !== user.id && m.receiverId !== user.id) {
      return { error: "Non autorisé à lire ce message", status: 403 };
    }
    return {
      content: m.content || "",
      attachments: Array.isArray(m.attachmentsJson)
        ? (m.attachmentsJson as MsgAttachment[])
        : [],
      scope: "INTERNAL",
      senderName: m.sender.name,
    };
  }

  if (kind === "TASK") {
    const m = await prisma.taskMessage.findUnique({
      where: { id },
      include: {
        sender: { select: { name: true } },
        task: { select: { id: true, clientId: true, assignedToId: true } },
      },
    });
    if (!m) return { error: "Message source introuvable", status: 404 };
    const ok = await canAccessTaskThread(user, m.task);
    if (!ok) return { error: "Non autorisé à lire ce message", status: 403 };
    if (m.isInternal && user.role === "CLIENT") {
      return { error: "Non autorisé à lire ce message", status: 403 };
    }
    return {
      content: m.content || "",
      attachments: Array.isArray(m.attachmentsJson)
        ? (m.attachmentsJson as MsgAttachment[])
        : [],
      scope: scopeFromTaskInternal(m.isInternal),
      senderName: m.sender.name,
    };
  }

  const m = await prisma.message.findUnique({
    where: { id },
    include: {
      sender: { select: { name: true } },
      project: { select: { id: true, clientId: true, assignedToId: true } },
    },
  });
  if (!m) return { error: "Message source introuvable", status: 404 };
  const ok = await canAccessProjectMessaging(user, m.project);
  if (!ok) return { error: "Non autorisé à lire ce message", status: 403 };
  return {
    content: m.content || "",
    attachments: Array.isArray(m.attachmentsJson)
      ? (m.attachmentsJson as MsgAttachment[])
      : [],
    scope: scopeFromChannel(m.channel),
    senderName: m.sender.name,
  };
}

/**
 * POST /api/messages/forward
 * Crée un nouveau message (texte + PJ si ACL OK). Pas de signed URL permanente.
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const sourceKind = body.sourceKind as Kind;
  const sourceMessageId = typeof body.sourceMessageId === "string" ? body.sourceMessageId : "";
  const destKind = body.destKind as Kind;
  const destId = typeof body.destId === "string" ? body.destId : "";
  const confirmExternal = Boolean(body.confirmExternal);
  const destChannel =
    typeof body.channel === "string" ? (body.channel as MessageChannel) : null;

  if (
    !sourceMessageId ||
    !destId ||
    !["DIRECT", "TASK", "PROJECT"].includes(sourceKind) ||
    !["DIRECT", "TASK", "PROJECT"].includes(destKind)
  ) {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
  }

  const source = await loadSource(session.user, sourceKind, sourceMessageId);
  if ("error" in source) {
    return NextResponse.json({ error: source.error }, { status: source.status });
  }

  let destScope: ForwardScope = "INTERNAL";
  let forwardBody = source.content;
  if (!forwardBody.trim() && source.attachments.length) {
    forwardBody = formatMediaPreview("", source.attachments) || "Pièce jointe";
  }
  forwardBody = `↪ Transféré\n${forwardBody}`;

  try {
    if (destKind === "DIRECT") {
      destScope = "INTERNAL";
      const safety = evaluateForwardSafety(source.scope, destScope);
      if (safety.ok && safety.needsConfirm && !confirmExternal) {
        return NextResponse.json(
          { error: safety.warning, needsConfirm: true },
          { status: 409 },
        );
      }

      if (destId === session.user.id) {
        return NextResponse.json({ error: "Destinataire invalide" }, { status: 400 });
      }
      const receiver = await prisma.user.findFirst({
        where: {
          id: destId,
          role: { in: ["AGENCE", "AGENT", "MANAGER", "CLIENT"] },
        },
      });
      if (!receiver) {
        return NextResponse.json({ error: "Destinataire introuvable" }, { status: 404 });
      }

      const attPolicy = canForwardAttachments({
        sourceScope: source.scope,
        destScope,
        hasAttachments: source.attachments.length > 0,
      });
      const atts = attPolicy.include ? source.attachments : [];

      const message = await prisma.directMessage.create({
        data: {
          senderId: session.user.id,
          receiverId: destId,
          content: forwardBody,
          attachmentsJson: atts.length ? atts : undefined,
          payloadJson: {
            forwardedFrom: {
              kind: sourceKind,
              id: sourceMessageId,
              senderName: source.senderName,
            },
          },
        },
        include: {
          sender: { select: { id: true, name: true } },
          receiver: { select: { id: true, name: true } },
        },
      });

      const href = resolveMessageNotificationHref({
        sourceType: "DIRECT",
        senderId: session.user.id,
        receiverId: destId,
        notifyUserId: destId,
        messageId: message.id,
      });

      await createNotification({
        userId: destId,
        type: "MESSAGE_RECEIVED",
        title: "Message transféré",
        message: `${session.user.name ?? "Quelqu’un"} vous a transféré un message.`,
        actionUrl: href,
      });
      ttlInvalidatePrefix(`msg-unread:${destId}`);
      void broadcastMessagerieToUser({
        receiverId: destId,
        senderId: session.user.id,
        senderName: session.user.name ?? "Quelqu’un",
        title: session.user.name ?? "Message",
        preview: formatMediaPreview(message.content, atts),
        href,
        at: message.createdAt.toISOString(),
        kind: "DIRECT",
        conversationKey: `DIRECT:${session.user.id}`,
      });

      return NextResponse.json({
        message,
        attachmentsOmitted: !attPolicy.include,
        omitReason: attPolicy.reason,
      });
    }

    if (destKind === "TASK") {
      const task = await prisma.task.findUnique({
        where: { id: destId },
        select: {
          id: true,
          title: true,
          clientId: true,
          assignedToId: true,
          category: true,
        },
      });
      if (!task) return NextResponse.json({ error: "Mission introuvable" }, { status: 404 });
      const ok = await canAccessTaskThread(session.user, task);
      if (!ok) return NextResponse.json({ error: "Écriture non autorisée" }, { status: 403 });

      const isInternalNote = false;
      destScope = scopeFromTaskInternal(isInternalNote);
      // Heuristique externe si mission fournisseur / client
      const title = (task.title || "").toLowerCase();
      const cat = (task.category || "").toLowerCase();
      if (
        cat.includes("fournisseur") ||
        cat.includes("bon de commande") ||
        title.includes("point.p")
      ) {
        destScope = "EXTERNAL";
      } else if (session.user.role !== "CLIENT" && task.clientId !== session.user.id) {
        // fil client de la mission = externe côté périmètre message
        destScope = "EXTERNAL";
      }

      const safety = evaluateForwardSafety(source.scope, destScope, {
        destLabel: task.title || undefined,
      });
      if (safety.ok && safety.needsConfirm && !confirmExternal) {
        return NextResponse.json(
          { error: safety.warning, needsConfirm: true },
          { status: 409 },
        );
      }
      if (!safety.ok) {
        return NextResponse.json({ error: safety.error }, { status: 403 });
      }

      const receiverId =
        session.user.id === task.clientId
          ? task.assignedToId
          : task.clientId;
      if (!receiverId) {
        return NextResponse.json(
          { error: "Aucun destinataire sur cette mission" },
          { status: 400 },
        );
      }

      const attPolicy = canForwardAttachments({
        sourceScope: source.scope,
        destScope,
        hasAttachments: source.attachments.length > 0,
      });
      const atts = attPolicy.include ? source.attachments : [];

      const message = await prisma.taskMessage.create({
        data: {
          taskId: task.id,
          senderId: session.user.id,
          receiverId,
          content: forwardBody,
          isInternal: false,
          attachmentsJson: atts.length ? atts : undefined,
          payloadJson: {
            forwardedFrom: {
              kind: sourceKind,
              id: sourceMessageId,
              senderName: source.senderName,
            },
          },
        },
        include: {
          sender: { select: { id: true, name: true } },
          receiver: { select: { id: true, name: true } },
        },
      });

      const href = resolveMessageNotificationHref({
        sourceType: "TASK",
        taskId: task.id,
        messageId: message.id,
      });

      await createNotification({
        userId: receiverId,
        type: "MESSAGE_RECEIVED",
        title: "Message transféré",
        message: `Message transféré sur « ${task.title} ».`,
        actionUrl: href,
      });
      ttlInvalidatePrefix(`msg-unread:${receiverId}`);
      void broadcastMessagerieToUser({
        receiverId,
        senderId: session.user.id,
        senderName: session.user.name ?? "Quelqu’un",
        title: task.title,
        preview: formatMediaPreview(message.content, atts),
        href,
        at: message.createdAt.toISOString(),
        kind: "TASK",
        conversationKey: `TASK:${task.id}`,
      });

      return NextResponse.json({
        message,
        attachmentsOmitted: !attPolicy.include,
        omitReason: attPolicy.reason,
      });
    }

    // PROJECT
    const project = await prisma.project.findUnique({
      where: { id: destId },
      include: { assignedTo: { select: { id: true } } },
    });
    if (!project) return NextResponse.json({ error: "Chantier introuvable" }, { status: 404 });
    const canMsg = await canAccessProjectMessaging(session.user, project);
    if (!canMsg) return NextResponse.json({ error: "Écriture non autorisée" }, { status: 403 });

    const sender = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { personType: true },
    });
    const channel: MessageChannel =
      destChannel && ["INTERNE", "CLIENT", "FOURNISSEUR"].includes(destChannel)
        ? destChannel
        : defaultMessageChannelForPerson(sender?.personType ?? null);

    if (!canPostToMessageChannel(sender?.personType ?? null, session.user.role, channel)) {
      return NextResponse.json({ error: "Canal non autorisé" }, { status: 403 });
    }

    destScope = scopeFromChannel(channel);
    let destLabel = project.title;
    if (channel === "CLIENT" || channel === "FOURNISSEUR") {
      const orgCh = await prisma.projectChannel.findFirst({
        where: {
          projectId: project.id,
          type: channel === "CLIENT" ? "CLIENT" : "SUPPLIER",
        },
        include: {
          externalOrganization: { select: { name: true, tradeName: true } },
        },
      });
      destLabel =
        orgCh?.externalOrganization?.tradeName ||
        orgCh?.externalOrganization?.name ||
        project.title;
    }
    const safety = evaluateForwardSafety(source.scope, destScope, {
      destLabel,
    });
    if (safety.ok && safety.needsConfirm && !confirmExternal) {
      return NextResponse.json(
        { error: safety.warning, needsConfirm: true },
        { status: 409 },
      );
    }

    const attPolicy = canForwardAttachments({
      sourceScope: source.scope,
      destScope,
      hasAttachments: source.attachments.length > 0,
    });
    const atts = attPolicy.include ? source.attachments : [];

    let finalReceiverId = project.clientId;
    if (isManagerRole(session.user.role) || isStaffAgent(session.user.role)) {
      finalReceiverId = project.clientId;
    } else if (project.assignedToId) {
      finalReceiverId = project.assignedToId;
    }

    const message = await prisma.message.create({
      data: {
        content: forwardBody,
        projectId: project.id,
        senderId: session.user.id,
        receiverId: finalReceiverId,
        channel,
        ...(atts.length ? { attachmentsJson: atts } : {}),
      },
      include: {
        project: { select: { id: true, title: true } },
        sender: { select: { id: true, name: true } },
        receiver: { select: { id: true, name: true } },
      },
    });

    ttlInvalidatePrefix(`msg-unread:${finalReceiverId}`);
    void broadcastMessagerieToUser({
      receiverId: finalReceiverId,
      senderId: session.user.id,
      senderName: session.user.name ?? "Quelqu’un",
      title: project.title,
      preview: formatMediaPreview(message.content, atts),
      href: `/dashboard/messagerie?project=${project.id}`,
      at: message.createdAt.toISOString(),
      kind: "PROJECT",
      conversationKey: `PROJECT:${project.id}`,
    });

    return NextResponse.json({
      message,
      attachmentsOmitted: !attPolicy.include,
      omitReason: attPolicy.reason,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erreur lors du transfert" }, { status: 500 });
  }
}
