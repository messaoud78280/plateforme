import { notFound } from "next/navigation";
import {
  requireCommercialSession,
  resolveCommercialOrgId,
} from "@/lib/commercial/access";
import { getQuoteDetail } from "@/lib/commercial/quotes";
import { loadDealFinancialSummary } from "@/lib/commercial/deal-summary";
import { QuoteEditor } from "@/components/commercial/QuoteEditor";
import { QuoteCommercialFlow } from "@/components/commercial/QuoteCommercialFlow";
import { QuoteAcceptedArchiveCard } from "@/components/commercial/QuoteAcceptedArchiveCard";
import { QuoteAmendmentsPanel } from "@/components/commercial/QuoteAmendmentsPanel";
import { roundMoney } from "@/lib/commercial/money";
import { prisma } from "@/lib/prisma";
import { loadAcceptedArchiveUi } from "@/lib/commercial/accepted-snapshot";
import { ensureCommercialOrgSettings } from "@/lib/commercial/settings";
import { d } from "@/lib/commercial/decimal";
import { VisitQuoteMeasurementsPanel } from "@/components/site-visits/VisitQuoteMeasurementsPanel";

export const dynamic = "force-dynamic";

export default async function DevisDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ fromVisit?: string }>;
}) {
  const session = await requireCommercialSession();
  const orgId = await resolveCommercialOrgId(session.user);
  const { id } = await params;
  const sp = await searchParams;
  if (!orgId) notFound();

  const quote = await getQuoteDetail(orgId, id);
  if (!quote) notFound();

  const canEdit =
    ["DRAFT", "TO_VALIDATE", "VALIDATED"].includes(quote.status) &&
    quote.currentVersion?.lockState === "DRAFT";

  const fromVisit = await prisma.siteVisit.findFirst({
    where: {
      organizationId: orgId,
      ...(sp.fromVisit
        ? { OR: [{ id: sp.fromVisit }, { commercialQuoteId: id }] }
        : { commercialQuoteId: id }),
    },
    select: { id: true, scheduledAt: true, siteName: true, clientName: true },
  });
  const fromVisitId = fromVisit?.id ?? sp.fromVisit ?? null;

  const [summary, invoiceStats, archive, settings] = await Promise.all([
    quote.status === "ACCEPTED" || quote.acceptedAt
      ? loadDealFinancialSummary(orgId, id)
      : null,
    prisma.commercialInvoice.findMany({
      where: {
        organizationId: orgId,
        quoteId: id,
        status: { notIn: ["CANCELLED", "DRAFT"] },
      },
      select: { amountPaid: true },
    }),
    quote.acceptedVersionId || quote.status === "ACCEPTED"
      ? loadAcceptedArchiveUi(orgId, id)
      : null,
    ensureCommercialOrgSettings(orgId),
  ]);

  const hasInvoice = invoiceStats.length > 0;
  const hasPayment = invoiceStats.some((i) => Number(i.amountPaid) > 0);
  const validityPassed =
    quote.validityDate &&
    ["SENT", "VIEWED"].includes(quote.status) &&
    new Date(quote.validityDate).getTime() < Date.now();

  const minMarginPercent =
    settings.minMarginPercent != null ? d(settings.minMarginPercent) : 15;

  return (
    <div className="space-y-4">
      <QuoteCommercialFlow
        status={quote.status}
        hasProject={Boolean(quote.projectId)}
        hasInvoice={hasInvoice}
        hasPayment={hasPayment}
      />
      {validityPassed ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-950">
          Validité dépassée — le statut stocké n’est pas modifié automatiquement.
        </p>
      ) : null}
      {fromVisitId ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-[13px] font-medium text-bework-navy">
            Issu de la visite
            {fromVisit?.scheduledAt
              ? ` du ${fromVisit.scheduledAt.toLocaleDateString("fr-FR")}`
              : ""}
            {fromVisit?.siteName || fromVisit?.clientName
              ? ` — ${fromVisit.siteName || fromVisit.clientName}`
              : ""}
          </p>
          <VisitQuoteMeasurementsPanel
            visitId={fromVisitId}
            quoteId={id}
            canEdit={canEdit}
          />
        </div>
      ) : null}
      <QuoteEditor
        initial={quote as never}
        canEdit={canEdit}
        acceptedPdfAvailable={Boolean(archive?.snapshot)}
        minMarginPercent={minMarginPercent}
      />
      {archive?.hasAcceptedVersion ? (
        <QuoteAcceptedArchiveCard
          quoteId={id}
          versionNumber={archive.versionNumber}
          acceptedAt={archive.acceptedAt}
          snapshot={archive.snapshot}
          historicalMissing={archive.historicalMissing}
        />
      ) : null}

      {summary ? (
        <>
          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-bold text-slate-900">
              {summary.quote.number}
              {summary.quote.projectTitle ? ` · ${summary.quote.projectTitle}` : ""}
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Contrat
                </p>
                <dl className="mt-2 space-y-1 text-sm">
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500">Devis initial</dt>
                    <dd className="tabular-nums font-semibold">
                      {roundMoney(summary.initialMarketHt, 2).toLocaleString("fr-FR")} €
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500">Avenants acceptés</dt>
                    <dd className="tabular-nums font-semibold">
                      {roundMoney(summary.acceptedAmendmentsHt, 2).toLocaleString("fr-FR")} €
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2 border-t border-slate-100 pt-1">
                    <dt className="font-semibold text-slate-800">Contrat accepté</dt>
                    <dd className="tabular-nums font-bold text-[#1e3a5f]">
                      {roundMoney(summary.updatedMarketHt, 2).toLocaleString("fr-FR")} €
                    </dd>
                  </div>
                  {summary.pendingAmendmentsHt > 0 ? (
                    <div className="flex justify-between gap-2 text-amber-800">
                      <dt>En attente</dt>
                      <dd className="tabular-nums font-semibold">
                        {roundMoney(summary.pendingAmendmentsHt, 2).toLocaleString("fr-FR")} €
                      </dd>
                    </div>
                  ) : null}
                </dl>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Facturation
                </p>
                <dl className="mt-2 space-y-1 text-sm">
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500">Facturé</dt>
                    <dd className="tabular-nums font-semibold">
                      {roundMoney(summary.invoicedHt, 2).toLocaleString("fr-FR")} €
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500">Reste à facturer</dt>
                    <dd className="tabular-nums font-bold">
                      {roundMoney(summary.remainingToInvoiceHt, 2).toLocaleString("fr-FR")} €
                    </dd>
                  </div>
                </dl>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Encaissements
                </p>
                <dl className="mt-2 space-y-1 text-sm">
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500">Encaissé</dt>
                    <dd className="tabular-nums font-semibold">
                      {roundMoney(summary.paidTtc, 2).toLocaleString("fr-FR")} €
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500">Reste à encaisser</dt>
                    <dd className="tabular-nums font-bold">
                      {roundMoney(summary.remainingToCollectTtc, 2).toLocaleString("fr-FR")} €
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </section>

          <QuoteAmendmentsPanel
            quoteId={id}
            quoteAccepted={quote.status === "ACCEPTED"}
            accepted={summary.amendmentsAccepted}
            pending={summary.amendmentsPending}
            closed={summary.amendmentsClosed}
          />
        </>
      ) : null}
    </div>
  );
}
