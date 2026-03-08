import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

/** GET /api/tasks/[id]/messages — Messages de la tâche (client ne voit que les non-internes, et seulement si agent assigné) */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id: taskId } = await params;
  const isAgence = session.user.role === "AGENCE" || session.user.role === "MANAGER";
  const isAgent = session.user.role === "AGENT";

  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true, clientId: true, assignedToId: true },
    });
    if (!task) {
      return NextResponse.json({ error: "Tâche introuvable" }, { status: 404 });
    }

    const isClient = task.clientId === session.user.id;
    const isAssignedAgent = task.assignedToId === session.user.id;
    const canRead = isAgence || isClient || (isAgent && isAssignedAgent);
    if (!canRead) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const where: { taskId: string; isInternal?: boolean } = { taskId };
    if (isClient) {
      where.isInternal = false;
    }

    const messages = await prisma.taskMessage.findMany({
      where,
      include: {
        sender: { select: { id: true, name: true } },
        receiver: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "asc" },
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

/** POST /api/tasks/[id]/messages — Envoyer un message (client ↔ agent si assigné, ou interne gérante ↔ agent) */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id: taskId } = await params;
  const isAgence = session.user.role === "AGENCE" || session.user.role === "MANAGER";
  const isAgent = session.user.role === "AGENT";

  try {
    const body = await request.json();
    const { content, receiverId, isInternal } = body as {
      content?: string;
      receiverId?: string;
      isInternal?: boolean;
    };

    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json({ error: "Contenu requis" }, { status: 400 });
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { client: { select: { name: true } }, assignedTo: { select: { id: true, name: true } } },
    });
    if (!task) {
      return NextResponse.json({ error: "Tâche introuvable" }, { status: 404 });
    }

    const isClient = task.clientId === session.user.id;
    const isAssignedAgent = task.assignedToId === session.user.id;

    let receiverIdFinal: string;
    const internal = Boolean(isInternal) && (isAgence || isAgent);

    if (isClient) {
      if (!task.assignedToId) {
        return NextResponse.json(
          { error: "La messagerie est disponible une fois un agent assigné à cette mission." },
          { status: 400 }
        );
      }
      if (internal) {
        return NextResponse.json({ error: "Le client ne peut pas envoyer de message interne." }, { status: 403 });
      }
      receiverIdFinal = task.assignedToId;
    } else if (isAgent && isAssignedAgent) {
      if (internal) {
        const rid = typeof receiverId === "string" ? receiverId : null;
        const manager = rid ? await prisma.user.findFirst({ where: { id: rid, role: "MANAGER" } }) : null;
        if (!manager) {
          return NextResponse.json({ error: "Destinataire invalide pour message interne." }, { status: 400 });
        }
        receiverIdFinal = manager.id;
      } else {
        receiverIdFinal = task.clientId;
      }
    } else if (isAgence) {
      if (internal && receiverId) {
        const agent = await prisma.user.findFirst({ where: { id: receiverId, role: { in: ["AGENCE", "AGENT"] } } });
        if (!agent) {
          return NextResponse.json({ error: "Destinataire invalide." }, { status: 400 });
        }
        receiverIdFinal = agent.id;
      } else if (!internal && task.clientId) {
        receiverIdFinal = task.clientId;
      } else {
        return NextResponse.json({ error: "Destinataire requis." }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const message = await prisma.taskMessage.create({
      data: {
        taskId,
        senderId: session.user.id,
        receiverId: receiverIdFinal,
        content: content.trim(),
        isInternal: internal,
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
      actionUrl: `/dashboard/taches/${taskId}`,
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
