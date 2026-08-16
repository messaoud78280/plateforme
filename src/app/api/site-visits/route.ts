import { NextResponse } from "next/server";
import { getCachedServerSession } from "@/lib/auth/cached-session";
import { decideApiAccess } from "@/lib/equipe-acces/dashboard-policy";
import {
  canAccessSiteVisits,
  resolveSiteVisitsOrgId,
} from "@/lib/site-visits/access";
import { createSiteVisit, listSiteVisits } from "@/lib/site-visits/service";
import type { SiteVisitStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
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

  const url = new URL(req.url);
  const status = url.searchParams.get("status") as SiteVisitStatus | null;
  const q = url.searchParams.get("q");
  const responsibleId = url.searchParams.get("responsibleId");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  const visits = await listSiteVisits({
    organizationId: orgId,
    status: status || null,
    q,
    responsibleId,
    from: from ? new Date(from) : null,
    to: to ? new Date(to) : null,
  });
  return NextResponse.json({ visits });
}

export async function POST(req: Request) {
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

  try {
    const body = await req.json();
    const visit = await createSiteVisit({
      organizationId: orgId,
      actorUserId: session.user.id,
      clientName: String(body.clientName ?? ""),
      siteAddress: String(body.siteAddress ?? ""),
      subject: String(body.subject ?? ""),
      siteName: body.siteName ?? null,
      contactName: body.contactName ?? null,
      contactPhone: body.contactPhone ?? null,
      clientExternalOrgId: body.clientExternalOrgId ?? null,
      projectId: body.projectId ?? null,
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
      responsibleId: body.responsibleId ?? null,
      clientNeed: body.clientNeed ?? null,
      comments: body.comments ?? null,
    });
    return NextResponse.json({ visit }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 },
    );
  }
}
