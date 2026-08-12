import { redirect } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  requireCommercialSession,
  resolveCommercialOrgId,
} from "@/lib/commercial/access";
import { prisma } from "@/lib/prisma";
import { CreateQuoteForm } from "@/components/commercial/CreateQuoteForm";
import { ensureCommercialOrgSettings } from "@/lib/commercial/settings";
import { d } from "@/lib/commercial/decimal";

export const dynamic = "force-dynamic";

export default async function NouveauDevisPage() {
  const session = await requireCommercialSession(
    "/dashboard/devis-facturation/devis/nouveau",
  );
  const orgId = await resolveCommercialOrgId(session.user);
  if (!orgId) redirect("/dashboard/devis-facturation");

  const [clients, projects, settings, quotesWithProjects] = await Promise.all([
    prisma.externalOrganization.findMany({
      where: {
        hostOrganizationId: orgId,
        type: { in: ["CLIENT_EXT", "CLIENT"] },
        status: "ACTIVE",
      },
      select: { id: true, name: true, tradeName: true },
      orderBy: { name: "asc" },
      take: 100,
    }),
    prisma.project.findMany({
      where: { organizationId: orgId },
      select: { id: true, title: true, siteAddress: true, siteCity: true },
      orderBy: { updatedAt: "desc" },
      take: 80,
    }),
    ensureCommercialOrgSettings(orgId),
    prisma.commercialQuote.findMany({
      where: {
        organizationId: orgId,
        projectId: { not: null },
        clientExternalOrgId: { not: null },
      },
      select: { projectId: true, clientExternalOrgId: true },
      take: 500,
    }),
  ]);

  const clientsFinal =
    clients.length > 0
      ? clients
      : await prisma.externalOrganization.findMany({
          where: { hostOrganizationId: orgId, status: "ACTIVE" },
          select: { id: true, name: true, tradeName: true },
          orderBy: { name: "asc" },
          take: 100,
        });

  const linkedByProject = new Map<string, Set<string>>();
  for (const q of quotesWithProjects) {
    if (!q.projectId || !q.clientExternalOrgId) continue;
    const set = linkedByProject.get(q.projectId) ?? new Set();
    set.add(q.clientExternalOrgId);
    linkedByProject.set(q.projectId, set);
  }

  const projectsWithLinks = projects.map((p) => ({
    ...p,
    linkedClientIds: [...(linkedByProject.get(p.id) ?? [])],
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader
          eyebrow="Devis & Facturation · Devis commerciaux"
          title="Nouveau devis"
          description="Client et chantier optionnels — rattachement possible après acceptation."
        />
        <Link
          href="/dashboard/devis-facturation/devis"
          className="text-sm font-semibold text-slate-600 underline"
        >
          ← Liste des devis
        </Link>
      </div>
      <CreateQuoteForm
        clients={clientsFinal}
        projects={projectsWithLinks}
        defaultValidityDays={settings.defaultValidityDays}
        defaultVatRate={d(settings.defaultVatRate)}
      />
    </div>
  );
}
