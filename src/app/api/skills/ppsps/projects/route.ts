import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccessBeWorkSkills } from "@/lib/be-work-skills-access";
import { buildPpspsFormFromProject } from "@/lib/skills/ppsps-project-prefill";
import { getPpspsProjectForPrefill, listPpspsProjectsForUser } from "@/lib/skills/ppsps-projects";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !canAccessBeWorkSkills(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const projectId = request.nextUrl.searchParams.get("id")?.trim();

  try {
    if (projectId) {
      const project = await getPpspsProjectForPrefill(session.user.id, session.user.role, projectId);
      if (!project) {
        return NextResponse.json({ error: "Projet introuvable." }, { status: 404 });
      }
      return NextResponse.json({
        project: { id: project.id, title: project.title },
        prefill: buildPpspsFormFromProject(project),
      });
    }

    const projects = await listPpspsProjectsForUser(session.user.id, session.user.role);
    return NextResponse.json({ projects });
  } catch (e) {
    console.error("[skills/ppsps/projects]", e);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
