import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAgencyOrManager, isManager } from "@/lib/authz";
import { resolveFollowUpOwnerUserId } from "@/lib/follow-up/access";
import { processAttentionEscalations } from "@/lib/follow-up/attention/process-escalations";

/**
 * POST /api/follow-up/process-attention-escalations
 * W3-C2A — déclenchement MANUEL rappels / escalades (pas de cron).
 * Réservé admin / gérant / démo / développement.
 *
 * Body optionnel : { now?: string ISO, organizationId?: string }
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const personType = session.user.personType;
  if (personType === "CLIENT_EXT" || personType === "SUPPLIER") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const isDemo = Boolean(session.user.isDemo);
  const isDev = process.env.NODE_ENV === "development";
  if (!isManager(session.user) && !isAgencyOrManager(session.user) && !isDemo && !isDev) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  let now: Date | undefined;
  let organizationId: string | null | undefined;
  try {
    const body = (await req.json().catch(() => ({}))) as {
      now?: string;
      organizationId?: string | null;
    };
    if (body.now) {
      const d = new Date(body.now);
      if (Number.isNaN(d.getTime())) {
        return NextResponse.json({ error: "now invalide" }, { status: 400 });
      }
      now = d;
    }
    if (body.organizationId !== undefined) {
      organizationId = body.organizationId;
    }
  } catch {
    // body vide OK
  }

  try {
    const ownerUserId = await resolveFollowUpOwnerUserId(session.user.id);
    const result = await processAttentionEscalations({
      now,
      ownerUserId,
      organizationId: organizationId ?? undefined,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error("[process-attention-escalations]", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
