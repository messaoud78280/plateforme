import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessChantierProject } from "@/lib/chantier-dossier/access";

/** GET /api/projets/[id]/tasks — Missions liées au chantier */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id: projectId } = await params;
  const access = await canAccessChantierProject(session.user, projectId);
  if (!access.ok) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const tasks = await prisma.task.findMany({
    where: { projectId },
    select: {
      id: true,
      title: true,
      status: true,
      priority: true,
      missionType: true,
      desiredDate: true,
      actionsUsed: true,
      estimatedActions: true,
      createdAt: true,
      updatedAt: true,
      assignedTo: { select: { id: true, name: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(tasks);
}
