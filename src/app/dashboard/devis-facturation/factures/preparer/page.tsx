import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { BackLink } from "@/components/ui/BackLink";
import {
  requireCommercialSession,
  resolveCommercialOrgId,
} from "@/lib/commercial/access";
import { loadDealFinancialSummary } from "@/lib/commercial/deal-summary";
import { loadAmendmentDetail } from "@/lib/commercial/amendment-billing";
import { PrepareAmendmentInvoiceForm } from "@/components/commercial/PrepareAmendmentInvoiceForm";
import { PrepareBillingFromOps } from "@/components/facturation/PrepareBillingFromOps";
import { PrepareInvoiceHub } from "@/components/commercial/PrepareInvoiceHub";
import { resolvePrepareBillingContext } from "@/lib/facturation/prepare-billing";
import { loadPrepareInvoiceSources } from "@/lib/commercial/prepare-invoice-hub";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function PreparerFacturePage({
  searchParams,
}: {
  searchParams: Promise<{
    projectId?: string;
    amendmentId?: string;
    sheetId?: string;
    quoteId?: string;
  }>;
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

  const projectId = sp.projectId?.trim() || null;
  const sheetId = sp.sheetId?.trim() || null;

  // Sans contexte query → hub de préparation (sidebar « Préparer une facture »)
  if (!projectId && !sheetId) {
    const [hub, clients, projects] = await Promise.all([
      loadPrepareInvoiceSources(orgId),
      prisma.externalOrganization.findMany({
        where: {
          hostOrganizationId: orgId,
          type: { in: ["CLIENT_EXT", "CLIENT"] },
          status: "ACTIVE",
        },
        select: { id: true, name: true, tradeName: true, city: true },
        orderBy: { name: "asc" },
        take: 200,
      }),
      prisma.project.findMany({
        where: { organizationId: orgId },
        select: { id: true, title: true },
        orderBy: { updatedAt: "desc" },
        take: 80,
      }),
    ]);

    return (
      <PrepareInvoiceHub
        sources={hub.sources}
        clients={clients}
        projects={projects}
        defaultVatRate={hub.defaultVatRate}
        defaultCurrency={hub.defaultCurrency}
      />
    );
  }

  const context = await resolvePrepareBillingContext({
    orgId,
    projectId,
    sheetId,
    quoteId: sp.quoteId?.trim() || null,
  });

  const invoiceQuotes = [];
  for (const q of context.quotes) {
    const summary = await loadDealFinancialSummary(orgId, q.id);
    if (!summary) continue;
    invoiceQuotes.push({
      id: q.id,
      number: q.number,
      subject: q.subject,
      clientExternalOrgId: q.clientExternalOrgId,
      remainingToInvoiceHt: summary.remainingToInvoiceHt,
      contratAccepteHt: summary.updatedMarketHt,
      invoicedHt: summary.invoicedHt,
    });
  }

  const backHref = context.sheet
    ? `/dashboard/fiches-suivi/${context.sheet.id}`
    : context.project
      ? `/dashboard/projets/${context.project.id}`
      : "/dashboard/facturation";

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <BackLink href={backHref}>
        {context.sheet ? "Retour à la fiche" : context.project ? "Retour au chantier" : "À facturer"}
      </BackLink>
      <PageHeader
        eyebrow="Devis & Facturation"
        title="Préparer la facturation"
        description={
          context.project
            ? `${context.project.title} — le montant vient du moteur Commercial, pas de la fiche.`
            : "Contexte commercial à compléter."
        }
      />
      <PrepareBillingFromOps context={context} invoiceQuotes={invoiceQuotes} />
    </div>
  );
}
