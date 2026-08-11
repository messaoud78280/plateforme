import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { BackLink } from "@/components/ui/BackLink";
import {
  requireCommercialSession,
  resolveCommercialOrgId,
} from "@/lib/commercial/access";
import { prisma } from "@/lib/prisma";
import { loadDealFinancialSummary } from "@/lib/commercial/deal-summary";
import { PrepareInvoiceForm } from "@/components/commercial/PrepareInvoiceForm";

export const dynamic = "force-dynamic";

export default async function PreparerFacturePage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  const session = await requireCommercialSession(
    "/dashboard/devis-facturation/factures/preparer",
  );
  const orgId = await resolveCommercialOrgId(session.user);
  const sp = await searchParams;
  const projectId = sp.projectId?.trim();
  if (!orgId || !projectId) notFound();

  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId: orgId },
    select: { id: true, title: true },
  });
  if (!project) notFound();

  const quotes = await prisma.commercialQuote.findMany({
    where: {
      organizationId: orgId,
      projectId: project.id,
      status: "ACCEPTED",
    },
    select: {
      id: true,
      number: true,
      subject: true,
      clientExternalOrgId: true,
    },
    orderBy: { acceptedAt: "desc" },
  });

  const options = [];
  for (const q of quotes) {
    const summary = await loadDealFinancialSummary(orgId, q.id);
    if (!summary) continue;
    options.push({
      id: q.id,
      number: q.number,
      subject: q.subject,
      clientExternalOrgId: q.clientExternalOrgId,
      remainingToInvoiceHt: summary.remainingToInvoiceHt,
      contratAccepteHt: summary.updatedMarketHt,
      invoicedHt: summary.invoicedHt,
    });
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <BackLink href="/dashboard/facturation">À facturer</BackLink>
      <PageHeader
        eyebrow="Gestion commerciale"
        title="Préparer la facture"
        description={`Chantier · ${project.title} — validation humaine obligatoire.`}
      />
      <PrepareInvoiceForm
        projectId={project.id}
        projectTitle={project.title}
        quotes={options}
      />
    </div>
  );
}
