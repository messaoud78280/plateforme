/**
 * Métré & Préparation — accès. Réutilise les règles Visites & métrés (personas SEC-1),
 * aucune permission parallèle.
 */
import { NextResponse } from "next/server";
import { getCachedServerSession } from "@/lib/auth/cached-session";
import { decideApiAccess } from "@/lib/equipe-acces/dashboard-policy";
import { canAccessSiteVisits, resolveSiteVisitsOrgId } from "@/lib/site-visits/access";
import { PrepError } from "@/lib/preparation/service";

export const PREP_DASHBOARD_HREF = "/dashboard/visites-metres";

export type PrepApiContext = { userId: string; orgId: string };

export async function requirePrepApiContext(): Promise<
  { ok: true; ctx: PrepApiContext } | { ok: false; response: NextResponse }
> {
  const session = await getCachedServerSession();
  if (!session?.user?.id) {
    return { ok: false, response: NextResponse.json({ error: "Non authentifié" }, { status: 401 }) };
  }
  const gate = decideApiAccess("/api/prep-studies", session.user.personType, session.user.permissionProfile);
  if (!gate.ok) {
    return { ok: false, response: NextResponse.json({ error: gate.error }, { status: gate.status }) };
  }
  if (!canAccessSiteVisits(session.user)) {
    return { ok: false, response: NextResponse.json({ error: "Non autorisé" }, { status: 403 }) };
  }
  const orgId = await resolveSiteVisitsOrgId(session.user);
  if (!orgId) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Organisation introuvable" }, { status: 404 }),
    };
  }
  return { ok: true, ctx: { userId: session.user.id, orgId } };
}

export function prepErrorResponse(e: unknown): NextResponse {
  if (e instanceof PrepError) {
    return NextResponse.json({ error: e.message, issues: e.issues }, { status: e.status });
  }
  console.error("[prep-studies]", e);
  return NextResponse.json({ error: "Erreur serveur — réessayez" }, { status: 500 });
}

export async function readJsonBody(req: Request): Promise<Record<string, unknown>> {
  try {
    const body = await req.json();
    return body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  } catch {
    throw new PrepError("Requête invalide");
  }
}
