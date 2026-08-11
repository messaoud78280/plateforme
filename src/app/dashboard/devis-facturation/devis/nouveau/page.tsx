import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  requireCommercialSession,
  resolveCommercialOrgId,
} from "@/lib/commercial/access";
import { prisma } from "@/lib/prisma";
import { CreateQuoteForm } from "@/components/commercial/CreateQuoteForm";

export const dynamic = "force-dynamic";

export default async function NouveauDevisPage() {
  const session = await requireCommercialSession(
    "/dashboard/devis-facturation/devis/nouveau",
  );
  const orgId = await resolveCommercialOrgId(session.user);
  if (!orgId) redirect("/dashboard/devis-facturation");

  const [clients, projects] = await Promise.all([
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
      take: 40,
    }),
  ]);

  // Fallback: aussi les orgs externes sans filtre type strict si vide
  const clientsFinal =
    clients.length > 0
      ? clients
      : await prisma.externalOrganization.findMany({
          where: { hostOrganizationId: orgId, status: "ACTIVE" },
          select: { id: true, name: true, tradeName: true },
          orderBy: { name: "asc" },
          take: 100,
        });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Devis"
        title="Nouveau devis"
        description="Client et chantier optionnels — vous pourrez rattacher plus tard."
      />
      <CreateQuoteForm clients={clientsFinal} projects={projects} />
    </div>
  );
}
