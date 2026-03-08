import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** GET /api/tasks/[id]/comments — Commentaires (paramètre ?internal=true pour notes internes, gérante/agent uniquement) */
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

  const isAgence = session.user.role === "AGENCE" || session.user.role === "MANAGER";
  const isAgent = session.user.role === "AGENT";

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { id: true, clientId: true, assignedToId: true },
  });
  if (!task) {
    return NextResponse.json({ error: "Tâche introuvable" }, { status: 404 });
  }

  const isAssignedAgent = task.assignedToId === session.user.id;
  if (internal) {
    if (!isAgence && !(isAgent && isAssignedAgent)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }
  } else {
    const canRead = task.clientId === session.user.id || isAgence || (isAgent && isAssignedAgent);
    if (!canRead) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }
  }

  const comments = await prisma.taskComment.findMany({
    where: { taskId, isInternal: internal },
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
  const isAgence = session.user.role === "AGENCE" || session.user.role === "MANAGER";
  const isAgent = session.user.role === "AGENT";

  const body = await request.json();
  const { content, isInternal } = body as { content?: string; isInternal?: boolean };
  if (!content || typeof content !== "string" || !content.trim()) {
    return NextResponse.json({ error: "Contenu requis" }, { status: 400 });
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { id: true, clientId: true, assignedToId: true },
  });
  if (!task) {
    return NextResponse.json({ error: "Tâche introuvable" }, { status: 404 });
  }

  const internal = Boolean(isInternal);
  if (internal) {
    const isAssignedAgent = task.assignedToId === session.user.id;
    if (!isAgence && !(isAgent && isAssignedAgent)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }
  } else {
    const canWrite = task.clientId === session.user.id || isAgence || (isAgent && task.assignedToId === session.user.id);
    if (!canWrite) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }
  }

  const comment = await prisma.taskComment.create({
    data: {
      taskId,
      userId: session.user.id,
      content: content.trim(),
      isInternal: internal,
    },
    include: { user: { select: { id: true, name: true } } },
  });

  return NextResponse.json(comment);
}
