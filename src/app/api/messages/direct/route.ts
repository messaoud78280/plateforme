import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import {
  directMessageParticipantWhere,
  directMessageThreadWhere,
  isManagerRole,
  isStaffAgent,
} from "@/lib/messaging/access";

function canUseDirectMessages(role?: string | null): boolean {
  return isManagerRole(role) || isStaffAgent(role);
}

const messageInclude = {
  sender: { select: { id: true, name: true } },
  receiver: { select: { id: true, name: true } },
} as const;

/** GET /api/messages/direct — Liste ou fil 1:1 (?with=userId). */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  if (!canUseDirectMessages(session.user.role)) {
    return NextResponse.json({ error: "Réservé aux gérants et agents" }, { status: 403 });
  }

  const otherUserId = new URL(request.url).searchParams.get("with")?.trim() ?? "";

  try {
    if (otherUserId) {
      if (otherUserId === session.user.id) {
        return NextResponse.json({ error: "Conversation invalide" }, { status: 400 });
      }

      const other = await prisma.user.findFirst({
        where: {
          id: otherUserId,
          role: { in: ["AGENCE", "AGENT", "MANAGER"] },
        },
        select: { id: true },
      });
      if (!other) {
        return NextResponse.json({ error: "Contact introuvable" }, { status: 404 });
      }

      const messages = await prisma.directMessage.findMany({
        where: directMessageThreadWhere(session.user.id, otherUserId),
        include: messageInclude,
        orderBy: { createdAt: "asc" },
        take: 200,
      });

      return NextResponse.json(messages);
    }

    const messages = await prisma.directMessage.findMany({
      where: directMessageParticipantWhere(session.user.id),
      include: messageInclude,
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json(
      messages.filter(
        (m) => m.senderId === session.user!.id || m.receiverId === session.user!.id
      )
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des messages" },
      { status: 500 }
    );
  }
}

/** POST /api/messages/direct — Envoyer un message direct à un agent ou manager */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  if (!canUseDirectMessages(session.user.role)) {
    return NextResponse.json({ error: "Réservé aux gérants et agents" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { content, receiverId, attachments } = body as {
      content?: string;
      receiverId?: string;
      attachments?: { name: string; fileUrl: string; fileSize: number; mimeType?: string }[];
    };

    const hasContent = typeof content === "string" && content.trim().length > 0;
    const hasAttachments = Array.isArray(attachments) && attachments.length > 0;

    if (!receiverId || (!hasContent && !hasAttachments)) {
      return NextResponse.json(
        { error: "Destinataire requis. Indiquez un message ou des pièces jointes." },
        { status: 400 }
      );
    }

    const receiver = await prisma.user.findFirst({
      where: {
        id: receiverId,
        role: { in: ["AGENCE", "AGENT", "MANAGER"] },
      },
    });

    if (!receiver || receiver.id === session.user.id) {
      return NextResponse.json(
        { error: "Destinataire invalide." },
        { status: 400 }
      );
    }

    const message = await prisma.directMessage.create({
      data: {
        senderId: session.user.id,
        receiverId: receiver.id,
        content: hasContent ? content.trim() : "",
        attachmentsJson: hasAttachments ? attachments : undefined,
      },
      include: messageInclude,
    });

    await createNotification({
      userId: receiver.id,
      type: "MESSAGE_RECEIVED",
      title: "Nouveau message",
      message: `${session.user?.name ?? "Quelqu'un"} vous a envoyé un message direct.`,
      actionUrl: "/dashboard/messagerie?tab=messages-directs",
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
