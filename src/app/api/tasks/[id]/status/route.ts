import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { minutesToActions } from "@/lib/actions";
import { deductTaskCreditsIfNeeded } from "@/lib/tasks/deduct-credits";
import { isAgencyOrManager, isAgent as isAgentRole } from "@/lib/authz";

/** PATCH /api/tasks/[id]/status – Changer le statut d'une tâche (optionnel: timeSpentMinutes pour COMPLETE) */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const isAgence = isAgencyOrManager(session.user);
  const isAgent = isAgentRole(session.user);

  try {
    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Tâche introuvable" }, { status: 404 });
    }
    const isClientOwner = existing.clientId === session.user.id;
    const isAssignedAgent = existing.assignedToId === session.user.id;
    if (!isAgence && !isAgent && !isClientOwner) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }
    if (isAgent && !isAssignedAgent) {
      return NextResponse.json({ error: "Seul l'agent assigné peut modifier cette tâche" }, { status: 403 });
    }
    // Le client ne pilote pas le workflow métier (évite COMPLETE / A_VALIDER côté client).
    if (isClientOwner && !isAgence && !isAgent) {
      return NextResponse.json(
        { error: "Seul BeWork peut modifier le statut de la mission. Utilisez la messagerie pour une demande." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validStatuses = ["NOUVEAU", "EN_ATTENTE", "ASSIGNEE", "EN_ANALYSE", "EN_COURS", "EN_ATTENTE_INFO", "A_VALIDER", "COMPLETE"] as const;
    const status = body?.status as (typeof validStatuses)[number] | undefined;
    const timeSpentMinutes = typeof body?.timeSpentMinutes === "number" ? body.timeSpentMinutes : undefined;
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Statut invalide" },
        { status: 400 }
      );
    }

    let actionsToDeduct = 0;
    const canSetTime = (isAgence || isAgent) && (status === "COMPLETE" || status === "A_VALIDER") && timeSpentMinutes != null && timeSpentMinutes >= 0;
    if (canSetTime) {
      actionsToDeduct = minutesToActions(timeSpentMinutes);
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        status,
        completedAt: (status === "COMPLETE" || status === "A_VALIDER") ? new Date() : null,
        ...(canSetTime
          ? { timeSpentMinutes, actionsUsed: actionsToDeduct }
          : {}),
      },
    });

    if (status === "COMPLETE" && task.clientId) {
      try {
        await prisma.alert.create({
          data: {
            title: "Demande terminée",
            message: `Votre demande "${task.title}" a été traitée et marquée comme terminée.`,
            clientId: task.clientId,
            actionUrl: `/dashboard/taches/${id}`,
          },
        });
      } catch {
        // ignore si table Alert absente
      }
      await deductTaskCreditsIfNeeded(id);
    }

    return NextResponse.json(task);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Erreur lors du changement de statut" },
      { status: 500 }
    );
  }
}
