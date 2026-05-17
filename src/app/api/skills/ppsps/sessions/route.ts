import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccessBeWorkSkills } from "@/lib/be-work-skills-access";
import {
  duplicatePpspsSession,
  getPpspsSessionForUser,
  listPpspsSessionsForProject,
  listPpspsSessionsForUser,
} from "@/lib/skills/ppsps-session-service";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !canAccessBeWorkSkills(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    }

    const id = request.nextUrl.searchParams.get("id");
    if (id) {
      const detail = await getPpspsSessionForUser(session.user.id, id);
      if (!detail) {
        return NextResponse.json({ error: "Session introuvable." }, { status: 404 });
      }
      return NextResponse.json(detail);
    }

    const projectId = request.nextUrl.searchParams.get("projectId")?.trim();
    if (projectId) {
      const sessions = await listPpspsSessionsForProject(projectId, session.user.id);
      return NextResponse.json({ sessions });
    }

    const sessions = await listPpspsSessionsForUser(session.user.id);
    return NextResponse.json({ sessions });
  } catch (e) {
    console.error("[skills/ppsps/sessions]", e);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !canAccessBeWorkSkills(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as { action?: string; sessionId?: string };
    if (body.action !== "duplicate") {
      return NextResponse.json({ error: "Action non reconnue." }, { status: 400 });
    }

    const sessionId = typeof body.sessionId === "string" ? body.sessionId.trim() : "";
    if (!sessionId) {
      return NextResponse.json({ error: "sessionId requis." }, { status: 400 });
    }

    const result = await duplicatePpspsSession(session.user.id, sessionId);
    if (!result) {
      return NextResponse.json({ error: "Session introuvable." }, { status: 404 });
    }

    const detail = await getPpspsSessionForUser(session.user.id, result.id);
    return NextResponse.json({ ok: true, sessionId: result.id, session: detail });
  } catch (e) {
    console.error("[skills/ppsps/sessions POST]", e);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
