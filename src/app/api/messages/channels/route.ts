import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  bootstrapDefaultChannelsForProject,
  listProjectChannelsForUser,
} from "@/lib/messagerie/project-channels";
import { canAccessProjectMessaging } from "@/lib/messaging/access";

/**
 * GET /api/messages/channels?projectId=
 * Liste des canaux chantier visibles (V2C.6).
 */
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const projectId = new URL(request.url).searchParams.get("projectId");
  if (!projectId) {
    return NextResponse.json({ error: "projectId requis" }, { status: 400 });
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      title: true,
      clientId: true,
      assignedToId: true,
      organizationId: true,
    },
  });
  if (!project) {
    return NextResponse.json({ error: "Chantier introuvable" }, { status: 404 });
  }

  const canProject = await canAccessProjectMessaging(session.user, project);
  // Direction / participants peuvent lister même si canAccessProjectMessaging strict échoue
  await bootstrapDefaultChannelsForProject(projectId);
  const channels = await listProjectChannelsForUser(session.user.id, projectId);
  if (!canProject && channels.length === 0) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  return NextResponse.json({
    project: { id: project.id, title: project.title },
    channels,
  });
}
