import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { minutesToActions } from "@/lib/actions";
import { createNotification } from "@/lib/notifications";
import { normalizeTaskPriority } from "@/lib/tasks/priority";
import { deductTaskCreditsIfNeeded } from "@/lib/tasks/deduct-credits";

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
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        clientId: true,
        projectId: true,
        category: true,
        priority: true,
        missionType: true,
        estimatedActions: true,
        clientVisibleNotes: true,
        desiredDate: true,
        assignedToId: true,
        agencyNotes: true,
        correctionNote: true,
        validatedAt: true,
        completedAt: true,
        timeSpentMinutes: true,
        actionsUsed: true,
        creditsDeductedAt: true,
        clientReport: true,
        clientReportSentAt: true,
        createdAt: true,
        updatedAt: true,
        assignedTo: { select: { id: true, name: true, email: true } },
        client: { select: { id: true, name: true } },
        project: { select: { id: true, title: true } },
        documents: {
          orderBy: { createdAt: "asc" as const },
          select: { id: true, name: true, fileUrl: true, fileSize: true, mimeType: true, createdAt: true },
        },
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
    const message = e instanceof Error ? e.message : "Erreur lors de la récupération de la tâche";
    return NextResponse.json(
      { error: message },
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
    const validStatuses = ["NOUVEAU", "EN_ATTENTE", "ASSIGNEE", "EN_ANALYSE", "EN_COURS", "EN_ATTENTE_INFO", "A_VALIDER", "COMPLETE"] as const;
    const validPriorities = ["STANDARD", "PRIORITAIRE", "URGENT"] as const;
    const {
      title,
      description,
      status,
      assignedToId,
      agencyNotes,
      clientVisibleNotes,
      timeSpentMinutes,
      priority,
      missionType,
      estimatedActions,
      projectId,
    } = body as {
      title?: string;
      description?: string | null;
      status?: (typeof validStatuses)[number];
      assignedToId?: string | null;
      agencyNotes?: string | null;
      clientVisibleNotes?: string | null;
      timeSpentMinutes?: number | null;
      priority?: (typeof validPriorities)[number] | null;
      missionType?: string | null;
      estimatedActions?: number | null;
      projectId?: string | null;
    };

    const data: {
      title?: string;
      description?: string | null;
      status?: (typeof validStatuses)[number];
      completedAt?: Date | null;
      assignedToId?: string | null;
      agencyNotes?: string | null;
      timeSpentMinutes?: number | null;
      actionsUsed?: number | null;
      priority?: string | null;
      missionType?: string | null;
      estimatedActions?: number | null;
      clientVisibleNotes?: string | null;
      projectId?: string | null;
    } = {};
    if (typeof title === "string" && title.trim()) data.title = title.trim();
    if (body.hasOwnProperty("description")) data.description = description?.trim() ?? null;
    if (status && validStatuses.includes(status)) data.status = status;
    if (isAgence && body.hasOwnProperty("priority")) {
      const rawPriority = priority as string | null | undefined;
      const normalized = normalizeTaskPriority(rawPriority);
      data.priority =
        normalized ?? (rawPriority == null || rawPriority === "" ? "STANDARD" : null);
      if (rawPriority != null && rawPriority !== "" && normalized === null) {
        return NextResponse.json({ error: "Priorité invalide" }, { status: 400 });
      }
    }
    if (status === "COMPLETE") data.completedAt = new Date();
    if (status && status !== "COMPLETE") data.completedAt = null;
    const assigningAgent = isAgence && body.hasOwnProperty("assignedToId") && assignedToId;
    if (isAgence && body.hasOwnProperty("assignedToId")) {
      data.assignedToId = assignedToId || null;
      if (assigningAgent) data.status = "ASSIGNEE";
    }
    if (isAgence && body.hasOwnProperty("agencyNotes")) data.agencyNotes = agencyNotes?.trim() ?? null;
    if (isAgence && body.hasOwnProperty("clientVisibleNotes")) {
      data.clientVisibleNotes = clientVisibleNotes?.trim() ?? null;
    }
    if (isAgence && body.hasOwnProperty("missionType")) {
      data.missionType = missionType?.trim() ? missionType.trim().toUpperCase() : null;
    }
    if (isAgence && body.hasOwnProperty("estimatedActions")) {
      data.estimatedActions =
        typeof estimatedActions === "number" && estimatedActions >= 0
          ? Math.round(estimatedActions)
          : null;
    }
    if (isAgence && body.hasOwnProperty("projectId")) {
      if (projectId) {
        const project = await prisma.project.findFirst({
          where: { id: projectId, clientId: existing.clientId },
        });
        data.projectId = project ? project.id : null;
      } else {
        data.projectId = null;
      }
    }

    const previousPriority = existing.priority;
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

    if (status === "COMPLETE") {
      await deductTaskCreditsIfNeeded(id);
    }

    if (assigningAgent && task.assignedToId) {
      const prio = task.priority;
      const prioSuffix =
        prio && prio !== "STANDARD"
          ? ` — Priorité : ${prio === "URGENT" ? "Urgent" : prio === "PRIORITAIRE" ? "Prioritaire" : prio}`
          : "";
      await createNotification({
        userId: task.assignedToId,
        type: "TASK_ASSIGNED",
        title: "Mission assignée",
        message: `Une mission vous a été assignée : « ${task.title} »${prioSuffix}.`,
        actionUrl: `/dashboard/taches/${id}`,
      });
    }
    if (
      isAgence &&
      body.hasOwnProperty("priority") &&
      data.priority &&
      data.priority !== previousPriority &&
      data.priority !== "STANDARD" &&
      task.assignedToId &&
      task.assignedToId !== session.user.id
    ) {
      const label =
        data.priority === "URGENT" ? "Urgent" : data.priority === "PRIORITAIRE" ? "Prioritaire" : data.priority;
      await createNotification({
        userId: task.assignedToId,
        type: "TASK_ASSIGNED",
        title: "Priorité mission mise à jour",
        message: `La mission « ${task.title} » est passée en priorité ${label}.`,
        actionUrl: `/dashboard/taches/${id}`,
      });
    }
    if (status === "COMPLETE" && task.clientId) {
      await createNotification({
        userId: task.clientId,
        type: "TASK_COMPLETED",
        title: "Mission terminée",
        message: `Votre demande « ${task.title} » a été traitée et validée.`,
        actionUrl: `/dashboard/taches/${id}`,
      });
    }
    if (status === "A_VALIDER") {
      const managers = await prisma.user.findMany({ where: { role: "MANAGER" }, select: { id: true } });
      for (const m of managers) {
        await createNotification({
          userId: m.id,
          type: "TASK_TO_VALIDATE",
          title: "Mission à valider",
          message: `La mission « ${task.title} » est terminée et attend votre validation.`,
          actionUrl: `/dashboard/taches/${id}`,
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
