import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessTaskThread, isManagerRole, isStaffAgent } from "@/lib/messaging/access";

/** GET /api/tasks/[id]/comments — Commentaires (notes internes = auteur uniquement). */
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

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { id: true, clientId: true, assignedToId: true },
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
      ...(internal ? { userId: session.user.id } : {}),
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
  const isManager = isManagerRole(session.user.role);
  const isAgent = isStaffAgent(session.user.role);

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

  const canAccess = await canAccessTaskThread(session.user, task);
  if (!canAccess) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const internal = Boolean(isInternal);
  if (internal && !isManager && !isAgent) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
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
