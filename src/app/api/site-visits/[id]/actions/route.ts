import { NextResponse } from "next/server";
import { getCachedServerSession } from "@/lib/auth/cached-session";
import { decideApiAccess } from "@/lib/equipe-acces/dashboard-policy";
import {
  canAccessSiteVisits,
  resolveSiteVisitsOrgId,
} from "@/lib/site-visits/access";
import {
  addMissingInfo,
  finishSiteVisit,
  resolveMissingInfo,
} from "@/lib/site-visits/service";

export const dynamic = "force-dynamic";

async function gate() {
  const session = await getCachedServerSession();
  if (!session?.user?.id) return { error: NextResponse.json({ error: "Non authentifié" }, { status: 401 }) };
  const d = decideApiAccess(
    "/api/site-visits",
    session.user.personType,
    session.user.permissionProfile,
  );
  if (!d.ok) return { error: NextResponse.json({ error: d.error }, { status: d.status }) };
  if (!canAccessSiteVisits(session.user)) {
    return { error: NextResponse.json({ error: "Non autorisé" }, { status: 403 }) };
  }
  const orgId = await resolveSiteVisitsOrgId(session.user);
  if (!orgId) return { error: NextResponse.json({ error: "Organisation introuvable" }, { status: 404 }) };
  return { session, orgId };
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const g = await gate();
  if ("error" in g && g.error) return g.error;
  const { session, orgId } = g as { session: { user: { id: string } }; orgId: string };
  const { id } = await ctx.params;
  try {
    const body = await req.json();
    if (body.action === "finish") {
      const visit = await finishSiteVisit({
        organizationId: orgId,
        visitId: id,
        mode: body.mode === "incomplete" ? "incomplete" : "ready",
      });
      return NextResponse.json({ visit });
    }
    if (body.action === "add_missing") {
      const visit = await addMissingInfo({
        organizationId: orgId,
        visitId: id,
        label: String(body.label ?? ""),
      });
      return NextResponse.json({ visit }, { status: 201 });
    }
    if (body.action === "resolve_missing") {
      const visit = await resolveMissingInfo({
        organizationId: orgId,
        visitId: id,
        missingId: String(body.missingId ?? ""),
      });
      return NextResponse.json({ visit });
    }
    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 },
    );
  }
}
