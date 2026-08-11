import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { BackLink } from "@/components/ui/BackLink";
import {
  requireCommercialSession,
  resolveCommercialOrgId,
} from "@/lib/commercial/access";
import { prisma } from "@/lib/prisma";
import { loadDealFinancialSummary } from "@/lib/commercial/deal-summary";
import { loadAmendmentDetail } from "@/lib/commercial/amendment-billing";
import { PrepareInvoiceForm } from "@/components/commercial/PrepareInvoiceForm";
import { PrepareAmendmentInvoiceForm } from "@/components/commercial/PrepareAmendmentInvoiceForm";

export const dynamic = "force-dynamic";

export default async function PreparerFacturePage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string; amendmentId?: string }>;
}) {
  const session = await requireCommercialSession(
    "/dashboard/devis-facturation/factures/preparer",
  );
  const orgId = await resolveCommercialOrgId(session.user);
  const sp = await searchParams;
  if (!orgId) notFound();

  const amendmentId = sp.amendmentId?.trim();
  if (amendmentId) {
    const amendment = await loadAmendmentDetail(orgId, amendmentId);
    if (!amendment) notFound();
    return (
      <div className="mx-auto max-w-xl space-y-6">
        <BackLink href={`/dashboard/devis-facturation/avenants/${amendment.id}`}>
          Retour avenant
        </BackLink>
        <PageHeader
          eyebrow="Devis & Facturation"
          title="Préparer la facture"
          description={`Avenant ${amendment.number} — validation humaine obligatoire.`}
        />
        <PrepareAmendmentInvoiceForm
          amendmentId={amendment.id}
          amendmentNumber={amendment.number}
          subject={amendment.subject}
          quoteId={amendment.quote.id}
          projectId={amendment.quote.projectId}
          clientExternalOrgId={amendment.quote.clientExternalOrgId}
          remainingToInvoiceHt={amendment.billing.remainingToInvoiceHt}
        />
      </div>
    );
  }

  const projectId = sp.projectId?.trim();
  if (!projectId) notFound();

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
        eyebrow="Devis & Facturation"
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
