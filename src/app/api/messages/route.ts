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

const VALID_CHANNELS = new Set(["INTERNE", "CLIENT", "FOURNISSEUR"]);

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

    // Compat : tableau brut par défaut ; meta=1 pour canaux V2
    if (searchParams.get("meta") === "1") {
      return NextResponse.json({ messages, channels });
    }
    return NextResponse.json(messages);
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
    const { projectId, content, receiverId: bodyReceiverId } = body;
    const channelRaw = typeof body.channel === "string" ? body.channel : null;

    if (!projectId || !content?.trim()) {
      return NextResponse.json(
        { error: "Projet et contenu requis." },
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

    const message = await prisma.message.create({
      data: {
        content: content.trim(),
        projectId,
        senderId: session.user.id,
        receiverId: finalReceiverId,
        channel,
      },
    });

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
        const excerpt = content.trim().slice(0, 80) + (content.trim().length > 80 ? "…" : "");
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

    return NextResponse.json(message);
  } catch (error) {
    console.error("Erreur création message:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi du message." },
      { status: 500 }
    );
  }
}
