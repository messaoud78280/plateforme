/**
 * Contexte TAKEOFF CREATE depuis une visite (project facultatif).
 * POST → { text, context, sourcesFingerprint }
 */
import { NextResponse } from "next/server";
import { getCachedServerSession } from "@/lib/auth/cached-session";
import { decideApiAccess } from "@/lib/equipe-acces/dashboard-policy";
import {
  canAccessSiteVisits,
  resolveSiteVisitsOrgId,
} from "@/lib/site-visits/access";
import { buildTakeoffCreateContextFromVisit } from "@/lib/bework-context/adapt-takeoff-create";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  const session = await getCachedServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const gate = decideApiAccess(
    "/api/site-visits",
    session.user.personType,
    session.user.permissionProfile,
  );
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
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
    const context = await buildTakeoffCreateContextFromVisit({
      orgId,
      visitId,
    });
    return NextResponse.json({
      ok: true,
      text: JSON.stringify(context, null, 2),
      context,
      interactionMode: context.interaction_mode,
      sourcesFingerprint:
        context.interaction_mode === "CREATE"
          ? context.sources_fingerprint
          : null,
      projectId: context.project?.id ?? null,
      studyId:
        context.interaction_mode === "MODIFY" ? context.target.id : null,
      version:
        context.interaction_mode === "MODIFY" ? context.target.version : 0,
    });
  } catch (e) {
    const err = e as { message?: string; code?: string; status?: number; studyId?: string };
    return NextResponse.json(
      {
        ok: false,
        error: err.message ?? "Contexte indisponible",
        code: err.code ?? "CONTEXT_ERROR",
        studyId: err.studyId,
      },
      { status: err.status ?? 500 },
    );
  }
}
