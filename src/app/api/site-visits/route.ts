import { NextResponse } from "next/server";
import { getCachedServerSession } from "@/lib/auth/cached-session";
import { decideApiAccess } from "@/lib/equipe-acces/dashboard-policy";
import {
  canAccessSiteVisits,
  resolveSiteVisitsOrgId,
} from "@/lib/site-visits/access";
import { createSiteVisit, listSiteVisitKpis, listSiteVisits } from "@/lib/site-visits/service";
import { dateRangeFromPreset } from "@/lib/site-visits/types";
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
  const date = url.searchParams.get("date");
  const projectId = url.searchParams.get("projectId");
  const lot = url.searchParams.get("lot");
  const state = url.searchParams.get("state");
  const range = dateRangeFromPreset(date);

  const [visits, kpis] = await Promise.all([
    listSiteVisits({
      organizationId: orgId,
      status: status || null,
      q,
      responsibleId,
      from: from ? new Date(from) : range?.from ?? null,
      to: to ? new Date(to) : range?.to ?? null,
      projectId,
      lot,
      state,
    }),
    listSiteVisitKpis(orgId),
  ]);
  return NextResponse.json({ visits, kpis });
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
      lots: Array.isArray(body.lots) ? body.lots : null,
      zones: Array.isArray(body.zones) ? body.zones : null,
      constraints: body.constraints ?? null,
      prep: body.prep ?? null,
      estimatedDuration: body.estimatedDuration ?? null,
      missingLabels: Array.isArray(body.missingLabels) ? body.missingLabels : null,
    });
    return NextResponse.json({ visit }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 },
    );
  }
}
