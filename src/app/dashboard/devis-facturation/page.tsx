import Link from "next/link";
import {
  requireCommercialSession,
  resolveCommercialOrgId,
} from "@/lib/commercial/access";
import { prisma } from "@/lib/prisma";
import { d } from "@/lib/commercial/decimal";
import {
  COMMERCIAL_INVOICE_STATUS_LABELS,
  COMMERCIAL_QUOTE_STATUS_LABELS,
  roundMoney,
} from "@/lib/commercial/money";
import { loadCommercialDashboardBundle } from "@/lib/commercial/dashboard-bundle";
import { quoteNextActionLabel } from "@/lib/commercial/dashboard-kpis";
import { cn } from "@/lib/cn";

export const dynamic = "force-dynamic";

function money(n: number) {
  return roundMoney(n, 2).toLocaleString("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export default async function DevisFacturationDashboardPage() {
  const session = await requireCommercialSession();
  const orgId = await resolveCommercialOrgId(session.user);
  if (!orgId) return null;

  const [bundle, quotes] = await Promise.all([
    loadCommercialDashboardBundle(orgId),
    prisma.commercialQuote.findMany({
      where: { organizationId: orgId },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        id: true,
        number: true,
        status: true,
        totalSellHt: true,
        projectId: true,
        validityDate: true,
        clientExternalOrg: { select: { name: true, tradeName: true } },
        project: { select: { title: true } },
      },
    }),
  ]);

  if (bundle.quoteCount === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-bework-navy/20 bg-bework-navy-soft px-6 py-16 text-center">
        <p className="text-lg font-semibold text-slate-900">
          Créez votre premier devis
        </p>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
          Puis suivez-le jusqu’à l’encaissement, sans ressaisie.
        </p>
        <Link
          href="/dashboard/devis-facturation/devis/nouveau"
          className="btn-cc-primary mt-6 inline-flex rounded-xl px-5 py-3 text-sm font-bold"
        >
          + Nouveau devis
        </Link>
      </div>
    );
  }

  const retardHot = bundle.enRetardTtc > 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="bw-kpi-hero rounded-2xl p-6 lg:col-span-5">
          <p className="text-[13px] font-medium text-white/75">À encaisser</p>
          <p className="mt-2 text-4xl font-semibold tracking-tight tabular-nums text-white">
            {money(bundle.aEncaisserTtc)} €
          </p>
          <p className="mt-1 text-[12px] text-white/60">TTC — reste dû ouvert</p>
          {retardHot ? (
            <p className="mt-4 text-[13px] font-medium text-amber-200">
              dont {money(bundle.enRetardTtc)} € en retard
            </p>
          ) : null}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:col-span-7 lg:grid-cols-3">
          {[
            {
              label: "Devis en attente",
              value: String(bundle.envoyes),
              hint: `${money(bundle.pipelineDevisHt)} € HT pipeline`,
              card: "bw-surface-tinted-violet",
              valueClass: "text-bework-intel",
            },
            {
              label: "Devis acceptés",
              value: `${money(bundle.devisAcceptesHt)} €`,
              hint: "HT — hors avenants",
              card: "bw-surface-tinted-ok",
              valueClass: "text-bework-ok",
            },
            {
              label: "Facturé ce mois",
              value: `${money(bundle.factureMoisHt)} €`,
              hint: "HT",
              card: "bw-kpi-finance",
              valueClass: "text-bework-cyan",
            },
            {
              label: "Encaissé ce mois",
              value: `${money(bundle.encaisseMoisTtc)} €`,
              hint: "TTC",
              card: "bw-kpi-ok",
              valueClass: "text-bework-ok",
            },
            {
              label: "Contrat accepté",
              value: `${money(bundle.contratAccepteHt)} €`,
              hint: "HT devis + avenants",
              card: "bw-surface-tinted-accent",
              valueClass: "text-bework-accent",
            },
            {
              label: "En retard",
              value: `${money(bundle.enRetardTtc)} €`,
              hint: "TTC",
              card: retardHot ? "bw-surface-tinted-critical" : "bg-white border border-slate-200/90",
              valueClass: retardHot ? "text-bework-critical" : "text-slate-900",
            },
          ].map((k) => (
            <div key={k.label} className={cn("rounded-xl p-4", k.card)}>
              <p className={cn("text-[20px] font-semibold tabular-nums", k.valueClass)}>
                {k.value}
              </p>
              <p className="mt-1 text-[13px] font-medium text-slate-700">{k.label}</p>
              <p className="text-[11px] text-slate-400">{k.hint}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200/90 bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-semibold text-slate-900">À faire</h2>
            <Link
              href="/dashboard/devis-facturation/suivi/devis-a-relancer"
              className="text-[12px] font-medium text-[#1e3a5f] hover:underline"
            >
              Voir le suivi
            </Link>
          </div>
          {bundle.todos.length === 0 ? (
            <p className="mt-6 text-[13px] text-slate-500">
              Rien d’urgent pour le moment.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100">
              {bundle.todos.map((t) => (
                <li key={t.id}>
                  <Link
                    href={t.href}
                    className="block py-3 transition hover:bg-slate-50/80"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-slate-900">
                          {t.title}
                        </p>
                        <p className="mt-0.5 truncate text-[12px] text-slate-600">
                          {t.reference}
                          {t.client ? ` · ${t.client}` : ""}
                        </p>
                        <p className="mt-0.5 text-[12px] text-slate-400">{t.reason}</p>
                      </div>
                      {t.amountLabel ? (
                        <span className="shrink-0 text-[13px] font-medium tabular-nums text-slate-800">
                          {t.amountLabel}
                        </span>
                      ) : null}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200/90 bg-white p-5">
          <h2 className="text-[15px] font-semibold text-slate-900">Trésorerie clients</h2>
          <dl className="mt-4 grid grid-cols-2 gap-3">
            {[
              { k: "Facturé ce mois", v: `${money(bundle.factureMoisHt)} €`, u: "HT" },
              { k: "Encaissé ce mois", v: `${money(bundle.encaisseMoisTtc)} €`, u: "TTC" },
              { k: "Reste à encaisser", v: `${money(bundle.aEncaisserTtc)} €`, u: "TTC" },
              { k: "En retard", v: `${money(bundle.enRetardTtc)} €`, u: "TTC" },
            ].map((row) => (
              <div key={row.k} className="rounded-xl bg-slate-50 px-3 py-3">
                <dt className="text-[11px] font-medium text-slate-500">{row.k}</dt>
                <dd className="mt-1 text-[18px] font-semibold tabular-nums text-slate-900">
                  {row.v}
                </dd>
                <dd className="text-[10px] uppercase tracking-wide text-slate-400">
                  {row.u}
                </dd>
              </div>
            ))}
          </dl>
          <div className="mt-4 flex flex-wrap gap-3 text-[12px] text-slate-600">
            <span>Brouillons devis : {bundle.enPreparation}</span>
            <span>·</span>
            <span>Envoyés : {bundle.envoyes}</span>
            <span>·</span>
            <span>Acceptés : {bundle.acceptes}</span>
            <span>·</span>
            <span>Refusés : {bundle.refuses}</span>
          </div>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <DocTable
          title="Derniers devis"
          href="/dashboard/devis-facturation/devis"
          rows={quotes.map((q) => ({
            id: q.id,
            href: `/dashboard/devis-facturation/devis/${q.id}`,
            ref: q.number,
            client:
              q.clientExternalOrg?.tradeName || q.clientExternalOrg?.name || "—",
            amount: `${money(d(q.totalSellHt))} € HT`,
            status: COMMERCIAL_QUOTE_STATUS_LABELS[q.status] ?? q.status,
            action: quoteNextActionLabel({
              status: q.status,
              projectId: q.projectId,
              validityDate: q.validityDate,
            }),
          }))}
        />
        <DocTable
          title="Dernières factures"
          href="/dashboard/devis-facturation/factures"
          rows={bundle.recentInvoices.map((inv) => ({
            id: inv.id,
            href: `/dashboard/devis-facturation/factures/${inv.id}`,
            ref: inv.number,
            client: inv.clientName || "—",
            amount: `${money(inv.totalTtc)} € TTC`,
            status: COMMERCIAL_INVOICE_STATUS_LABELS[inv.status] ?? inv.status,
            action: inv.issueDate
              ? new Date(inv.issueDate).toLocaleDateString("fr-FR")
              : "—",
          }))}
        />
      </div>
    </div>
  );
}

function DocTable({
  title,
  href,
  rows,
}: {
  title: string;
  href: string;
  rows: Array<{
    id: string;
    href: string;
    ref: string;
    client: string;
    amount: string;
    status: string;
    action: string;
  }>;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <h2 className="text-[15px] font-semibold text-slate-900">{title}</h2>
        <Link href={href} className="text-[12px] font-medium text-[#1e3a5f] hover:underline">
          Tout voir
        </Link>
      </div>
      <ul className="divide-y divide-slate-100">
        {rows.map((r) => (
          <li key={r.id}>
            <Link href={r.href} className="block px-4 py-3 hover:bg-slate-50/80">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-[#1e3a5f]">{r.ref}</p>
                  <p className="truncate text-[12px] text-slate-600">{r.client}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[13px] font-medium tabular-nums text-slate-900">
                    {r.amount}
                  </p>
                  <p className="text-[11px] text-slate-500">{r.status}</p>
                </div>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">{r.action}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
