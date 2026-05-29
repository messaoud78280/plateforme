import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { normalizeTaskPriority } from "@/lib/tasks/priority";
import { MISSION_TYPES, type MissionType } from "@/lib/tasks/mission-types";

function isManager(role?: string | null): boolean {
  return role === "MANAGER" || role === "AGENCE";
}

/** POST /api/tasks/manager — Créer une mission pour un client (gérant). */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  if (!isManager(session.user.role)) {
    return NextResponse.json({ error: "Réservé au gérant" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const {
      clientId,
      title,
      description,
      projectId,
      assignedToId,
      agencyNotes,
      desiredDate,
      missionType,
      priority,
      estimatedActions,
    } = body as {
      clientId?: string;
      title?: string;
      description?: string;
      projectId?: string | null;
      assignedToId?: string | null;
      agencyNotes?: string | null;
      desiredDate?: string | null;
      missionType?: string | null;
      priority?: string | null;
      estimatedActions?: number | null;
    };

    if (!clientId?.trim() || !title?.trim()) {
      return NextResponse.json(
        { error: "Client et titre de la mission sont requis." },
        { status: 400 }
      );
    }

    const client = await prisma.user.findFirst({
      where: { id: clientId.trim(), role: "CLIENT" },
      select: { id: true, name: true, email: true },
    });
    if (!client) {
      return NextResponse.json({ error: "Client introuvable." }, { status: 404 });
    }

    let projectIdValid: string | null = null;
    if (projectId?.trim()) {
      const project = await prisma.project.findFirst({
        where: { id: projectId.trim(), clientId: client.id },
        select: { id: true },
      });
      if (!project) {
        return NextResponse.json(
          { error: "Projet introuvable ou non rattaché à ce client." },
          { status: 400 }
        );
      }
      projectIdValid = project.id;
    }

    let assignedId: string | null = null;
    if (assignedToId?.trim()) {
      const agent = await prisma.user.findFirst({
        where: {
          id: assignedToId.trim(),
          role: { in: ["AGENT", "AGENCE"] },
        },
        select: { id: true, name: true },
      });
      if (!agent) {
        return NextResponse.json({ error: "Agent invalide." }, { status: 400 });
      }
      assignedId = agent.id;
    }

    let desiredDateValid: Date | null = null;
    if (desiredDate?.trim()) {
      const d = new Date(desiredDate);
      if (!Number.isNaN(d.getTime())) desiredDateValid = d;
    }

    const status = assignedId ? "ASSIGNEE" : "EN_ATTENTE";

    let missionTypeValid: MissionType | null = null;
    if (missionType?.trim()) {
      const mt = missionType.trim().toUpperCase();
      if ((MISSION_TYPES as readonly string[]).includes(mt)) {
        missionTypeValid = mt as MissionType;
      }
    }

    const priorityValid = normalizeTaskPriority(priority) ?? "STANDARD";
    const estimatedValid =
      typeof estimatedActions === "number" && estimatedActions >= 0
        ? Math.round(estimatedActions)
        : null;

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        status,
        clientId: client.id,
        projectId: projectIdValid,
        assignedToId: assignedId,
        agencyNotes: agencyNotes?.trim() || null,
        desiredDate: desiredDateValid,
        missionType: missionTypeValid,
        priority: priorityValid,
        estimatedActions: estimatedValid,
        createdById: session.user.id,
      },
      include: {
        client: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
        project: { select: { id: true, title: true } },
      },
    });

    try {
      await createNotification({
        userId: client.id,
        type: "NEW_TASK",
        title: "Nouvelle mission",
        message: `Une mission « ${task.title} » a été ouverte sur votre compte.`,
        actionUrl: `/dashboard/taches/${task.id}`,
      });

      if (assignedId) {
        await createNotification({
          userId: assignedId,
          type: "TASK_ASSIGNED",
          title: "Mission assignée",
          message: `La mission « ${task.title} » (${client.name}) vous a été assignée.`,
          actionUrl: `/dashboard/taches/${task.id}`,
        });
      }
    } catch (notifErr) {
      console.error("Notification création mission gérant:", notifErr);
    }

    return NextResponse.json(task);
  } catch (e) {
    console.error("Création mission gérant:", e);
    return NextResponse.json(
      { error: "Erreur lors de la création de la mission." },
      { status: 500 }
    );
  }
}
