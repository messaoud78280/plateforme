import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
  const body = await request.json();
  const action = body?.action as string;
  const correctionNote = typeof body?.correctionNote === "string" ? body.correctionNote.trim() : "";

  if (action !== "validate" && action !== "correction") {
    return NextResponse.json(
      { error: "Action invalide (validate ou correction)" },
      { status: 400 }
    );
  }

  try {
    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Tâche introuvable" }, { status: 404 });
    }

    if (action === "validate") {
      const task = await prisma.task.update({
        where: { id },
        data: { validatedAt: new Date(), status: "COMPLETE" },
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
      }
      return NextResponse.json(task);
    }

    if (action === "correction") {
      const task = await prisma.task.update({
        where: { id },
        data: {
          status: "EN_COURS",
          validatedAt: null,
          completedAt: null,
          correctionNote: correctionNote || null,
        },
        include: { assignedTo: { select: { id: true, name: true, email: true } } },
      });
      return NextResponse.json(task);
    }
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Erreur lors de l'action" },
      { status: 500 }
    );
  }

  return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
}
