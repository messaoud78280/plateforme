import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** POST /api/missions/relancer — Relancer une mission (dupliquer une tâche terminée) */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  if (session.user.role !== "CLIENT") {
    return NextResponse.json(
      { error: "Seul le client peut relancer une mission" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const taskId = typeof body.taskId === "string" ? body.taskId.trim() : null;

    if (!taskId) {
      return NextResponse.json(
        { error: "ID de mission requis" },
        { status: 400 }
      );
    }

    const source = await prisma.task.findFirst({
      where: {
        id: taskId,
        clientId: session.user.id,
        status: "COMPLETE",
      },
      include: {
        documents: { select: { id: true, name: true, fileUrl: true } },
      },
    });

    if (!source) {
      return NextResponse.json(
        { error: "Mission non trouvée ou non terminée" },
        { status: 404 }
      );
    }

    const task = await prisma.task.create({
      data: {
        title: source.title,
        description: source.description,
        category: source.category,
        priority: source.priority,
        status: "NOUVEAU",
        clientId: session.user.id,
        projectId: source.projectId,
        contactsJson: source.contactsJson ?? undefined,
        suppliersJson: source.suppliersJson ?? undefined,
        estimatedActions: source.estimatedActions,
      },
    });

    // Les documents restent liés à l'ancienne tâche ; le client pourra en ajouter de nouveaux
    // ou les liens sont conservés via description. Pas de copie des fichiers pour garder simplicité.

    return NextResponse.json({
      id: task.id,
      message: "Mission relancée avec succès",
    });
  } catch (e) {
    console.error("Erreur relance mission:", e);
    return NextResponse.json(
      { error: "Erreur lors de la relance" },
      { status: 500 }
    );
  }
}
