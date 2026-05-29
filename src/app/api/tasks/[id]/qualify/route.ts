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

/**
 * PATCH /api/tasks/[id]/qualify — Qualifier une demande client (NOUVEAU) en mission interne.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !isManager(session.user.role)) {
    return NextResponse.json({ error: "Réservé au gérant" }, { status: 403 });
  }

  const { id } = await params;
  let body: {
    projectId?: string | null;
    missionType?: string;
    assignedToId?: string | null;
    priority?: string | null;
    agencyNotes?: string | null;
    estimatedActions?: number | null;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const existing = await prisma.task.findUnique({
    where: { id },
    select: { id: true, title: true, status: true, clientId: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Mission introuvable" }, { status: 404 });
  }
  if (existing.status !== "NOUVEAU") {
    return NextResponse.json(
      { error: "Seules les demandes reçues (statut Nouvelle) peuvent être qualifiées." },
      { status: 400 }
    );
  }

  let projectIdValid: string | null = null;
  if (body.projectId?.trim()) {
    const project = await prisma.project.findFirst({
      where: { id: body.projectId.trim(), clientId: existing.clientId },
      select: { id: true },
    });
    if (!project) {
      return NextResponse.json({ error: "Chantier introuvable pour ce client." }, { status: 400 });
    }
    projectIdValid = project.id;
  }

  let missionType: MissionType | null = null;
  if (body.missionType?.trim()) {
    const mt = body.missionType.trim().toUpperCase();
    if (!(MISSION_TYPES as readonly string[]).includes(mt)) {
      return NextResponse.json({ error: "Type de mission invalide." }, { status: 400 });
    }
    missionType = mt as MissionType;
  }

  let assignedId: string | null = null;
  if (body.assignedToId?.trim()) {
    const agent = await prisma.user.findFirst({
      where: { id: body.assignedToId.trim(), role: { in: ["AGENT", "AGENCE"] } },
      select: { id: true },
    });
    if (!agent) {
      return NextResponse.json({ error: "Agent invalide." }, { status: 400 });
    }
    assignedId = agent.id;
  }

  const priority = normalizeTaskPriority(body.priority) ?? "STANDARD";
  const estimatedActions =
    typeof body.estimatedActions === "number" && body.estimatedActions >= 0
      ? Math.round(body.estimatedActions)
      : null;

  const status = assignedId ? "ASSIGNEE" : "EN_ATTENTE";

  const task = await prisma.task.update({
    where: { id },
    data: {
      status,
      projectId: projectIdValid,
      missionType,
      assignedToId: assignedId,
      priority,
      agencyNotes: body.agencyNotes?.trim() || null,
      estimatedActions,
      createdById: session.user.id,
    },
    include: {
      client: { select: { id: true, name: true } },
      project: { select: { id: true, title: true } },
      assignedTo: { select: { id: true, name: true } },
    },
  });

  await prisma.activity.create({
    data: {
      type: "TASK_QUALIFIED",
      title: `Demande qualifiée — ${task.title}`,
      detail: projectIdValid
        ? `Rattachée au chantier · ${missionType ?? "type à préciser"}`
        : "Mission interne depuis demande client",
      clientId: task.clientId,
      projectId: projectIdValid,
      metadata: { taskId: id, missionType, qualifiedBy: session.user.id },
    },
  });

  if (assignedId) {
    await createNotification({
      userId: assignedId,
      type: "TASK_ASSIGNED",
      title: "Mission assignée",
      message: `Demande client qualifiée : « ${task.title} ».`,
      actionUrl: `/dashboard/taches/${id}`,
    });
  }

  return NextResponse.json(task);
}
