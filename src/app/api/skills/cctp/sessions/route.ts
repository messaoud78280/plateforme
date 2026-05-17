import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccessBeWorkSkills } from "@/lib/be-work-skills-access";
import { getCctpSessionForUser, listCctpSessionsForUser } from "@/lib/skills/cctp-session-service";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
  }
  if (!canAccessBeWorkSkills(session.user.role)) {
    return NextResponse.json({ error: "Accès non autorisé." }, { status: 403 });
  }

  const sessionId = request.nextUrl.searchParams.get("id");
  try {
    if (sessionId) {
      const detail = await getCctpSessionForUser(session.user.id, sessionId);
      if (!detail) {
        return NextResponse.json({ error: "Session introuvable." }, { status: 404 });
      }
      return NextResponse.json(detail);
    }
    const list = await listCctpSessionsForUser(session.user.id);
    return NextResponse.json({ sessions: list });
  } catch (e) {
    console.error("[skills/cctp/sessions]", e);
    return NextResponse.json({ error: "Impossible de charger l'historique." }, { status: 500 });
  }
}
