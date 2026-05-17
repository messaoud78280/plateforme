import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccessBeWorkSkills } from "@/lib/be-work-skills-access";
import { getPpspsSessionForUser, listPpspsSessionsForUser } from "@/lib/skills/ppsps-session-service";

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

    const sessions = await listPpspsSessionsForUser(session.user.id);
    return NextResponse.json({ sessions });
  } catch (e) {
    console.error("[skills/ppsps/sessions]", e);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
