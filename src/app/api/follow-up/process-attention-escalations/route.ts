import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAgencyOrManager, isManager } from "@/lib/authz";
import { resolveFollowUpOwnerUserId } from "@/lib/follow-up/access";
import { processAttentionEscalations } from "@/lib/follow-up/attention/process-escalations";
import { resolveAttentionProcessNow } from "@/lib/follow-up/attention/resolve-now";

/**
 * POST /api/follow-up/process-attention-escalations
 * W3-C2A — déclenchement MANUEL (session). Pas le cron système.
 *
 * Body optionnel : { now?: string ISO, organizationId?: string }
 * `now` simulé : uniquement démo / dev / ATTENTION_ALLOW_SIMULATED_NOW.
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

  let requestedNow: string | undefined;
  let organizationId: string | null | undefined;
  try {
    const body = (await req.json().catch(() => ({}))) as {
      now?: string;
      organizationId?: string | null;
    };
    if (body.now) requestedNow = body.now;
    if (body.organizationId !== undefined) {
      organizationId = body.organizationId;
    }
  } catch {
    // body vide OK
  }

  const resolved = resolveAttentionProcessNow({
    requestedNow,
    isDemoSession: isDemo,
    forceRealNow: false,
  });

  if (requestedNow && resolved.rejectedSimulation) {
    return NextResponse.json(
      {
        error:
          "Simulation temporelle (now) interdite en production. Utilisez l’environnement démo/dev ou ATTENTION_ALLOW_SIMULATED_NOW.",
      },
      { status: 403 },
    );
  }

  if (requestedNow) {
    const d = new Date(requestedNow);
    if (Number.isNaN(d.getTime())) {
      return NextResponse.json({ error: "now invalide" }, { status: 400 });
    }
  }

  try {
    const ownerUserId = await resolveFollowUpOwnerUserId(session.user.id);
    const result = await processAttentionEscalations({
      now: resolved.now,
      ownerUserId,
      ...(organizationId !== undefined ? { organizationId } : {}),
    });
    return NextResponse.json({
      ok: true,
      simulatedNow: resolved.simulated,
      ...result,
    });
  } catch (e) {
    console.error("[process-attention-escalations]", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
