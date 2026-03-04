import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { minutesToActions, shouldResetActions, getMonthStart } from "@/lib/actions";

/** GET /api/tasks/[id] – Détail d'une tâche */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const isAgence = session.user.role === "AGENCE" || session.user.role === "MANAGER";
  const isAgent = session.user.role === "AGENT";

  try {
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, title: true } },
        documents: { orderBy: { createdAt: "asc" } },
      },
    });
    if (!task) {
      return NextResponse.json({ error: "Tâche introuvable" }, { status: 404 });
    }
    const canRead = isAgence || task.clientId === session.user.id || (isAgent && task.assignedToId === session.user.id);
    if (!canRead) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }
    return NextResponse.json(task);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de la tâche" },
      { status: 500 }
    );
  }
}

/** PUT /api/tasks/[id] – Mettre à jour une tâche */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const isAgence = session.user.role === "AGENCE" || session.user.role === "MANAGER";
  const isAgent = session.user.role === "AGENT";

  try {
    const existing = await prisma.task.findUnique({ where: { id }, include: { client: true } });
    if (!existing) {
      return NextResponse.json({ error: "Tâche introuvable" }, { status: 404 });
    }
    const isClient = existing.clientId === session.user.id;
    const isAssignedAgent = existing.assignedToId === session.user.id;
    if (!isAgence && !isAgent && !isClient) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }
    if (isAgent && !isAssignedAgent) {
      return NextResponse.json({ error: "Seul l'agent assigné peut mettre à jour cette tâche" }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, status, assignedToId, agencyNotes, timeSpentMinutes } = body as {
      title?: string;
      description?: string | null;
      status?: "EN_COURS" | "COMPLETE" | "EN_ATTENTE";
      assignedToId?: string | null;
      agencyNotes?: string | null;
      timeSpentMinutes?: number | null;
    };

    const data: {
      title?: string;
      description?: string | null;
      status?: "EN_COURS" | "COMPLETE" | "EN_ATTENTE";
      completedAt?: Date | null;
      assignedToId?: string | null;
      agencyNotes?: string | null;
      timeSpentMinutes?: number | null;
      actionsUsed?: number | null;
    } = {};
    if (typeof title === "string" && title.trim()) data.title = title.trim();
    if (body.hasOwnProperty("description")) data.description = description?.trim() ?? null;
    if (status) data.status = status;
    if (status === "COMPLETE") data.completedAt = new Date();
    if (status && status !== "COMPLETE") data.completedAt = null;
    if (isAgence && body.hasOwnProperty("assignedToId")) data.assignedToId = assignedToId || null;
    if (isAgence && body.hasOwnProperty("agencyNotes")) data.agencyNotes = agencyNotes?.trim() ?? null;

    let actionsToDeduct = 0;
    if ((isAgence || isAgent) && status === "COMPLETE" && typeof timeSpentMinutes === "number" && timeSpentMinutes >= 0) {
      const actions = minutesToActions(timeSpentMinutes);
      data.timeSpentMinutes = timeSpentMinutes;
      data.actionsUsed = actions;
      actionsToDeduct = actions;
    }

    const task = await prisma.task.update({
      where: { id },
      data,
      include: { assignedTo: { select: { id: true, name: true, email: true } } },
    });

    if (actionsToDeduct > 0 && task.clientId) {
      const client = await prisma.user.findUnique({
        where: { id: task.clientId },
        select: { monthlyActionsUsed: true, monthlyActionsTotal: true, actionsResetAt: true },
      });
      if (client) {
        if (shouldResetActions(client.actionsResetAt ?? null)) {
          await prisma.user.update({
            where: { id: task.clientId },
            data: { monthlyActionsUsed: 0, actionsResetAt: getMonthStart() },
          });
        }
        await prisma.user.update({
          where: { id: task.clientId },
          data: { monthlyActionsUsed: { increment: actionsToDeduct } },
        });
      }
    }

    return NextResponse.json(task);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de la tâche" },
      { status: 500 }
    );
  }
}

/** DELETE /api/tasks/[id] – Supprimer une tâche */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const isAgence = session.user.role === "AGENCE" || session.user.role === "MANAGER";

  try {
    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Tâche introuvable" }, { status: 404 });
    }
    if (!isAgence && existing.clientId !== session.user.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    await prisma.task.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de la tâche" },
      { status: 500 }
    );
  }
}
