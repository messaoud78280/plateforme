import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

/** PATCH /api/tasks/[id]/validate – Valider le travail ou demander une correction (agence uniquement) */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  if (session.user.role !== "AGENCE" && session.user.role !== "MANAGER") {
    return NextResponse.json({ error: "Réservé à l'agence" }, { status: 403 });
  }

  const { id } = await params;
  let body: { action?: string; correctionNote?: string; actionsUsed?: number };
  try {
    body = (await request.json()) as {
      action?: string;
      correctionNote?: string;
      actionsUsed?: number;
    };
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const action = body?.action;
  const correctionNote =
    typeof body?.correctionNote === "string" ? body.correctionNote.trim() : "";

  if (action !== "validate" && action !== "correction") {
    return NextResponse.json(
      { error: "Opération invalide (validate ou correction)" },
      { status: 400 }
    );
  }

  try {
    const existing = await prisma.task.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        status: true,
        clientId: true,
        assignedToId: true,
      },
    });
    if (!existing) {
      return NextResponse.json({ error: "Tâche introuvable" }, { status: 404 });
    }

    if (existing.status !== "A_VALIDER") {
      return NextResponse.json(
        { error: "Cette mission n'est pas en attente de validation." },
        { status: 400 }
      );
    }

    if (action === "validate") {
      const updateData: {
        validatedAt: Date;
        status: "COMPLETE";
        completedAt: Date;
        actionsUsed?: number | null;
      } = {
        validatedAt: new Date(),
        status: "COMPLETE",
        completedAt: new Date(),
      };
      if (typeof body.actionsUsed === "number" && body.actionsUsed >= 0) {
        updateData.actionsUsed = Math.round(body.actionsUsed);
      }

      const task = await prisma.task.update({
        where: { id },
        data: updateData,
        include: { assignedTo: { select: { id: true, name: true, email: true } } },
      });
      if (task.clientId) {
        try {
          await prisma.alert.create({
            data: {
              title: "Demande terminée",
              message: `Votre demande "${task.title}" a été traitée et validée.`,
              clientId: task.clientId,
              actionUrl: `/dashboard/taches/${id}`,
            },
          });
        } catch {
          // ignore si table Alert absente
        }
        await createNotification({
          userId: task.clientId,
          type: "TASK_COMPLETED",
          title: "Mission validée",
          message: `Votre demande « ${task.title} » a été validée par l'équipe BeWork.`,
          actionUrl: `/dashboard/taches/${id}`,
        });
      }
      if (task.assignedToId) {
        await createNotification({
          userId: task.assignedToId,
          type: "TASK_COMPLETED",
          title: "Mission validée",
          message: `Le travail sur « ${task.title} » a été validé par la gérante.`,
          actionUrl: `/dashboard/taches/${id}`,
        });
      }

      const taskFinal = await prisma.task.findUnique({
        where: { id },
        include: { assignedTo: { select: { id: true, name: true, email: true } } },
      });

      return NextResponse.json(taskFinal ?? task);
    }

    if (action === "correction") {
      if (!correctionNote) {
        return NextResponse.json(
          { error: "Précisez ce qui doit être corrigé." },
          { status: 400 }
        );
      }

      const task = await prisma.task.update({
        where: { id },
        data: {
          status: "EN_COURS",
          validatedAt: null,
          completedAt: null,
          correctionNote,
        },
        include: { assignedTo: { select: { id: true, name: true, email: true } } },
      });

      if (task.assignedToId) {
        await createNotification({
          userId: task.assignedToId,
          type: "TASK_ASSIGNED",
          title: "Correction demandée",
          message: `La gérante demande une correction sur « ${task.title} » : ${correctionNote.slice(0, 120)}${correctionNote.length > 120 ? "…" : ""}`,
          actionUrl: `/dashboard/taches/${id}#correction-section`,
        });
      }

      return NextResponse.json(task);
    }
  } catch (e) {
    console.error("Task validate:", e);
    return NextResponse.json(
      { error: "Erreur lors de l'opération. Réessayez ou contactez le support." },
      { status: 500 }
    );
  }

  return NextResponse.json({ error: "Opération inconnue" }, { status: 400 });
}
