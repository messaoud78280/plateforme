import { NextResponse } from "next/server";
import { getCachedServerSession } from "@/lib/auth/cached-session";
import { decideApiAccess } from "@/lib/equipe-acces/dashboard-policy";
import {
  canAccessSiteVisits,
  resolveSiteVisitsOrgId,
} from "@/lib/site-visits/access";
import { prisma } from "@/lib/prisma";
import { CHANTIER_STATUS_LABELS } from "@/lib/chantier-dossier/constants";
import type { ChantierStatus } from "@prisma/client";
import {
  filterLinkableProjects,
  type LinkableProject,
} from "@/lib/site-visits/link-project";

export const dynamic = "force-dynamic";

/**
 * GET /api/site-visits/linkable-projects?q=
 * Chantiers de l'organisation courante (visite) — recherche locale.
 */
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

  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";

  const rows = await prisma.project.findMany({
    where: { organizationId: orgId, archivedAt: null },
    select: {
      id: true,
      title: true,
      siteAddress: true,
      siteCity: true,
      chantierStatus: true,
      client: { select: { name: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 120,
  });

  const projects: LinkableProject[] = rows.map((p) => ({
    id: p.id,
    title: p.title,
    siteAddress: p.siteAddress,
    siteCity: p.siteCity,
    chantierStatus: p.chantierStatus,
    statusLabel:
      CHANTIER_STATUS_LABELS[p.chantierStatus as ChantierStatus] ??
      p.chantierStatus ??
      "—",
    clientName: p.client?.name ?? null,
  }));

  return NextResponse.json({
    projects: filterLinkableProjects(projects, q).slice(0, 40),
  });
}
