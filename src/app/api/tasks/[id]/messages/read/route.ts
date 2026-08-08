import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessTaskThread } from "@/lib/messaging/access";

/** POST /api/tasks/[id]/messages/read — Marquer comme lus les messages reçus (style WhatsApp). */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id: taskId } = await params;

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

    const result = await prisma.taskMessage.updateMany({
      where: {
        taskId,
        receiverId: session.user.id,
        read: false,
      },
      data: { read: true },
    });

    return NextResponse.json({ success: true, updated: result.count });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour" },
      { status: 500 },
    );
  }
}
