import { NextResponse } from "next/server";
import { getCachedServerSession } from "@/lib/auth/cached-session";
import { decideApiAccess } from "@/lib/equipe-acces/dashboard-policy";
import {
  canAccessSiteVisits,
  canCreateQuoteFromVisit,
  resolveSiteVisitsOrgId,
} from "@/lib/site-visits/access";
import {
  addQuoteLineFromMeasurement,
  createOrOpenQuoteFromVisit,
} from "@/lib/site-visits/create-quote";

export const dynamic = "force-dynamic";

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
  if (!canAccessSiteVisits(session.user) || !canCreateQuoteFromVisit(session.user)) {
    return NextResponse.json(
      { error: "Permission devis requise" },
      { status: 403 },
    );
  }
  const orgId = await resolveSiteVisitsOrgId(session.user);
  if (!orgId) {
    return NextResponse.json({ error: "Organisation introuvable" }, { status: 404 });
  }
  const { id } = await ctx.params;
  try {
    const body = await req.json().catch(() => ({}));
    if (body.action === "add_line") {
      const result = await addQuoteLineFromMeasurement({
        organizationId: orgId,
        visitId: id,
        quoteId: String(body.quoteId ?? ""),
        measurementId: String(body.measurementId ?? ""),
        workItemId: String(body.workItemId ?? ""),
        forceUnitMismatch: Boolean(body.forceUnitMismatch),
      });
      return NextResponse.json(result, { status: 201 });
    }
    const result = await createOrOpenQuoteFromVisit({
      organizationId: orgId,
      visitId: id,
      actorUserId: session.user.id,
    });
    return NextResponse.json(result, {
      status: result.action === "created" ? 201 : 200,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 },
    );
  }
}
