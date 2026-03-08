import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyManagers } from "@/lib/notifications";

/** GET /api/tasks – Liste des tâches du client (ou toutes si agence) */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const isAgence = session.user.role === "AGENCE" || session.user.role === "MANAGER";
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? undefined;

  try {
    const tasks = await prisma.task.findMany({
      where: {
        ...(isAgence ? {} : { clientId: session.user.id }),
        ...(status ? { status: status as "NOUVEAU" | "EN_ATTENTE" | "ASSIGNEE" | "EN_ANALYSE" | "EN_COURS" | "EN_ATTENTE_INFO" | "A_VALIDER" | "COMPLETE" } : {}),
      },
      include: {
        project: { select: { id: true, title: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json(tasks);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des tâches" },
      { status: 500 }
    );
  }
}

/** POST /api/tasks – Créer une tâche (réservé au client : "dépôt" de demande) */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  if (session.user.role !== "CLIENT") {
    return NextResponse.json(
      { error: "Seul le client peut déposer une tâche. L’agence traite les demandes depuis la liste." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const {
      title,
      description,
      projectId,
      category,
      priority,
      desiredDate,
      estimatedActions,
    } = body as {
      title: string;
      description?: string;
      projectId?: string | null;
      category?: string | null;
      priority?: string | null;
      desiredDate?: string | null;
      estimatedActions?: string | null;
    };

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json(
        { error: "Le titre est requis" },
        { status: 400 }
      );
    }

    let projectIdValid: string | null = null;
    if (projectId && typeof projectId === "string" && projectId.trim()) {
      const project = await prisma.project.findFirst({
        where: { id: projectId.trim(), clientId: session.user.id },
      });
      if (project) projectIdValid = project.id;
    }

    const validPriority = priority && ["STANDARD", "PRIORITAIRE", "URGENT"].includes(priority) ? priority : null;
    let desiredDateValid: Date | null = null;
    if (desiredDate && typeof desiredDate === "string") {
      const d = new Date(desiredDate);
      if (!Number.isNaN(d.getTime())) desiredDateValid = d;
    }

    const countBefore = await prisma.task.count({
      where: { clientId: session.user.id },
    });
    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description?.trim() ?? null,
        status: "NOUVEAU",
        clientId: session.user.id,
        projectId: projectIdValid,
        category: category && typeof category === "string" && category.trim() ? category.trim() : null,
        priority: validPriority,
        desiredDate: desiredDateValid,
        estimatedActions:
          estimatedActions && typeof estimatedActions === "string" && estimatedActions.trim()
            ? estimatedActions.trim()
            : null,
      },
    });
    try {
      const clientName = session.user?.name ?? "Un client";
      await notifyManagers({
        type: "NEW_TASK",
        title: "Nouvelle demande",
        message: `${clientName} a créé une demande : « ${task.title} ».`,
        actionUrl: `/dashboard/taches/${task.id}`,
      });
    } catch (notifErr) {
      console.error("Notification nouvelle demande:", notifErr);
    }
    return NextResponse.json({ ...task, firstRequest: countBefore === 0 });
  } catch (e) {
    const err = e as { message?: string; code?: string };
    const msg = String(err?.message ?? "Erreur inconnue");
    console.error("Création tâche:", e);
    // En dev, toujours renvoyer l'erreur réelle pour débogage
    const isDev = process.env.NODE_ENV === "development";
    const isColumnMissing =
      !isDev &&
      (/column.*does not exist|Unknown column|projectId.*exist/i.test(msg) || err?.code === "P2010");
    const message = isColumnMissing
      ? "La base de données doit être mise à jour. Exécutez le script prisma/supabase-tasks-project-id.sql dans Supabase (voir SUPABASE-SETUP.md)."
      : isDev
        ? `Erreur : ${msg}`
        : "Erreur lors de la création de la tâche.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
