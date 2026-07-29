import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import {
  canAccessTaskThread,
  isManagerRole,
  isStaffAgent,
} from "@/lib/messaging/access";

function canReadInternalNotes(role: string | undefined | null): boolean {
  return isManagerRole(role) || isStaffAgent(role);
}

/** GET /api/tasks/[id]/comments — Commentaires (notes internes visibles gérant + agent assigné). */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id: taskId } = await params;
  const { searchParams } = new URL(request.url);
  const internal = searchParams.get("internal") === "true";

  if (internal && !canReadInternalNotes(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { id: true, clientId: true, assignedToId: true, title: true },
  });
  if (!task) {
    return NextResponse.json({ error: "Tâche introuvable" }, { status: 404 });
  }

  const canRead = await canAccessTaskThread(session.user, task);
  if (!canRead) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const comments = await prisma.taskComment.findMany({
    where: {
      taskId,
      isInternal: internal,
    },
    include: { user: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(comments);
}

/** POST /api/tasks/[id]/comments — Ajouter un commentaire (isInternal pour notes internes) */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id: taskId } = await params;

  let body: { content?: string; isInternal?: boolean };
  try {
    body = (await request.json()) as { content?: string; isInternal?: boolean };
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const { content, isInternal } = body;
  if (!content || typeof content !== "string" || !content.trim()) {
    return NextResponse.json({ error: "Contenu requis" }, { status: 400 });
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { id: true, clientId: true, assignedToId: true, title: true },
  });
  if (!task) {
    return NextResponse.json({ error: "Tâche introuvable" }, { status: 404 });
  }

  const canAccess = await canAccessTaskThread(session.user, task);
  if (!canAccess) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const internal = Boolean(isInternal);
  if (internal && !canReadInternalNotes(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  try {
    const comment = await prisma.taskComment.create({
      data: {
        taskId,
        userId: session.user.id,
        content: content.trim(),
        isInternal: internal,
      },
      include: { user: { select: { id: true, name: true } } },
    });

    if (internal && task.assignedToId && task.assignedToId !== session.user.id) {
      await createNotification({
        userId: task.assignedToId,
        type: "MESSAGE_RECEIVED",
        title: "Note interne sur une mission",
        message: `${session.user.name ?? "Le gérant"} a ajouté une note sur « ${task.title} ».`,
        actionUrl: `/dashboard/taches/${taskId}`,
      });
    }

    return NextResponse.json(comment);
  } catch (e) {
    console.error("TaskComment create:", e);
    return NextResponse.json(
      { error: "Impossible d'enregistrer la note. Réessayez ou contactez le support." },
      { status: 500 }
    );
  }
}
