import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MISSION_TYPE_FOLDER_CODE } from "@/lib/tasks/mission-types";
import type { MissionType } from "@/lib/tasks/mission-types";

async function getTaskWithAccess(taskId: string, userId: string, role: string) {
  const isStaff = role === "AGENCE" || role === "MANAGER";
  const isAgent = role === "AGENT";
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: {
      id: true,
      projectId: true,
      clientId: true,
      assignedToId: true,
      missionType: true,
    },
  });
  if (!task) return { error: "Mission introuvable", status: 404 as const };
  const canAccess =
    isStaff || (isAgent && task.assignedToId === userId) || task.clientId === userId;
  if (!canAccess) return { error: "Non autorisé", status: 403 as const };
  if (!task.projectId) return { error: "Aucun chantier lié à cette mission", status: 400 as const };
  return { task };
}

/** GET — Fichiers classeur liés + disponibles pour rattachement */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const access = await getTaskWithAccess(id, session.user.id, session.user.role);
  if ("error" in access) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const { task } = access;
  const projectId = task.projectId!;

  const [folders, linked, available] = await Promise.all([
    prisma.chantierFolder.findMany({
      where: { projectId },
      select: { id: true, code: true, label: true, sortOrder: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.chantierFile.findMany({
      where: { taskId: id },
      select: {
        id: true,
        name: true,
        fileUrl: true,
        status: true,
        folder: { select: { id: true, code: true, label: true } },
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.chantierFile.findMany({
      where: {
        projectId,
        fileUrl: { not: null },
        taskId: null,
      },
      select: {
        id: true,
        name: true,
        fileUrl: true,
        taskId: true,
        folder: { select: { id: true, code: true, label: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 200,
    }),
  ]);

  const folderCode = task.missionType
    ? MISSION_TYPE_FOLDER_CODE[task.missionType as MissionType]
    : undefined;
  const suggestedFolder = folderCode
    ? folders.find((f) => f.code === folderCode) ?? null
    : null;

  return NextResponse.json({
    linked,
    available,
    folders,
    suggestedFolderId: suggestedFolder?.id ?? null,
    suggestedFolderLabel: suggestedFolder?.label ?? null,
  });
}

/** PATCH — Lier ou délier un fichier du classeur */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const role = session.user.role;
  const isStaff = role === "AGENCE" || role === "MANAGER";
  const isAgent = role === "AGENT";
  if (!isStaff && !isAgent) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { id } = await params;
  const access = await getTaskWithAccess(id, session.user.id, role);
  if ("error" in access) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const { task } = access;
  const body = (await request.json()) as {
    chantierFileId?: string;
    action?: "link" | "unlink";
  };

  const chantierFileId = body.chantierFileId?.trim();
  const action = body.action;
  if (!chantierFileId || !action) {
    return NextResponse.json({ error: "chantierFileId et action requis" }, { status: 400 });
  }

  const file = await prisma.chantierFile.findFirst({
    where: { id: chantierFileId, projectId: task.projectId! },
  });
  if (!file) {
    return NextResponse.json({ error: "Fichier introuvable sur ce chantier" }, { status: 404 });
  }

  if (action === "link") {
    await prisma.chantierFile.update({
      where: { id: chantierFileId },
      data: { taskId: id },
    });
  } else {
    if (file.taskId !== id) {
      return NextResponse.json({ error: "Ce fichier n'est pas lié à cette mission" }, { status: 400 });
    }
    await prisma.chantierFile.update({
      where: { id: chantierFileId },
      data: { taskId: null },
    });
  }

  return NextResponse.json({ ok: true });
}
