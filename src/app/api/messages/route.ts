import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  canAccessProjectMessaging,
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
import {
  canAccessProjectChannel,
  ensureProjectChannel,
  legacyChannelFromType,
  resolveProjectChannelForContext,
  typeFromLegacyChannel,
  type ProjectChannelType,
} from "@/lib/messagerie/project-channels";
import {
  ChannelSendMembershipError,
  createChannelMessageWithSenderMembership,
} from "@/lib/messagerie/channel-send-guarantee";

const VALID_CHANNELS = new Set(["INTERNE", "CLIENT", "FOURNISSEUR", "SOUS_TRAITANT"]);

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
    const channelId = searchParams.get("channelId");
    const channelParam = searchParams.get("channel");

    // V2C.6 — fil par canal explicite
    if (channelId) {
      const ok = await canAccessProjectChannel(session.user.id, channelId, "read");
      if (!ok) {
        return NextResponse.json({ error: "Canal non autorisé" }, { status: 403 });
      }
      const messages = await prisma.message.findMany({
        where: {
          channelId,
          ...(projectId ? { projectId } : {}),
        },
        include: {
          project: { select: { id: true, title: true } },
          sender: { select: { id: true, name: true } },
          receiver: { select: { id: true, name: true } },
          projectChannel: {
            select: {
              id: true,
              type: true,
              externalOrganizationId: true,
              externalOrganization: { select: { name: true, tradeName: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      });

      const presented = await presentMessagesForViewer(
        session.user.id,
        "PROJECT",
        messages,
      );

      if (searchParams.get("meta") === "1") {
        return NextResponse.json({ messages: presented, channelId });
      }
      return NextResponse.json(presented);
    }

    // Legacy : filtre par type de canal (compat)
    const {
      projectMessageChannelFilter,
    } = await import("@/lib/messaging/access");
    const { channels, where: channelWhere } = await projectMessageChannelFilter(
      session.user.id,
      session.user.role,
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

    if (searchParams.get("meta") === "1") {
      return NextResponse.json({ messages: presented, channels });
    }
    return NextResponse.json(presented);
  } catch (error) {
    console.error("Erreur récupération messages:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des messages." },
      { status: 500 },
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
      channelId?: string;
      externalOrganizationId?: string;
      attachments?: unknown;
      replyTo?: MessageReplyMeta | null;
    };
    const channelRaw = typeof body.channel === "string" ? body.channel : null;
    const channelIdRaw = typeof body.channelId === "string" ? body.channelId : null;
    const externalOrgRaw =
      typeof body.externalOrganizationId === "string" ? body.externalOrganizationId : null;
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
        { status: 400 },
      );
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { assignedTo: { select: { id: true } } },
    });

    if (!project) {
      return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });
    }

    const sender = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { personType: true, name: true, externalOrganizationId: true },
    });
    const personType = sender?.personType ?? null;

    // Résoudre le canal V2C.6
    let resolvedChannelId: string;
    let legacyChannel: MessageChannel;
    let channelType: ProjectChannelType;

    if (channelIdRaw) {
      const ok = await canAccessProjectChannel(session.user.id, channelIdRaw, "write");
      if (!ok) {
        return NextResponse.json({ error: "Vous ne pouvez pas écrire sur ce fil." }, { status: 403 });
      }
      const ch = await prisma.projectChannel.findUnique({
        where: { id: channelIdRaw },
        select: { id: true, type: true, projectId: true },
      });
      if (!ch || ch.projectId !== projectId) {
        return NextResponse.json({ error: "Canal introuvable." }, { status: 404 });
      }
      resolvedChannelId = ch.id;
      channelType = ch.type as ProjectChannelType;
      legacyChannel = legacyChannelFromType(channelType) as MessageChannel;
    } else {
      const canMessage = await canAccessProjectMessaging(session.user, project);
      if (!canMessage) {
        return NextResponse.json({ error: "Accès refusé à ce projet." }, { status: 403 });
      }
      legacyChannel =
        channelRaw && VALID_CHANNELS.has(channelRaw)
          ? (channelRaw as MessageChannel)
          : defaultMessageChannelForPerson(personType);

      if (!canPostToMessageChannel(personType, session.user.role, legacyChannel)) {
        return NextResponse.json(
          { error: "Vous ne pouvez pas écrire sur ce fil." },
          { status: 403 },
        );
      }

      channelType = typeFromLegacyChannel(legacyChannel);
      try {
        const ensured = await resolveProjectChannelForContext({
          projectId,
          type: channelType,
          externalOrganizationId:
            externalOrgRaw ||
            (channelType !== "INTERNAL" ? sender?.externalOrganizationId : null),
        });
        resolvedChannelId = ensured.id;
      } catch {
        // Fallback INTERNAL / CLIENT sans org externe résolue
        if (channelType === "INTERNAL") {
          const ch = await ensureProjectChannel({ projectId, type: "INTERNAL" });
          resolvedChannelId = ch.id;
        } else {
          return NextResponse.json(
            { error: "Canal métier introuvable pour ce contexte." },
            { status: 400 },
          );
        }
      }
    }

    const isAgence = isAgencyOrManager(session.user);
    let finalReceiverId: string;

    // Destinataire technique (compat schéma) : autre participant du canal si possible
    const otherParticipant = await prisma.projectChannelParticipant.findFirst({
      where: {
        channelId: resolvedChannelId,
        userId: { not: session.user.id },
        user: { accessStatus: { in: ["ACTIVE", "INVITED"] } },
      },
      select: { userId: true },
    });

    if (bodyReceiverId) {
      const asParticipant = await prisma.projectChannelParticipant.findUnique({
        where: {
          channelId_userId: { channelId: resolvedChannelId, userId: bodyReceiverId },
        },
        select: { id: true },
      });
      if (!asParticipant) {
        // Superviseur premier envoi : destinataire peut ne pas être encore listé ;
        // on accepte uniquement si déjà participant, sinon fallback autre participant.
        return NextResponse.json(
          { error: "Destinataire hors canal." },
          { status: 400 },
        );
      }
      finalReceiverId = bodyReceiverId;
    } else if (otherParticipant) {
      finalReceiverId = otherParticipant.userId;
    } else if (isAgence) {
      finalReceiverId = project.clientId;
    } else if (isAgent(session.user)) {
      finalReceiverId = project.clientId;
    } else if (project.assignedToId) {
      finalReceiverId = project.assignedToId;
    } else {
      finalReceiverId = project.clientId;
    }

    const storedContent =
      text || formatMediaPreview("", attachments) || "Pièce jointe";

    // RECETTE-V1 P0 — join auteur + message atomiques (superviseur inclus)
    let message;
    let notifyIds: string[];
    try {
      const created = await createChannelMessageWithSenderMembership({
        channelId: resolvedChannelId,
        projectId,
        senderId: session.user.id,
        receiverId: finalReceiverId,
        content: storedContent,
        legacyChannel,
        attachments: attachments.length > 0 ? attachments : undefined,
      });
      message = created.message;
      notifyIds = created.notifyUserIds;
    } catch (e) {
      if (e instanceof ChannelSendMembershipError) {
        return NextResponse.json(
          { error: e.message, code: e.code },
          { status: 409 },
        );
      }
      throw e;
    }

    const preview = formatMediaPreview(text, attachments).slice(0, 80);
    const href = `/dashboard/messagerie?view=chantiers&project=${projectId}&channelId=${resolvedChannelId}`;

    for (const uid of notifyIds) {
      ttlInvalidatePrefix(`msg-unread:${uid}`);
      ttlInvalidatePrefix(`msg-preview:${uid}`);
      try {
        await prisma.alert.create({
          data: {
            title: "Nouveau message chantier",
            message: `${sender?.name ?? "Un interlocuteur"} vous a envoyé un message sur « ${project.title} ».`,
            level: "WARNING",
            clientId: uid,
            actionUrl: href,
          },
        });
      } catch (alertErr) {
        console.error("Création alerte (nouveau message):", alertErr);
      }
      void broadcastMessagerieToUser({
        receiverId: uid,
        senderId: session.user.id,
        senderName: sender?.name ?? session.user?.name ?? "Quelqu'un",
        title: project.title,
        preview,
        href,
        at: message.createdAt.toISOString(),
        kind: "PROJECT",
        conversationKey: `PROJECT:${projectId}:${resolvedChannelId}`,
      });
    }

    return NextResponse.json(message);
  } catch (error) {
    console.error("Erreur création message:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi du message." },
      { status: 500 },
    );
  }
}
