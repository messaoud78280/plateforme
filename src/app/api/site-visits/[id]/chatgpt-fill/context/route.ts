/**
 * Contexte CREATE / remplissage visite — lecture seule.
 * POST → { text, context, sourcesFingerprint }
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  canAccessSiteVisits,
  resolveSiteVisitsOrgId,
} from "@/lib/site-visits/access";
import { buildVisitCreateContext } from "@/lib/bework-context/adapt-visit-create";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  if (!canAccessSiteVisits(session.user)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  const orgId = await resolveSiteVisitsOrgId(session.user);
  if (!orgId) {
    return NextResponse.json({ error: "Organisation introuvable" }, { status: 404 });
  }
  const { id: visitId } = await ctx.params;
  try {
    const context = await buildVisitCreateContext({ orgId, visitId });
    const text = JSON.stringify(context, null, 2);
    return NextResponse.json({
      ok: true,
      text,
      context,
      sourcesFingerprint: context.sources_fingerprint,
    });
  } catch (e) {
    const err = e as { message?: string; code?: string; status?: number };
    return NextResponse.json(
      {
        ok: false,
        error: err.message ?? "Contexte indisponible",
        code: err.code ?? "CONTEXT_ERROR",
      },
      { status: err.status ?? 500 },
    );
  }
}
