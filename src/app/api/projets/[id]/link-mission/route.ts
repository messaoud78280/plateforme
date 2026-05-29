import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccessChantierProject } from "@/lib/chantier-dossier/access";
import { linkMissionToProjectAndSync } from "@/lib/chantier-dossier/sync-mission-documents";

/** POST — Rattacher une mission au chantier et importer ses pièces dans le classeur */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const role = session.user.role;
  if (role !== "MANAGER" && role !== "AGENCE" && role !== "AGENT") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { id: projectId } = await params;
  const access = await canAccessChantierProject(session.user, projectId);
  if (!access.ok) {
    return NextResponse.json({ error: "Chantier non autorisé" }, { status: 403 });
  }

  let body: { taskId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const taskId = body.taskId?.trim();
  if (!taskId) {
    return NextResponse.json({ error: "taskId requis" }, { status: 400 });
  }

  const result = await linkMissionToProjectAndSync(projectId, taskId, session.user.id);
  return NextResponse.json(result);
}
