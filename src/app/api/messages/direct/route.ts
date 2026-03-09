import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

/** GET /api/messages/direct — Messages directs envoyés/reçus (gérant/agent uniquement) */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const isAgence = session.user.role === "AGENCE" || session.user.role === "MANAGER";
  const isAgent = session.user.role === "AGENT";
  if (!isAgence && !isAgent) {
    return NextResponse.json({ error: "Réservé aux gérants et agents" }, { status: 403 });
  }

  try {
    const messages = await prisma.directMessage.findMany({
      where: {
        OR: [
          { senderId: session.user.id },
          { receiverId: session.user.id },
        ],
      },
      include: {
        sender: { select: { id: true, name: true } },
        receiver: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json(messages);
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

  const isAgence = session.user.role === "AGENCE" || session.user.role === "MANAGER";
  const isAgent = session.user.role === "AGENT";
  if (!isAgence && !isAgent) {
    return NextResponse.json({ error: "Réservé aux gérants et agents" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { content, receiverId } = body as { content?: string; receiverId?: string };

    if (!content?.trim() || !receiverId) {
      return NextResponse.json(
        { error: "Destinataire et contenu requis." },
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
        content: content.trim(),
      },
      include: {
        sender: { select: { id: true, name: true } },
        receiver: { select: { id: true, name: true } },
      },
    });

    await createNotification({
      userId: receiver.id,
      type: "MESSAGE_RECEIVED",
      title: "Nouveau message",
      message: `${session.user?.name ?? "Quelqu'un"} vous a envoyé un message direct.`,
      actionUrl: "/dashboard/messagerie?tab=envoyer",
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
