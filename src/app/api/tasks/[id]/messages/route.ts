import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import {
  canAccessTaskThread,
  isManagerRole,
  isStaffAgent,
  taskMessageVisibilityWhere,
} from "@/lib/messaging/access";
import { badgeFromMeta } from "@/lib/messagerie/message-links";
import { broadcastMessagerieToUser } from "@/lib/messagerie/broadcast";
import { formatMediaPreview, type MsgAttachment } from "@/lib/messagerie/media-preview";
import { ttlInvalidatePrefix } from "@/lib/perf/ttl-cache";

/** GET /api/tasks/[id]/messages — Messages de la tâche (filtrés par participant).
 * Query : take (défaut 50, max 100) · before=<ISO> (charger plus ancien) · after=<ISO|id> (poll incrémental)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id: taskId } = await params;
  const { searchParams } = new URL(request.url);
  const takeRaw = Number(searchParams.get("take") ?? 50);
  const take = Math.min(100, Math.max(1, Number.isFinite(takeRaw) ? takeRaw : 50));
  const before = searchParams.get("before");
  const after = searchParams.get("after");

  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true, clientId: true, assignedToId: true },
    });
    if (!task) {
      return NextResponse.json({ error: "Tâche introuvable" }, { status: 404 });
    }

    const canRead = await canAccessTaskThread(session.user, task);
    if (!canRead) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const visibility = taskMessageVisibilityWhere(session.user, taskId);

    // Poll incrémental : messages plus récents que `after` (ISO ou message id)
    if (after) {
      let createdAfter: Date | null = null;
      const asDate = new Date(after);
      if (!Number.isNaN(asDate.getTime()) && after.includes("-") && after.length >= 20) {
        createdAfter = asDate;
      } else {
        const pivot = await prisma.taskMessage.findFirst({
          where: { id: after, taskId },
          select: { createdAt: true },
        });
        createdAfter = pivot?.createdAt ?? null;
      }

      if (!createdAfter) {
        return NextResponse.json([]);
      }

      const newer = await prisma.taskMessage.findMany({
        where: {
          AND: [visibility, { createdAt: { gt: createdAfter } }],
        },
        include: {
          sender: { select: { id: true, name: true } },
          receiver: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "asc" },
        take,
      });
      return NextResponse.json(newer.map((m) => ({ ...m, linkedBadges: [] as string[] })));
    }

    const beforeDate = before ? new Date(before) : null;
    const messagesDesc = await prisma.taskMessage.findMany({
      where: {
        AND: [
          visibility,
          beforeDate && !Number.isNaN(beforeDate.getTime())
            ? { createdAt: { lt: beforeDate } }
            : {},
        ],
      },
      include: {
        sender: { select: { id: true, name: true } },
        receiver: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: take + 1,
    });

    const hasMore = messagesDesc.length > take;
    const slice = hasMore ? messagesDesc.slice(0, take) : messagesDesc;
    const messages = slice.reverse();

    const ids = messages.map((m) => m.id);
    const links =
      ids.length > 0
        ? await prisma.messageAction.findMany({
            where: {
              sourceMessageKind: "TASK",
              sourceMessageId: { in: ids },
            },
            select: { sourceMessageId: true, type: true, metaJson: true, status: true },
            take: 200,
          })
        : [];

    const badgesByMessage: Record<string, string[]> = {};
    for (const l of links) {
      if (l.type === "LINK" || l.status === "OPEN") {
        const badge = badgeFromMeta(l.metaJson, l.type);
        if (!badgesByMessage[l.sourceMessageId]) badgesByMessage[l.sourceMessageId] = [];
        if (!badgesByMessage[l.sourceMessageId]!.includes(badge)) {
          badgesByMessage[l.sourceMessageId]!.push(badge);
        }
      }
    }

    const mapped = messages.map((m) => ({
      ...m,
      linkedBadges: badgesByMessage[m.id] ?? [],
    }));

    // Compat clients existants : tableau ; meta en header
    const res = NextResponse.json(mapped);
    res.headers.set("X-Has-More", hasMore ? "1" : "0");
    return res;
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des messages" },
      { status: 500 }
    );
  }
}

/** POST /api/tasks/[id]/messages — Envoyer un message (texte + pièces jointes). */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id: taskId } = await params;
  const isManager = isManagerRole(session.user.role);
  const isAgent = isStaffAgent(session.user.role);
  const isAgenceRole = session.user.role === "AGENCE";

  try {
    const body = await request.json();
    const { content, receiverId, isInternal, attachments } = body as {
      content?: string;
      receiverId?: string;
      isInternal?: boolean;
      attachments?: { name: string; fileUrl: string; fileSize: number; mimeType?: string }[];
    };

    const text = typeof content === "string" ? content.trim() : "";
    const files = Array.isArray(attachments)
      ? attachments.filter((a) => a?.fileUrl && a?.name)
      : [];
    if (!text && files.length === 0) {
      return NextResponse.json({ error: "Écrivez un message ou joignez un fichier." }, { status: 400 });
    }

    let task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { client: { select: { name: true } }, assignedTo: { select: { id: true, name: true } } },
    });
    if (!task) {
      return NextResponse.json({ error: "Tâche introuvable" }, { status: 404 });
    }

    const canAccess = await canAccessTaskThread(session.user, task);
    if (!canAccess) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const isClient = task.clientId === session.user.id;
    let assignedToId = task.assignedToId;

    // Auto-affectation agent si client écrit sur une mission sans responsable
    if (isClient && !assignedToId) {
      const agent = await prisma.user.findFirst({
        where: { role: { in: ["AGENT", "AGENCE"] } },
        orderBy: { name: "asc" },
        select: { id: true },
      });
      if (agent) {
        task = await prisma.task.update({
          where: { id: taskId },
          data: { assignedToId: agent.id },
          include: { client: { select: { name: true } }, assignedTo: { select: { id: true, name: true } } },
        });
        assignedToId = agent.id;
      }
    }

    const isAssignedAgent = assignedToId === session.user.id;
    let receiverIdFinal: string;
    const internal = Boolean(isInternal) && (isManager || isAgent);

    if (isClient) {
      if (!assignedToId) {
        return NextResponse.json(
          { error: "Aucun agent disponible pour cette conversation. Contactez votre entreprise." },
          { status: 400 },
        );
      }
      if (internal) {
        return NextResponse.json({ error: "Le client ne peut pas envoyer de message interne." }, { status: 403 });
      }
      receiverIdFinal = assignedToId;
    } else if ((isAgent && isAssignedAgent) || isAgenceRole || isManager) {
      if (internal) {
        const rid = typeof receiverId === "string" ? receiverId : null;
        if (isManager && rid) {
          const agent = await prisma.user.findFirst({
            where: { id: rid, role: { in: ["AGENCE", "AGENT"] } },
          });
          if (!agent) {
            return NextResponse.json({ error: "Destinataire invalide." }, { status: 400 });
          }
          receiverIdFinal = agent.id;
        } else if (isAgent && rid) {
          const manager = await prisma.user.findFirst({ where: { id: rid, role: "MANAGER" } });
          if (!manager) {
            return NextResponse.json({ error: "Destinataire invalide pour message interne." }, { status: 400 });
          }
          receiverIdFinal = manager.id;
        } else {
          receiverIdFinal = assignedToId || task.clientId;
        }
      } else {
        receiverIdFinal = task.clientId;
      }
    } else {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const message = await prisma.taskMessage.create({
      data: {
        taskId,
        senderId: session.user.id,
        receiverId: receiverIdFinal,
        content: text || (files.length === 1 ? files[0]!.name : `${files.length} fichiers`),
        isInternal: internal,
        attachmentsJson: files.length > 0 ? files : undefined,
      },
      include: {
        sender: { select: { id: true, name: true } },
        receiver: { select: { id: true, name: true } },
      },
    });

    await createNotification({
      userId: receiverIdFinal,
      type: "MESSAGE_RECEIVED",
      title: "Nouveau message",
      message: internal
        ? `Message interne sur la mission « ${task.title} ».`
        : `${session.user?.name ?? "Quelqu'un"} vous a envoyé un message sur la mission « ${task.title} ».`,
      actionUrl: `/dashboard/messagerie?task=${taskId}&messageId=${message.id}`,
    });

    ttlInvalidatePrefix(`msg-unread:${receiverIdFinal}`);
    ttlInvalidatePrefix(`msg-preview:${receiverIdFinal}`);
    void broadcastMessagerieToUser({
      receiverId: receiverIdFinal,
      senderId: session.user.id,
      senderName: session.user?.name ?? "Quelqu'un",
      title: task.title,
      preview: formatMediaPreview(
        message.content,
        message.attachmentsJson as MsgAttachment[] | null,
      ),
      href: `/dashboard/messagerie?task=${taskId}&messageId=${message.id}`,
      at: message.createdAt.toISOString(),
      kind: "TASK",
      conversationKey: `TASK:${taskId}`,
    });

    return NextResponse.json(message);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi du message" },
      { status: 500 }
    );
  }
}
