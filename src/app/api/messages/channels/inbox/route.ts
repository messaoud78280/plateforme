import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { listInboxProjectChannelsForUser } from "@/lib/messagerie/project-channels";

/**
 * GET /api/messages/channels/inbox
 * MESSAGERIE-V2C.7.1 — Canaux chantier pour la vue Discussions (projection batch).
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const channels = await listInboxProjectChannelsForUser(session.user.id);
    return NextResponse.json({ channels });
  } catch (e) {
    console.error("[channels/inbox]", e);
    return NextResponse.json({ error: "Erreur chargement canaux" }, { status: 500 });
  }
}
