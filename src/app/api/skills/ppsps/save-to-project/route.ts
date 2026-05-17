import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccessBeWorkSkills } from "@/lib/be-work-skills-access";
import { savePpspsSessionToProject } from "@/lib/skills/ppsps-save-to-project";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !canAccessBeWorkSkills(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      sessionId?: string;
      projectId?: string;
    };
    const sessionId = typeof body.sessionId === "string" ? body.sessionId.trim() : "";
    const projectId = typeof body.projectId === "string" ? body.projectId.trim() : "";

    if (!sessionId || !projectId) {
      return NextResponse.json({ error: "sessionId et projectId requis." }, { status: 400 });
    }

    const result = await savePpspsSessionToProject({
      userId: session.user.id,
      role: session.user.role,
      sessionId,
      projectId,
    });

    return NextResponse.json({
      ok: true,
      documentId: result.documentId,
      fileUrl: result.fileUrl,
      projectUrl: `/dashboard/projets/${projectId}`,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Enregistrement impossible.";
    console.error("[skills/ppsps/save-to-project]", e);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
