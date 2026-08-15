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

export const dynamic = "force-dynamic";

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
    where: { id, hostOrganizationId: orgId, type: "SUPPLIER" },
    include: {
      contacts: { orderBy: [{ isPrimary: "desc" }, { lastName: "asc" }] },
      purchaseOrders: {
        orderBy: { updatedAt: "desc" },
        take: 20,
        select: {
          id: true,
          number: true,
          subject: true,
          status: true,
          requestedDeliveryAt: true,
          project: { select: { title: true } },
        },
      },
      people: {
        select: { id: true, name: true, email: true, jobTitle: true },
        take: 10,
      },
    },
  });
  if (!supplier) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <BackLink href="/dashboard/fournisseurs">Fournisseurs</BackLink>

      <header className="rounded-2xl border border-slate-200 bg-white p-5">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Fournisseur</p>
        <h1 className="mt-1 text-2xl font-extrabold text-slate-900">
          {supplier.tradeName || supplier.name}
        </h1>
        {supplier.activity ? (
          <p className="mt-1 text-sm text-slate-600">{supplier.activity}</p>
        ) : null}
        <div className="mt-3 space-y-1 text-sm text-slate-600">
          {supplier.address || supplier.city ? (
            <p>
              {[supplier.address, supplier.zipCode, supplier.city].filter(Boolean).join(", ")}
            </p>
          ) : null}
          {supplier.phone ? <p>Tél. {supplier.phone}</p> : null}
          {supplier.email ? <p>{supplier.email}</p> : null}
          {supplier.paymentTerms ? <p>Paiement : {supplier.paymentTerms}</p> : null}
          {supplier.deliveryTerms ? <p>Livraison : {supplier.deliveryTerms}</p> : null}
        </div>
        {supplier.notes ? (
          <p className="mt-3 text-xs text-slate-500">{supplier.notes}</p>
        ) : null}
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-bold text-slate-900">Contacts</h2>
        <ul className="mt-3 space-y-2">
          {supplier.contacts.map((c) => (
            <li key={c.id} className="rounded-lg border border-slate-100 px-3 py-2">
              <p className="text-sm font-semibold text-slate-900">
                {c.firstName} {c.lastName}
                {c.isPrimary ? (
                  <span className="ml-2 text-[10px] font-bold uppercase text-[#1d4ed8]">
                    Principal
                  </span>
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

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Commandes</h2>
          <Link
            href="/dashboard/commandes/nouvelle"
            className="text-xs font-semibold text-[#1d4ed8]"
          >
            Nouvelle commande
          </Link>
        </div>
        <ul className="mt-3 divide-y divide-slate-100">
          {supplier.purchaseOrders.map((o) => (
            <li key={o.id} className="py-2.5">
              <Link href={`/dashboard/commandes/${o.id}`} className="block hover:opacity-90">
                <p className="text-sm font-semibold text-[#1e3a5f]">
                  {o.number} — {o.subject}
                </p>
                <p className="text-xs text-slate-500">
                  {PURCHASE_ORDER_STATUS_LABELS[o.status]}
                  {o.project?.title ? ` · ${o.project.title}` : ""}
                  {o.requestedDeliveryAt
                    ? ` · ${new Date(o.requestedDeliveryAt).toLocaleDateString("fr-FR")}`
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
    </div>
  );
}
