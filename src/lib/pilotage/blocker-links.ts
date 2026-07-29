"use server";

/**
 * Relie un point signalé ailleurs dans la plateforme (note interne mission,
 * message) à une action de Pilotage travaux traçable — évite qu'un blocage
 * évoqué en messagerie reste sans suite parce qu'il n'a jamais été resaisi
 * dans le module Pilotage.
 *
 * PilotageBlocker.originType / originId / originLabel existent déjà dans le
 * schéma mais n'étaient renseignés par aucun code (P2 audit produit).
 */

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canEditPilotageOperational } from "@/lib/pilotage/access";
import { logPilotageActivity } from "@/lib/pilotage/history";
import { PILOTAGE_LIST_PATH } from "@/lib/pilotage/constants";
import { refreshPilotageProgress } from "@/app/dashboard/pilotage-travaux/refresh-progress";

export type CreateBlockerFromTaskResult =
  | { ok: true; pilotageId: string; blockerId: string }
  | { ok: false; error: string };

/** Origine "TASK" : le blocage a été signalé depuis une note interne / un échange de mission. */
export async function createBlockerFromTaskOrigin(input: {
  taskId: string;
  title: string;
  severity?: string;
}): Promise<CreateBlockerFromTaskResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { ok: false, error: "Non autorisé." };
  if (!canEditPilotageOperational(session.user.role)) {
    return { ok: false, error: "Réservé à l'équipe BeWork (pilotage travaux)." };
  }

  const title = input.title.trim().slice(0, 200);
  if (!title) return { ok: false, error: "Titre du blocage requis." };

  const task = await prisma.task.findUnique({
    where: { id: input.taskId },
    select: { id: true, title: true, projectId: true },
  });
  if (!task) return { ok: false, error: "Mission introuvable." };
  if (!task.projectId) {
    return {
      ok: false,
      error: "Cette mission n'est liée à aucun chantier piloté — impossible de créer un blocage pilotage.",
    };
  }

  const pilotage = await prisma.worksitePilotage.findUnique({
    where: { projectId: task.projectId },
    select: {
      id: true,
      assistantId: true,
      conducteurId: true,
      archivedAt: true,
      project: { select: { assignedToId: true } },
    },
  });
  if (!pilotage || pilotage.archivedAt) {
    return {
      ok: false,
      error: "Aucun pilotage actif pour ce chantier. Créez-le depuis « Pilotage travaux » avant de lier ce blocage.",
    };
  }

  if (session.user.role === "AGENT") {
    const allowed =
      pilotage.assistantId === session.user.id ||
      pilotage.conducteurId === session.user.id ||
      pilotage.project.assignedToId === session.user.id;
    if (!allowed) return { ok: false, error: "Vous n'êtes pas rattaché à ce pilotage." };
  }

  const blocker = await prisma.pilotageBlocker.create({
    data: {
      pilotageId: pilotage.id,
      title,
      severity: input.severity?.trim() || "Important",
      status: "Ouvert",
      originType: "TASK",
      originId: task.id,
      originLabel: `Signalé depuis la mission « ${task.title} »`,
    },
  });

  await logPilotageActivity({
    pilotageId: pilotage.id,
    userId: session.user.id,
    userName: session.user.name,
    actionType: "blocage créé depuis mission",
    entityType: "blocker",
    entityId: blocker.id,
    entityLabel: title,
  });

  await refreshPilotageProgress(pilotage.id);

  revalidatePath(PILOTAGE_LIST_PATH);
  revalidatePath(`${PILOTAGE_LIST_PATH}/blocages`);
  revalidatePath(`${PILOTAGE_LIST_PATH}/${pilotage.id}`);

  return { ok: true, pilotageId: pilotage.id, blockerId: blocker.id };
}
