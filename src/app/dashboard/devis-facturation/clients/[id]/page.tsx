import Link from "next/link";
import { notFound } from "next/navigation";
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

export const dynamic = "force-dynamic";

export default async function CommercialClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireCommercialSession(
    "/dashboard/devis-facturation/clients",
  );
  const orgId = await resolveCommercialOrgId(session.user);
  if (!orgId) return null;
  const { id } = await params;

  const client = await prisma.externalOrganization.findFirst({
    where: {
      id,
      hostOrganizationId: orgId,
      type: { in: ["CLIENT_EXT", "CLIENT"] },
    },
  });
  if (!client) notFound();

  const [quotes, invoices, payments, projects] = await Promise.all([
    prisma.commercialQuote.findMany({
      where: { organizationId: orgId, clientExternalOrgId: id },
      orderBy: { updatedAt: "desc" },
      take: 20,
      select: {
        id: true,
        number: true,
        status: true,
        totalSellHt: true,
        updatedAt: true,
      },
    }),
    prisma.commercialInvoice.findMany({
      where: { organizationId: orgId, clientExternalOrgId: id },
      orderBy: { updatedAt: "desc" },
      take: 20,
      select: {
        id: true,
        number: true,
        status: true,
        totalTtc: true,
        amountDue: true,
        amountPaid: true,
      },
    }),
    prisma.commercialPayment.findMany({
      where: {
        organizationId: orgId,
        invoice: { clientExternalOrgId: id },
      },
      orderBy: { paidAt: "desc" },
      take: 15,
      select: {
        id: true,
        amount: true,
        paidAt: true,
        reference: true,
        invoice: { select: { number: true, id: true } },
      },
    }),
    prisma.project.findMany({
      where: {
        organizationId: orgId,
        commercialQuotes: { some: { clientExternalOrgId: id } },
      },
      select: { id: true, title: true },
      take: 20,
    }),
  ]);

  const resteDu = invoices.reduce((s, i) => s + d(i.amountDue), 0);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/devis-facturation/clients"
          className="text-[13px] font-medium text-[#1e3a5f]"
        >
          ← Clients
        </Link>
        <h2 className="mt-2 text-xl font-semibold text-slate-900">
          {client.tradeName || client.name}
        </h2>
        <p className="mt-1 text-[13px] text-slate-500">
          {[client.address, client.zipCode, client.city]
            .filter(Boolean)
            .join(" ") || "Adresse non renseignée"}
        </p>
        <p className="text-[13px] text-slate-500">
          {[client.email, client.phone].filter(Boolean).join(" · ")}
        </p>
        <p className="mt-3 text-[14px] font-semibold text-amber-900">
          Reste dû : {roundMoney(resteDu, 0).toLocaleString("fr-FR")} € TTC
        </p>
      </div>

      <Section title="Devis">
        {quotes.map((q) => (
          <Row
            key={q.id}
            href={`/dashboard/devis-facturation/devis/${q.id}`}
            left={q.number}
            mid={COMMERCIAL_QUOTE_STATUS_LABELS[q.status] ?? q.status}
            right={`${roundMoney(d(q.totalSellHt), 0).toLocaleString("fr-FR")} € HT`}
          />
        ))}
        {quotes.length === 0 ? <Empty /> : null}
      </Section>

      <Section title="Factures">
        {invoices.map((inv) => (
          <Row
            key={inv.id}
            href={`/dashboard/devis-facturation/factures/${inv.id}`}
            left={inv.number}
            mid={COMMERCIAL_INVOICE_STATUS_LABELS[inv.status] ?? inv.status}
            right={`${roundMoney(d(inv.totalTtc), 0).toLocaleString("fr-FR")} € TTC`}
          />
        ))}
        {invoices.length === 0 ? <Empty /> : null}
      </Section>

      <Section title="Encaissements">
        {payments.map((p) => (
          <Row
            key={p.id}
            href={`/dashboard/devis-facturation/factures/${p.invoice.id}`}
            left={p.invoice.number}
            mid={
              p.paidAt ? new Date(p.paidAt).toLocaleDateString("fr-FR") : "—"
            }
            right={`${roundMoney(d(p.amount), 0).toLocaleString("fr-FR")} €`}
          />
        ))}
        {payments.length === 0 ? <Empty /> : null}
      </Section>

      <Section title="Chantiers">
        {projects.map((p) => (
          <Row
            key={p.id}
            href={`/dashboard/projets/${p.id}`}
            left={p.title}
            mid=""
            right=""
          />
        ))}
        {projects.length === 0 ? <Empty /> : null}
      </Section>

      <p className="text-[12px]">
        <Link
          href={`/dashboard/documents?company=${encodeURIComponent(client.tradeName || client.name)}`}
          className="font-medium text-[#1e3a5f] hover:underline"
        >
          Documents commerciaux (GED) →
        </Link>
      </p>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <h3 className="border-b border-slate-100 px-4 py-2.5 text-[13px] font-semibold text-slate-900">
        {title}
      </h3>
      <ul className="divide-y divide-slate-100">{children}</ul>
    </section>
  );
}

function Row({
  href,
  left,
  mid,
  right,
}: {
  href: string;
  left: string;
  mid: string;
  right: string;
}) {
  return (
    <li>
      <Link href={href} className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-slate-50">
        <span className="min-w-0 truncate text-[13px] font-medium text-[#1e3a5f]">
          {left}
        </span>
        <span className="shrink-0 text-[11px] text-slate-500">{mid}</span>
        <span className="shrink-0 text-[13px] tabular-nums text-slate-800">
          {right}
        </span>
      </Link>
    </li>
  );
}

function Empty() {
  return <li className="px-4 py-6 text-center text-[13px] text-slate-400">Aucun</li>;
}
