import { notFound } from "next/navigation";
import {
  requireCommercialSession,
  resolveCommercialOrgId,
} from "@/lib/commercial/access";
import { getQuoteDetail } from "@/lib/commercial/quotes";
import { loadDealFinancialSummary } from "@/lib/commercial/deal-summary";
import { QuoteEditor } from "@/components/commercial/QuoteEditor";
import { roundMoney } from "@/lib/commercial/money";

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

  const summary =
    quote.status === "ACCEPTED"
      ? await loadDealFinancialSummary(orgId, id)
      : null;

  return (
    <div className="space-y-4">
      <QuoteEditor initial={quote as never} canEdit={canEdit} />
      {summary ? (
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-bold text-slate-900">Synthèse financière</h2>
          <dl className="mt-3 grid gap-2 sm:grid-cols-3 text-sm">
            <div>
              <dt className="text-xs text-slate-500">Marché initial</dt>
              <dd className="font-semibold">
                {roundMoney(summary.initialMarketHt, 2).toLocaleString("fr-FR")} €
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Avenants acceptés</dt>
              <dd className="font-semibold">
                {roundMoney(summary.acceptedAmendmentsHt, 2).toLocaleString("fr-FR")} €
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Marché actualisé</dt>
              <dd className="font-semibold">
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
              <dt className="text-xs text-slate-500">Reste à facturer</dt>
              <dd className="font-semibold">
                {roundMoney(summary.remainingToInvoiceHt, 2).toLocaleString("fr-FR")} €
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Reste à encaisser</dt>
              <dd className="font-semibold">
                {roundMoney(summary.remainingToCollectTtc, 2).toLocaleString("fr-FR")} €
              </dd>
            </div>
          </dl>
        </section>
      ) : null}
    </div>
  );
}
