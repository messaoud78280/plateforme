import { NextRequest, NextResponse } from "next/server";
import { runAttentionEscalationScheduler } from "@/lib/follow-up/attention/scheduler";
import { resolveAttentionProcessNow } from "@/lib/follow-up/attention/resolve-now";

/**
 * POST /api/cron/attention-escalations
 * W3-C2B — exécution automatique (Railway Cron / script).
 *
 * Auth : header `x-secret` = ATTENTION_CRON_SECRET (ou Authorization: Bearer …).
 * Aucune session utilisateur. `now` simulé ignoré (forceRealNow).
 */
function extractSecret(request: NextRequest): string | null {
  const x = request.headers.get("x-secret");
  if (x) return x;
  const auth = request.headers.get("authorization");
  if (auth?.toLowerCase().startsWith("bearer ")) {
    return auth.slice(7).trim();
  }
  return null;
}

function isAuthorized(request: NextRequest): boolean {
  const expected = process.env.ATTENTION_CRON_SECRET;
  if (!expected) return false;
  const provided = extractSecret(request);
  if (!provided) return false;
  // Comparaison en temps constant approximatif
  if (provided.length !== expected.length) return false;
  let ok = 0;
  for (let i = 0; i < expected.length; i++) {
    ok |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return ok === 0;
}

export async function POST(request: NextRequest) {
  if (!process.env.ATTENTION_CRON_SECRET) {
    console.error("[cron/attention-escalations] ATTENTION_CRON_SECRET manquant");
    return NextResponse.json({ error: "Non configuré" }, { status: 503 });
  }

  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  // Ignorer toute tentative de now dans le body (prod / cron)
  let bodyNow: string | undefined;
  try {
    const body = (await request.json().catch(() => ({}))) as { now?: string };
    bodyNow = body.now;
  } catch {
    // ignore
  }

  const resolved = resolveAttentionProcessNow({
    requestedNow: bodyNow,
    forceRealNow: true,
  });

  try {
    const result = await runAttentionEscalationScheduler({ now: resolved.now });
    return NextResponse.json({
      ok: result.ok,
      processed: result.sheetsEvaluated,
      notificationsCreated:
        result.initialCreated + result.remindersCreated + result.escalationsCreated,
      remindersCreated: result.remindersCreated,
      escalationsCreated: result.escalationsCreated,
      initialCreated: result.initialCreated,
      duplicatesSkipped: result.duplicatesSkipped,
      tenantsProcessed: result.tenantsProcessed,
      errors: result.errors,
      skippedDueToLock: result.skippedDueToLock,
      startedAt: result.startedAt,
      finishedAt: result.finishedAt,
    });
  } catch (e) {
    console.error("[cron/attention-escalations]", e);
    return NextResponse.json({ error: "Erreur serveur", ok: false }, { status: 500 });
  }
}
