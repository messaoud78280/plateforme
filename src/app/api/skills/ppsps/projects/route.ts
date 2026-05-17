import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccessBeWorkSkills } from "@/lib/be-work-skills-access";
import { listPpspsProjectsForUser } from "@/lib/skills/ppsps-projects";

export const runtime = "nodejs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !canAccessBeWorkSkills(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  try {
    const projects = await listPpspsProjectsForUser(session.user.id, session.user.role);
    return NextResponse.json({ projects });
  } catch (e) {
    console.error("[skills/ppsps/projects]", e);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
