import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { BackLink } from "@/components/ui/BackLink";
import {
  requireCommercialSession,
  resolveCommercialOrgId,
} from "@/lib/commercial/access";
import { loadAmendmentDetail } from "@/lib/commercial/amendment-billing";
import { loadDealFinancialSummary } from "@/lib/commercial/deal-summary";
import {
  COMMERCIAL_AMENDMENT_STATUS_LABELS,
  COMMERCIAL_INVOICE_STATUS_LABELS,
  roundMoney,
} from "@/lib/commercial/money";
import { AmendmentActions } from "@/components/commercial/AmendmentActions";

export const dynamic = "force-dynamic";

export default async function AvenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireCommercialSession();
  const orgId = await resolveCommercialOrgId(session.user);
  const { id } = await params;
  if (!orgId) notFound();

  const amendment = await loadAmendmentDetail(orgId, id);
  if (!amendment) notFound();

  const deal = await loadDealFinancialSummary(orgId, amendment.quote.id);

  const project = amendment.quote.project;
  const client =
    amendment.quote.clientExternalOrg?.tradeName ||
    amendment.quote.clientExternalOrg?.name ||
    "—";

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <BackLink href={`/dashboard/devis-facturation/devis/${amendment.quote.id}`}>
        Retour devis {amendment.quote.number}
      </BackLink>
      <PageHeader
        eyebrow="Devis & Facturation · Avenant"
        title={amendment.number}
        description={amendment.subject}
      />

      <div className="flex flex-wrap gap-2">
        <a
          href={`/api/commercial/amendments/${amendment.id}/pdf`}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-[#1e3a5f]"
        >
          {amendment.status === "ACCEPTED" ? "PDF avenant" : "Aperçu PDF (projection)"}
        </a>
      </div>

      {amendment.status !== "ACCEPTED" ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
          Projection — non contractuel tant que non accepté.
        </p>
      ) : null}

      <section className="rounded-xl border border-slate-200 bg-white p-4 space-y-2 text-sm">
        <p>
          <span className="text-slate-500">Statut · </span>
          {COMMERCIAL_AMENDMENT_STATUS_LABELS[amendment.status] ?? amendment.status}
        </p>
        <p>
          <span className="text-slate-500">Montant HT · </span>
          <span className="font-bold tabular-nums">
            {roundMoney(amendment.totalSellHt, 2).toLocaleString("fr-FR")} €
          </span>
        </p>
        <p>
          <span className="text-slate-500">TVA · </span>
          {roundMoney(amendment.totalVat, 2).toLocaleString("fr-FR")} €
        </p>
        <p>
          <span className="text-slate-500">TTC · </span>
          {roundMoney(amendment.totalTtc, 2).toLocaleString("fr-FR")} €
        </p>
        <p>
          <span className="text-slate-500">Devis · </span>
          <Link
            href={`/dashboard/devis-facturation/devis/${amendment.quote.id}`}
            className="font-semibold text-[#1d4ed8]"
          >
            {amendment.quote.number}
          </Link>
        </p>
        <p>
          <span className="text-slate-500">Chantier · </span>
          {project ? (
            <Link
              href={`/dashboard/projets/${project.id}`}
              className="font-semibold text-[#1d4ed8]"
            >
              {project.title}
            </Link>
          ) : (
            "Aucun chantier lié"
          )}
        </p>
        <p>
          <span className="text-slate-500">Client · </span>
          {client}
        </p>
        {amendment.acceptedAt ? (
          <p>
            <span className="text-slate-500">Accepté le · </span>
            {new Date(amendment.acceptedAt).toLocaleString("fr-FR")}
          </p>
        ) : null}
      </section>

      {deal ? (
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-bold text-slate-900">Synthèse affaire</h2>
          <dl className="mt-2 grid gap-2 sm:grid-cols-3 text-sm">
            <div>
              <dt className="text-xs text-slate-500">Marché initial HT</dt>
              <dd className="font-semibold tabular-nums">
                {roundMoney(deal.initialMarketHt, 2).toLocaleString("fr-FR")} €
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Avenants acceptés HT</dt>
              <dd className="font-semibold tabular-nums">
                {roundMoney(deal.acceptedAmendmentsHt, 2).toLocaleString("fr-FR")} €
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Marché actualisé HT</dt>
              <dd className="font-bold tabular-nums text-[#1e3a5f]">
                {roundMoney(deal.updatedMarketHt, 2).toLocaleString("fr-FR")} €
              </dd>
            </div>
          </dl>
          {deal.pendingAmendmentsHt > 0 ? (
            <p className="mt-2 text-xs text-amber-800">
              Projections en cours (non acceptées) ·{" "}
              {roundMoney(deal.pendingAmendmentsHt, 2).toLocaleString("fr-FR")} € HT — non
              inclus dans le marché actualisé.
            </p>
          ) : null}
        </section>
      ) : null}

      <AmendmentActions amendmentId={amendment.id} status={amendment.status} />

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-bold text-slate-900">Lignes</h2>
        {amendment.lines.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Aucune ligne.</p>
        ) : (
          <ul className="mt-2 divide-y divide-slate-100">
            {amendment.lines.map((l) => (
              <li key={l.id} className="flex justify-between gap-2 py-2 text-sm">
                <span>
                  {l.designation}{" "}
                  <span className="text-slate-400">
                    {l.quantity} {l.unit}
                  </span>
                </span>
                <span className="tabular-nums font-semibold">
                  {roundMoney(l.lineSellHt, 2).toLocaleString("fr-FR")} €
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {amendment.status === "ACCEPTED" ? (
        <section className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
          <h2 className="text-sm font-bold text-slate-900">Facturation</h2>
          <dl className="grid gap-2 sm:grid-cols-3 text-sm">
            <div>
              <dt className="text-xs text-slate-500">Accepté HT</dt>
              <dd className="font-semibold">
                {roundMoney(amendment.billing.acceptedAmountHt, 2).toLocaleString("fr-FR")} €
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Facturé HT</dt>
              <dd className="font-semibold">
                {roundMoney(amendment.billing.invoicedAmountHt, 2).toLocaleString("fr-FR")} €
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Reste à facturer HT</dt>
              <dd className="font-bold text-[#1e3a5f]">
                {roundMoney(amendment.billing.remainingToInvoiceHt, 2).toLocaleString("fr-FR")} €
              </dd>
            </div>
          </dl>
          {amendment.billing.isBillable ? (
            <Link
              href={`/dashboard/devis-facturation/factures/preparer?amendmentId=${amendment.id}`}
              className="inline-flex rounded-lg bg-[#1e3a5f] px-3 py-2 text-xs font-bold text-white"
            >
              Préparer la facture
            </Link>
          ) : (
            <p className="text-xs text-slate-500">
              Avenant entièrement facturé — non proposé à nouveau.
            </p>
          )}
          {amendment.invoices.length > 0 ? (
            <ul className="mt-2 divide-y divide-slate-100 text-sm">
              {amendment.invoices.map((inv) => (
                <li key={inv.id} className="flex justify-between py-2">
                  <Link
                    href={`/dashboard/devis-facturation/factures/${inv.id}`}
                    className="font-semibold text-[#1d4ed8]"
                  >
                    {inv.number}
                  </Link>
                  <span className="text-slate-600">
                    {COMMERCIAL_INVOICE_STATUS_LABELS[inv.status] ?? inv.status} ·{" "}
                    {roundMoney(inv.totalSellHt, 2).toLocaleString("fr-FR")} € HT
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
