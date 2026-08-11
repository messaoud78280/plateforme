import { notFound } from "next/navigation";
import {
  requireCommercialSession,
  resolveCommercialOrgId,
} from "@/lib/commercial/access";
import { getQuoteDetail } from "@/lib/commercial/quotes";
import { loadDealFinancialSummary } from "@/lib/commercial/deal-summary";
import { QuoteEditor } from "@/components/commercial/QuoteEditor";
import { QuoteCommercialFlow } from "@/components/commercial/QuoteCommercialFlow";
import { roundMoney } from "@/lib/commercial/money";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DevisDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireCommercialSession();
  const orgId = await resolveCommercialOrgId(session.user);
  const { id } = await params;
  if (!orgId) notFound();

  const quote = await getQuoteDetail(orgId, id);
  if (!quote) notFound();

  const canEdit =
    ["DRAFT", "TO_VALIDATE", "VALIDATED"].includes(quote.status) &&
    quote.currentVersion?.lockState === "DRAFT";

  const [summary, invoiceStats] = await Promise.all([
    quote.status === "ACCEPTED" ? loadDealFinancialSummary(orgId, id) : null,
    prisma.commercialInvoice.findMany({
      where: {
        organizationId: orgId,
        quoteId: id,
        status: { notIn: ["CANCELLED", "DRAFT"] },
      },
      select: { amountPaid: true },
    }),
  ]);

  const hasInvoice = invoiceStats.length > 0;
  const hasPayment = invoiceStats.some((i) => Number(i.amountPaid) > 0);
  const validityPassed =
    quote.validityDate &&
    ["SENT", "VIEWED"].includes(quote.status) &&
    new Date(quote.validityDate).getTime() < Date.now();

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
      <QuoteEditor initial={quote as never} canEdit={canEdit} />
      {summary ? (
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-bold text-slate-900">Synthèse financière</h2>
          <dl className="mt-3 grid gap-2 sm:grid-cols-3 text-sm">
            <div>
              <dt className="text-xs text-slate-500">Devis initial HT</dt>
              <dd className="font-semibold">
                {roundMoney(summary.initialMarketHt, 2).toLocaleString("fr-FR")} €
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Avenants acceptés HT</dt>
              <dd className="font-semibold">
                {roundMoney(summary.acceptedAmendmentsHt, 2).toLocaleString("fr-FR")} €
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Avenants en attente HT</dt>
              <dd className="font-semibold text-amber-800">
                {roundMoney(summary.pendingAmendmentsHt, 2).toLocaleString("fr-FR")} €
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Contrat accepté HT</dt>
              <dd className="font-bold text-[#1e3a5f]">
                {roundMoney(summary.updatedMarketHt, 2).toLocaleString("fr-FR")} €
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Facturé HT</dt>
              <dd className="font-semibold">
                {roundMoney(summary.invoicedHt, 2).toLocaleString("fr-FR")} €
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Encaissé TTC</dt>
              <dd className="font-semibold">
                {roundMoney(summary.paidTtc, 2).toLocaleString("fr-FR")} €
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Reste à facturer HT</dt>
              <dd className="font-semibold">
                {roundMoney(summary.remainingToInvoiceHt, 2).toLocaleString("fr-FR")} €
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Reste à encaisser TTC</dt>
              <dd className="font-semibold">
                {roundMoney(summary.remainingToCollectTtc, 2).toLocaleString("fr-FR")} €
              </dd>
            </div>
          </dl>
          {summary.amendmentsAccepted.length + summary.amendmentsPending.length > 0 ? (
            <div className="mt-4 border-t border-slate-100 pt-3">
              <p className="text-xs font-bold uppercase text-slate-500">Avenants</p>
              <ul className="mt-2 space-y-1 text-sm">
                {summary.amendmentsAccepted.map((a) => (
                  <li key={a.id} className="flex justify-between gap-2">
                    <span>
                      {a.number} · {a.subject}{" "}
                      <span className="text-emerald-700">(accepté)</span>
                    </span>
                    <span className="tabular-nums">
                      +{roundMoney(a.totalSellHt, 2).toLocaleString("fr-FR")} €
                    </span>
                  </li>
                ))}
                {summary.amendmentsPending.map((a) => (
                  <li key={a.id} className="flex justify-between gap-2 text-amber-900">
                    <span>
                      {a.number} · {a.subject} (en attente)
                    </span>
                    <span className="tabular-nums">
                      +{roundMoney(a.totalSellHt, 2).toLocaleString("fr-FR")} €
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
