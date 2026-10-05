import { NextResponse } from "next/server";
import { getCachedServerSession } from "@/lib/auth/cached-session";
import { decideApiAccess } from "@/lib/equipe-acces/dashboard-policy";
import {
  canAccessSiteVisits,
  resolveSiteVisitsOrgId,
} from "@/lib/site-visits/access";
import {
  buildCreateProjectFromVisitDraft,
  createProjectFromVisit,
} from "@/lib/site-visits/create-project-from-visit";

export const dynamic = "force-dynamic";

/**
 * GET — prévisualisation des champs préremplis (aucune écriture).
 * POST — créer le chantier + rattacher la visite (transaction + idempotent).
 */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
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
  const { id } = await ctx.params;
  const draft = await buildCreateProjectFromVisitDraft({
    organizationId: orgId,
    visitId: id,
  });
  if (!draft) {
    return NextResponse.json({ error: "Visite introuvable" }, { status: 404 });
  }
  return NextResponse.json({ draft });
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
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
  const { id } = await ctx.params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  try {
    const result = await createProjectFromVisit({
      organizationId: orgId,
      visitId: id,
      actorUserId: session.user.id,
      title: String(body.title ?? ""),
      description:
        typeof body.description === "string" ? body.description : null,
      siteAddress:
        typeof body.siteAddress === "string" ? body.siteAddress : null,
      siteCity: typeof body.siteCity === "string" ? body.siteCity : null,
      zipCode: typeof body.zipCode === "string" ? body.zipCode : null,
      scopes: Array.isArray(body.scopes)
        ? body.scopes.filter((x): x is string => typeof x === "string")
        : null,
      assignedToId:
        typeof body.assignedToId === "string" ? body.assignedToId : null,
    });
    return NextResponse.json(
      {
        ok: true,
        action: result.action,
        projectId: result.projectId,
        projectTitle: result.projectTitle,
        projectHref: result.projectHref,
        visit: result.visit,
        scopesCreated: result.scopesCreated,
        clientExternalOrgId: result.clientExternalOrgId,
        clientCreated: result.clientCreated,
      },
      { status: result.action === "created" ? 201 : 200 },
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 },
    );
  }
}
