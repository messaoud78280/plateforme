import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  taskMessagerieWhere,
  taskMessageVisibilityRelationWhere,
} from "@/lib/messaging/access";
import { excludeLegacyPurchaseOrderTasksWhere } from "@/lib/tasks/legacy-purchase-order";

/** GET /api/tasks/messagerie?filter=inbox|mes-missions|en-attente-client|en-cours|terminees
 * Retourne les tâches avec lastMessage et unreadCount pour la messagerie missions */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const filter = searchParams.get("filter") ?? "inbox";

  try {
    let taskWhere: Record<string, unknown> = {
      AND: [taskMessagerieWhere(session.user), excludeLegacyPurchaseOrderTasksWhere],
    };

    const statusFilters: Record<string, string[]> = {
      inbox: [], // toutes (avec priorité aux non lus)
      "mes-missions": [],
      "en-attente-client": ["EN_ATTENTE_INFO"],
      "en-cours": ["ASSIGNEE", "EN_ANALYSE", "EN_COURS", "A_VALIDER", "EN_ATTENTE"],
      terminees: ["COMPLETE"],
    };

    const statusList = statusFilters[filter] ?? [];
    if (statusList.length > 0) {
      taskWhere.status = statusList.length === 1 ? statusList[0] : { in: statusList };
    }

    const tasks = await prisma.task.findMany({
      where: taskWhere,
      include: {
        client: { select: { id: true, name: true, personType: true } },
        assignedTo: { select: { id: true, name: true } },
        project: { select: { id: true, title: true } },
        taskMessages: {
          where: taskMessageVisibilityRelationWhere(session.user),
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { sender: { select: { id: true, name: true } } },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 50,
    });

    // Unread count per task (messages où receiver = session et read = false)
    const taskIds = tasks.map((t) => t.id);
    const unreadByTask = await prisma.taskMessage.groupBy({
      by: ["taskId"],
      where: {
        taskId: { in: taskIds },
        receiverId: session.user.id,
        read: false,
      },
      _count: { id: true },
    });
    const unreadMap = new Map(unreadByTask.map((u) => [u.taskId, u._count.id]));

    const result = tasks.map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      category: (t as { category?: string | null }).category ?? null,
      priority: (t as { priority?: string | null }).priority ?? null,
      projectId: t.projectId ?? null,
      projectName: t.project?.title ?? null,
      client: t.client,
      assignedTo: t.assignedTo,
      lastMessage: t.taskMessages[0]
        ? {
            id: t.taskMessages[0].id,
            content: t.taskMessages[0].content,
            createdAt: t.taskMessages[0].createdAt,
            isInternal: Boolean(t.taskMessages[0].isInternal),
            sender: t.taskMessages[0].sender,
          }
        : null,
      unreadCount: unreadMap.get(t.id) ?? 0,
      documents: [] as { id: string; name: string; fileUrl: string }[],
    }));

    // Tri WhatsApp : conversation au dernier message en tête (pas seulement updatedAt tâche)
    result.sort((a, b) => {
      const ta = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const tb = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
      if (tb !== ta) return tb - ta;
      return 0;
    });

    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des missions" },
      { status: 500 }
    );
  }
}
