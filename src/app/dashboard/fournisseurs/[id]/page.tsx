import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BackLink } from "@/components/ui/BackLink";
import {
  isInternalPurchaseOrderActor,
  resolvePurchaseOrderOrgId,
} from "@/lib/purchase-orders/access";
import { assertDashboardHrefAllowed } from "@/lib/equipe-acces/assert-dashboard-access";
import { PURCHASE_ORDER_STATUS_LABELS } from "@/lib/purchase-orders/status";
import { SupplierEditButton } from "@/components/suppliers/SupplierEditButton";
import { loadSupplierPerformance } from "@/lib/suppliers/suppliers-workspace";
import { signedSupplierInvoiceHt } from "@/lib/chantier/supplier-invoices";
import { SUPPLIER_INVOICE_CATEGORY_LABELS } from "@/lib/chantier/supplier-invoices";
import { parseSupplierInvoiceCategory } from "@/lib/chantier/supplier-invoices";
import { roundMoney } from "@/lib/commercial/money";
import { d } from "@/lib/commercial/decimal";

export const dynamic = "force-dynamic";

function fmtHt(n: number) {
  return `${Math.round(n).toLocaleString("fr-FR")} €`;
}

export default async function FournisseurDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/connexion");
  if (!isInternalPurchaseOrderActor(session.user)) redirect("/dashboard");
  assertDashboardHrefAllowed({
    href: "/dashboard/fournisseurs",
    personType: session.user.personType,
    permissionProfile: session.user.permissionProfile,
  });

  const orgId = await resolvePurchaseOrderOrgId(session.user);
  if (!orgId) redirect("/dashboard");

  const { id } = await params;
  const supplier = await prisma.externalOrganization.findFirst({
    where: {
      id,
      hostOrganizationId: orgId,
      type: { in: ["SUPPLIER", "SUBCONTRACTOR"] },
    },
    include: {
      contacts: { orderBy: [{ isPrimary: "desc" }, { lastName: "asc" }] },
      purchaseOrders: {
        orderBy: { updatedAt: "desc" },
        take: 12,
        select: {
          id: true,
          number: true,
          subject: true,
          status: true,
          amountHt: true,
          requestedDeliveryAt: true,
          confirmedDeliveryAt: true,
          project: { select: { id: true, title: true } },
        },
      },
      supplierInvoices: {
        where: { status: "RECORDED" },
        orderBy: { invoiceDate: "desc" },
        take: 8,
        select: {
          id: true,
          supplierNumber: true,
          invoiceDate: true,
          amountHt: true,
          kind: true,
          category: true,
          purchaseOrder: { select: { number: true } },
          project: { select: { id: true, title: true } },
        },
      },
      people: {
        select: { id: true, name: true, email: true, jobTitle: true },
        take: 10,
      },
    },
  });
  if (!supplier) notFound();

  const primary = supplier.contacts.find((c) => c.isPrimary) ?? supplier.contacts[0] ?? null;
  const perf = await loadSupplierPerformance({
    organizationId: orgId,
    supplierId: supplier.id,
  });

  const projectsMap = new Map<string, { title: string; count: number }>();
  for (const o of supplier.purchaseOrders) {
    if (!o.project) continue;
    const cur = projectsMap.get(o.project.id) ?? { title: o.project.title, count: 0 };
    cur.count += 1;
    projectsMap.set(o.project.id, cur);
  }

  const upcoming = supplier.purchaseOrders
    .map((o) => ({
      ...o,
      at: o.confirmedDeliveryAt ?? o.requestedDeliveryAt,
    }))
    .filter((o) => o.at && o.at.getTime() >= Date.now() - 86_400_000)
    .sort((a, b) => (a.at!.getTime() ?? 0) - (b.at!.getTime() ?? 0))
    .slice(0, 5);

  const incomplete: string[] = [];
  if (supplier.contacts.length === 0 && !supplier.phone && !supplier.email) {
    incomplete.push("contact");
  }
  if (!supplier.phone && !supplier.email) incomplete.push("coordonnées");
  if (!supplier.address && !supplier.city) incomplete.push("adresse");
  if (!supplier.siret) incomplete.push("SIRET");
  if (!supplier.activity) incomplete.push("activité");

  const displayName = supplier.tradeName || supplier.name;

  return (
    <div className="mx-auto max-w-4xl space-y-5 px-4 pb-10 sm:px-6">
      <BackLink href="/dashboard/fournisseurs">Fournisseurs</BackLink>

      <header className="rounded-2xl border border-bework-navy/10 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-bework-muted">
              Fournisseur
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-bework-navy-deep">
              {displayName}
            </h1>
            {supplier.activity ? (
              <p className="mt-1 text-sm text-bework-muted">{supplier.activity}</p>
            ) : null}
            <p className="mt-2 text-[13px] font-medium text-slate-600">
              {supplier.status === "ACTIVE" ? "Actif" : "Inactif"}
              {incomplete.length >= 2
                ? ` · ${incomplete.length} informations à compléter`
                : incomplete.length === 0
                  ? " · Fiche complète"
                  : ""}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/dashboard/commandes/nouvelle?supplierId=${encodeURIComponent(supplier.id)}`}
              className="rounded-full bg-[#1e3a5f] px-3 py-1.5 text-[12px] font-medium text-white"
            >
              Nouvelle commande
            </Link>
            <SupplierEditButton
              supplier={{
                id: supplier.id,
                name: supplier.name,
                tradeName: supplier.tradeName,
                activity: supplier.activity,
                address: supplier.address,
                zipCode: supplier.zipCode,
                city: supplier.city,
                phone: supplier.phone,
                email: supplier.email,
                website: supplier.website,
                siret: supplier.siret,
                paymentTerms: supplier.paymentTerms,
                notes: supplier.notes,
                primaryContact: primary
                  ? {
                      firstName: primary.firstName,
                      lastName: primary.lastName,
                      jobTitle: primary.jobTitle,
                      email: primary.email,
                      phone: primary.phone,
                    }
                  : null,
              }}
            />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl bg-bework-soft-accent/70 px-3 py-2">
            <p className="text-[11px] text-slate-500">Commandes</p>
            <p className="text-[16px] font-semibold tabular-nums">{perf.orderCount}</p>
          </div>
          <div className="rounded-xl bg-bework-soft-navy/60 px-3 py-2">
            <p className="text-[11px] text-slate-500">Engagé</p>
            <p className="text-[16px] font-semibold tabular-nums">{fmtHt(perf.committedTotalHt)}</p>
          </div>
          <div className="rounded-xl bg-bework-soft-watch/70 px-3 py-2">
            <p className="text-[11px] text-slate-500">Dépenses</p>
            <p className="text-[16px] font-semibold tabular-nums">{fmtHt(perf.spentTotalHt)}</p>
          </div>
          <div className="rounded-xl bg-bework-soft-violet/70 px-3 py-2">
            <p className="text-[11px] text-slate-500">Contacts</p>
            <p className="text-[16px] font-semibold tabular-nums">{supplier.contacts.length}</p>
          </div>
        </div>

        <div className="mt-3 space-y-1 text-sm text-slate-600">
          {supplier.address || supplier.city ? (
            <p>
              {[supplier.address, supplier.zipCode, supplier.city].filter(Boolean).join(", ")}
            </p>
          ) : null}
          {supplier.phone ? <p>Tél. {supplier.phone}</p> : null}
          {supplier.email ? <p>{supplier.email}</p> : null}
          {supplier.website ? <p>{supplier.website}</p> : null}
          {supplier.siret ? <p>SIRET {supplier.siret}</p> : null}
          {supplier.paymentTerms ? <p>Paiement : {supplier.paymentTerms}</p> : null}
          {supplier.deliveryTerms ? <p>Livraison : {supplier.deliveryTerms}</p> : null}
        </div>
        {supplier.notes ? (
          <p className="mt-3 text-xs text-slate-500">{supplier.notes}</p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-3 text-[13px] font-medium">
          <Link
            href={`/dashboard/commandes?supplierId=${encodeURIComponent(supplier.id)}`}
            className="text-bework-navy hover:underline"
          >
            Voir les commandes
          </Link>
          <Link
            href={`/dashboard/depenses?supplierId=${encodeURIComponent(supplier.id)}`}
            className="text-bework-navy hover:underline"
          >
            Voir les dépenses
          </Link>
          <Link
            href={`/dashboard/commandes?supplierId=${encodeURIComponent(supplier.id)}&view=deliveries`}
            className="text-bework-navy hover:underline"
          >
            Voir les livraisons
          </Link>
          <Link
            href={`/dashboard/documents?q=${encodeURIComponent(displayName)}`}
            className="text-bework-navy hover:underline"
          >
            Voir dans Documents
          </Link>
        </div>
      </header>

      <section className="rounded-2xl border border-bework-navy/10 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-bework-navy-deep">Performance</h2>
        {perf.sampleInsufficient ? (
          <p className="mt-2 text-sm text-slate-600">
            Données insuffisantes — {perf.orderCount} commande
            {perf.orderCount > 1 ? "s" : ""} enregistrée
            {perf.orderCount > 1 ? "s" : ""}.
          </p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            <li>
              Volume : {fmtHt(perf.committedTotalHt)} engagé · {fmtHt(perf.spentTotalHt)} facturé
            </li>
            {perf.onTimeLabel ? (
              <li>
                Confirmations dans le délai demandé :{" "}
                <strong>{perf.onTimeLabel}</strong>
                {perf.onTimeDetail ? ` · ${perf.onTimeDetail}` : ""}
              </li>
            ) : null}
            {perf.anomalyLabel ? <li>{perf.anomalyLabel}</li> : null}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-bework-navy/10 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-bework-navy-deep">Contacts</h2>
        <ul className="mt-3 space-y-2">
          {supplier.contacts.map((c) => (
            <li
              key={c.id}
              className="rounded-xl border border-bework-navy/10 bg-bework-chrome/40 px-3 py-2.5"
            >
              <p className="text-sm font-semibold text-slate-900">
                {c.firstName} {c.lastName}
                {c.isPrimary ? (
                  <span className="badge-cc badge-cc-info ml-2 !text-[10px]">Principal</span>
                ) : null}
              </p>
              <p className="text-xs text-slate-500">
                {[c.jobTitle, c.email, c.phone].filter(Boolean).join(" · ")}
              </p>
            </li>
          ))}
          {supplier.contacts.length === 0 && supplier.people.length > 0
            ? supplier.people.map((p) => (
                <li key={p.id} className="text-sm text-slate-700">
                  {p.name}
                  {p.jobTitle ? ` — ${p.jobTitle}` : ""}
                  {p.email ? ` · ${p.email}` : ""}
                </li>
              ))
            : null}
          {supplier.contacts.length === 0 && supplier.people.length === 0 ? (
            <li className="text-sm text-slate-500">Aucun contact enregistré.</li>
          ) : null}
        </ul>
      </section>

      {projectsMap.size > 0 ? (
        <section className="rounded-2xl border border-bework-navy/10 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-bework-navy-deep">Chantiers concernés</h2>
          <ul className="mt-3 space-y-2">
            {[...projectsMap.entries()].map(([pid, v]) => (
              <li key={pid} className="flex items-center justify-between gap-2 text-sm">
                <Link
                  href={`/dashboard/projets/${pid}`}
                  className="font-medium text-bework-navy hover:underline"
                >
                  {v.title}
                </Link>
                <span className="text-slate-500">
                  {v.count} commande{v.count > 1 ? "s" : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {upcoming.length > 0 ? (
        <section className="rounded-2xl border border-bework-navy/10 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-bework-navy-deep">Livraisons</h2>
            <Link
              href={`/dashboard/commandes?supplierId=${encodeURIComponent(supplier.id)}&view=deliveries`}
              className="text-xs font-semibold text-bework-navy hover:underline"
            >
              Voir tout
            </Link>
          </div>
          <ul className="mt-3 divide-y divide-slate-100">
            {upcoming.map((o) => (
              <li key={o.id} className="py-2.5">
                <Link href={`/dashboard/commandes/${o.id}`} className="block hover:opacity-90">
                  <p className="text-sm font-semibold text-bework-navy">{o.number}</p>
                  <p className="text-xs text-slate-500">
                    {o.at
                      ? o.at.toLocaleString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""}
                    {o.project?.title ? ` · ${o.project.title}` : ""}
                    {!o.confirmedDeliveryAt ? " · Confirmation attendue" : ""}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="rounded-2xl border border-bework-navy/10 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-bework-navy-deep">Commandes</h2>
          <Link
            href={`/dashboard/commandes?supplierId=${encodeURIComponent(supplier.id)}`}
            className="text-xs font-semibold text-bework-navy hover:underline"
          >
            Voir les commandes
          </Link>
        </div>
        <ul className="mt-3 divide-y divide-slate-100">
          {supplier.purchaseOrders.map((o) => (
            <li key={o.id} className="py-2.5">
              <Link href={`/dashboard/commandes/${o.id}`} className="block hover:opacity-90">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm font-semibold text-bework-navy">
                    {o.number} — {o.subject}
                  </p>
                  {o.amountHt != null ? (
                    <p className="text-sm font-semibold tabular-nums">
                      {fmtHt(roundMoney(d(o.amountHt), 2))} HT
                    </p>
                  ) : null}
                </div>
                <p className="text-xs text-slate-500">
                  {PURCHASE_ORDER_STATUS_LABELS[o.status]}
                  {o.project?.title ? ` · ${o.project.title}` : ""}
                  {o.confirmedDeliveryAt || o.requestedDeliveryAt
                    ? ` · ${(o.confirmedDeliveryAt ?? o.requestedDeliveryAt)!.toLocaleDateString("fr-FR")}`
                    : ""}
                </p>
              </Link>
            </li>
          ))}
          {supplier.purchaseOrders.length === 0 ? (
            <li className="py-2 text-sm text-slate-500">Aucune commande pour l’instant.</li>
          ) : null}
        </ul>
      </section>

      <section className="rounded-2xl border border-bework-navy/10 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-bework-navy-deep">Dépenses</h2>
          <Link
            href={`/dashboard/depenses?supplierId=${encodeURIComponent(supplier.id)}`}
            className="text-xs font-semibold text-bework-navy hover:underline"
          >
            Voir les dépenses
          </Link>
        </div>
        <ul className="mt-3 divide-y divide-slate-100">
          {supplier.supplierInvoices.map((inv) => {
            const cat = parseSupplierInvoiceCategory(inv.category);
            const ht = signedSupplierInvoiceHt(inv.kind, Number(inv.amountHt));
            return (
              <li key={inv.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{inv.supplierNumber}</p>
                  <p className="text-xs text-slate-500">
                    {inv.invoiceDate.toLocaleDateString("fr-FR")}
                    {inv.project?.title ? ` · ${inv.project.title}` : ""}
                    {` · ${SUPPLIER_INVOICE_CATEGORY_LABELS[cat]}`}
                    {inv.purchaseOrder?.number ? ` · ${inv.purchaseOrder.number}` : ""}
                  </p>
                </div>
                <p className="text-sm font-semibold tabular-nums">{fmtHt(ht)} HT</p>
              </li>
            );
          })}
          {supplier.supplierInvoices.length === 0 ? (
            <li className="py-2 text-sm text-slate-500">Aucune dépense enregistrée.</li>
          ) : null}
        </ul>
      </section>

      <section className="rounded-2xl border border-bework-navy/10 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-bework-navy-deep">Documents</h2>
          <Link
            href={`/dashboard/documents?q=${encodeURIComponent(displayName)}`}
            className="text-xs font-semibold text-bework-navy hover:underline"
          >
            Voir dans Documents
          </Link>
        </div>
        <p className="mt-2 text-sm text-slate-500">
          BC, BL, factures et justificatifs via le Document Center — pas de GED parallèle.
        </p>
      </section>
    </div>
  );
}
