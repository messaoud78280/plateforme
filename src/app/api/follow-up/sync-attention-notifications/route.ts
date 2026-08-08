import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAgencyOrManager, isAgent, isClientRole } from "@/lib/authz";
import { resolveFollowUpOwnerUserId } from "@/lib/follow-up/access";
import { syncAttentionNotificationsForOwner } from "@/lib/follow-up/attention/sync-notifications";

/**
 * POST /api/follow-up/sync-attention-notifications
 * Sync idempotente W3-C1 (pas de cron). Réservé aux utilisateurs internes.
 */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const personType = session.user.personType;
  if (personType === "CLIENT_EXT" || personType === "SUPPLIER") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  if (
    !isAgencyOrManager(session.user) &&
    !isAgent(session.user) &&
    !isClientRole(session.user)
  ) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  try {
    const ownerUserId = await resolveFollowUpOwnerUserId(session.user.id);
    const agentOnly = isAgent(session.user) && !isAgencyOrManager(session.user);
    const result = await syncAttentionNotificationsForOwner({
      ownerUserId,
      assigneeOnlyId: agentOnly ? session.user.id : null,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error("[sync-attention-notifications]", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
