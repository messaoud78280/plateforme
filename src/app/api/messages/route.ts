import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  canAccessProjectMessaging,
  projectMessageChannelFilter,
} from "@/lib/messaging/access";
import { isAgencyOrManager, isAgent } from "@/lib/authz";
import {
  canPostToMessageChannel,
  defaultMessageChannelForPerson,
  type MessageChannel,
} from "@/lib/equipe-acces/nav-by-persona";
import { broadcastMessagerieToUser } from "@/lib/messagerie/broadcast";
import { ttlInvalidatePrefix } from "@/lib/perf/ttl-cache";
import { formatMediaPreview, type MsgAttachment } from "@/lib/messagerie/media-preview";
import {
  encodeReplyIntoContent,
  makeReplyExcerpt,
  type MessageReplyMeta,
} from "@/lib/messagerie/message-reply";
import { presentMessagesForViewer } from "@/lib/messagerie/filter-hidden-messages";

const VALID_CHANNELS = new Set(["INTERNE", "CLIENT", "FOURNISSEUR"]);

type IncomingAttachment = {
  name?: string;
  fileUrl?: string;
  fileSize?: number;
  mimeType?: string;
  kind?: string;
  durationSec?: number;
};

function normalizeAttachments(raw: unknown): MsgAttachment[] {
  if (!Array.isArray(raw)) return [];
  return (raw as IncomingAttachment[])
    .filter((a) => a && typeof a.fileUrl === "string" && a.fileUrl.length > 0)
    .slice(0, 8)
    .map((a) => ({
      name: typeof a.name === "string" && a.name ? a.name : "fichier",
      fileUrl: a.fileUrl as string,
      fileSize: typeof a.fileSize === "number" ? a.fileSize : 0,
      mimeType: typeof a.mimeType === "string" ? a.mimeType : undefined,
      kind:
        a.kind === "audio" || a.kind === "image" || a.kind === "file"
          ? a.kind
          : undefined,
      durationSec:
        typeof a.durationSec === "number" && Number.isFinite(a.durationSec)
          ? a.durationSec
          : undefined,
    }));
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const channelParam = searchParams.get("channel");

    const { channels, where: channelWhere } = await projectMessageChannelFilter(
      session.user.id,
      session.user.role
    );

    let channelFilter: string[] = channels;
    if (channelParam && VALID_CHANNELS.has(channelParam)) {
      if (!channels.includes(channelParam)) {
        return NextResponse.json({ error: "Canal non autorisé" }, { status: 403 });
      }
      channelFilter = [channelParam];
    }

    const messages = await prisma.message.findMany({
      where: {
        ...channelWhere,
        channel: { in: channelFilter },
        ...(projectId ? { projectId } : {}),
      },
      include: {
        project: { select: { id: true, title: true } },
        sender: { select: { id: true, name: true } },
        receiver: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const presented = await presentMessagesForViewer(
      session.user.id,
      "PROJECT",
      messages,
    );

    // Compat : tableau brut par défaut ; meta=1 pour canaux V2
    if (searchParams.get("meta") === "1") {
      return NextResponse.json({ messages: presented, channels });
    }
    return NextResponse.json(presented);
  } catch (error) {
    console.error("Erreur récupération messages:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des messages." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { projectId, content, receiverId: bodyReceiverId, replyTo } = body as {
      projectId?: string;
      content?: string;
      receiverId?: string;
      channel?: string;
      attachments?: unknown;
      replyTo?: MessageReplyMeta | null;
    };
    const channelRaw = typeof body.channel === "string" ? body.channel : null;
    const attachments = normalizeAttachments(body.attachments);
    let text = typeof content === "string" ? content.trim() : "";
    if (replyTo && typeof replyTo.id === "string" && text) {
      text = encodeReplyIntoContent(text, {
        id: replyTo.id,
        senderName: replyTo.senderName || "Message",
        excerpt: makeReplyExcerpt(replyTo.excerpt || ""),
      });
    }

    if (!projectId || (!text && attachments.length === 0)) {
      return NextResponse.json(
        { error: "Projet et contenu ou pièce jointe requis." },
        { status: 400 }
      );
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { assignedTo: { select: { id: true } } },
    });

    if (!project) {
      return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });
    }

    const canMessage = await canAccessProjectMessaging(session.user, project);
    if (!canMessage) {
      return NextResponse.json({ error: "Accès refusé à ce projet." }, { status: 403 });
    }

    const sender = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { personType: true, name: true },
    });
    const personType = sender?.personType ?? null;
    const channel: MessageChannel =
      channelRaw && VALID_CHANNELS.has(channelRaw)
        ? (channelRaw as MessageChannel)
        : defaultMessageChannelForPerson(personType);

    if (!canPostToMessageChannel(personType, session.user.role, channel)) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas écrire sur ce fil." },
        { status: 403 }
      );
    }

    const isAgence = isAgencyOrManager(session.user);
    let finalReceiverId: string;

    if (isAgence) {
      if (bodyReceiverId) {
        if (bodyReceiverId === project.clientId) {
          finalReceiverId = project.clientId;
        } else {
          const manager = await prisma.user.findFirst({
            where: { id: bodyReceiverId, role: "MANAGER" },
          });
          if (manager) {
            finalReceiverId = manager.id;
          } else {
            return NextResponse.json({ error: "Destinataire invalide." }, { status: 400 });
          }
        }
      } else {
        finalReceiverId = project.clientId;
      }
    } else if (isAgent(session.user)) {
      finalReceiverId = bodyReceiverId || project.clientId;
    } else {
      // CLIENT (interne ou partenaire)
      if (bodyReceiverId) {
        const allowed = await prisma.user.findFirst({
          where: {
            id: bodyReceiverId,
            role: { in: ["AGENCE", "MANAGER", "AGENT", "CLIENT"] },
          },
        });
        if (!allowed) {
          return NextResponse.json({ error: "Destinataire invalide." }, { status: 400 });
        }
        finalReceiverId = bodyReceiverId;
      } else if (project.assignedToId) {
        finalReceiverId = project.assignedToId;
      } else {
        const manager = await prisma.user.findFirst({ where: { role: "MANAGER" } });
        const owner = project.clientId !== session.user.id ? project.clientId : null;
        finalReceiverId = manager?.id ?? owner ?? project.clientId;
      }
    }

    const storedContent =
      text ||
      formatMediaPreview("", attachments) ||
      "Pièce jointe";

    const message = await prisma.message.create({
      data: {
        content: storedContent,
        projectId,
        senderId: session.user.id,
        receiverId: finalReceiverId,
        channel,
        ...(attachments.length > 0 ? { attachmentsJson: attachments } : {}),
      },
      include: {
        project: { select: { id: true, title: true } },
        sender: { select: { id: true, name: true } },
        receiver: { select: { id: true, name: true } },
      },
    });

    const preview = formatMediaPreview(text, attachments).slice(0, 80);

    if (!isAgence) {
      try {
        const alertMessage = `${sender?.name ?? "Un interlocuteur"} vous a envoyé un message (${channel}) sur « ${project.title} ».`;
        await prisma.alert.create({
          data: {
            title: "Nouveau message chantier",
            message: alertMessage,
            level: "WARNING",
            clientId: finalReceiverId,
            actionUrl: `/dashboard/messagerie?view=chantiers&project=${projectId}&channel=${channel}`,
          },
        });
      } catch (alertErr) {
        console.error("Création alerte (nouveau message):", alertErr);
      }
    }

    if (isAgence && finalReceiverId) {
      try {
        const excerpt = preview + (preview.length >= 80 ? "…" : "");
        await prisma.alert.create({
          data: {
            title: "Message chantier",
            message: `${sender?.name ?? "Votre interlocuteur"} — fil ${channel} — « ${project.title} » : ${excerpt}`,
            clientId: finalReceiverId,
            actionUrl: `/dashboard/messagerie?view=chantiers&project=${projectId}&channel=${channel}`,
          },
        });
      } catch (alertErr) {
        console.error("Création alerte (message assistant):", alertErr);
      }
    }

    if (finalReceiverId && finalReceiverId !== session.user.id) {
      ttlInvalidatePrefix(`msg-unread:${finalReceiverId}`);
      ttlInvalidatePrefix(`msg-preview:${finalReceiverId}`);
      void broadcastMessagerieToUser({
        receiverId: finalReceiverId,
        senderId: session.user.id,
        senderName: sender?.name ?? session.user?.name ?? "Quelqu'un",
        title: project.title,
        preview,
        href: `/dashboard/messagerie?view=chantiers&project=${projectId}&channel=${channel}`,
        at: message.createdAt.toISOString(),
        kind: "PROJECT",
        conversationKey: `PROJECT:${projectId}:${channel}`,
      });
    }

    return NextResponse.json(message);
  } catch (error) {
    console.error("Erreur création message:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi du message." },
      { status: 500 }
    );
  }
}
