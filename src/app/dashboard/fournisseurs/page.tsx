import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BackLink } from "@/components/ui/BackLink";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  isInternalPurchaseOrderActor,
  resolvePurchaseOrderOrgId,
} from "@/lib/purchase-orders/access";

export const dynamic = "force-dynamic";

export default async function FournisseursPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/connexion?callbackUrl=/dashboard/fournisseurs");
  if (!isInternalPurchaseOrderActor(session.user)) redirect("/dashboard");

  const orgId = await resolvePurchaseOrderOrgId(session.user);
  if (!orgId) redirect("/dashboard");

  const suppliers = await prisma.externalOrganization.findMany({
    where: { hostOrganizationId: orgId, type: "SUPPLIER" },
    select: {
      id: true,
      name: true,
      tradeName: true,
      activity: true,
      city: true,
      phone: true,
      status: true,
      _count: { select: { contacts: true, purchaseOrders: true } },
    },
    orderBy: { name: "asc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <BackLink href="/dashboard/commandes">Commandes</BackLink>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageHeader
          eyebrow="Partenaires"
          title="Fournisseurs"
          description="Un fournisseur = une organisation. Plusieurs contacts, une seule fiche Point.P."
        />
        <Link
          href="/dashboard/commandes/nouvelle"
          className="rounded-lg bg-[#1e3a5f] px-3 py-2 text-xs font-bold text-white"
        >
          + Nouvelle commande
        </Link>
      </div>

      {suppliers.length === 0 ? (
        <EmptyState
          title="Aucun fournisseur"
          description="Ajoutez un fournisseur depuis une nouvelle commande."
        />
      ) : (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {suppliers.map((s) => (
            <li key={s.id}>
              <Link
                href={`/dashboard/fournisseurs/${s.id}`}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 hover:bg-slate-50"
              >
                <span>
                  <span className="block text-sm font-semibold text-slate-900">
                    {s.tradeName || s.name}
                  </span>
                  <span className="text-xs text-slate-500">
                    {s.activity || "Fournisseur"}
                    {s.city ? ` · ${s.city}` : ""}
                    {" · "}
                    {s._count.contacts} contact{s._count.contacts > 1 ? "s" : ""}
                    {" · "}
                    {s._count.purchaseOrders} commande
                    {s._count.purchaseOrders > 1 ? "s" : ""}
                  </span>
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                    s.status === "ACTIVE"
                      ? "bg-emerald-50 text-emerald-800"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {s.status === "ACTIVE" ? "Actif" : "Inactif"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
