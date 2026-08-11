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

const OPEN_PO = [
  "A_VALIDER",
  "VALIDEE",
  "ENVOYEE_FOURNISSEUR",
  "A_CONFIRMER",
  "CONFIRMEE",
  "LIVRAISON_PROGRAMMEE",
  "PARTIELLEMENT_RECUE",
] as const;

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
      purchaseOrders: {
        where: { status: { in: [...OPEN_PO] } },
        select: {
          id: true,
          status: true,
          confirmedDeliveryAt: true,
          sharedWithSupplier: true,
        },
        take: 20,
      },
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
          description="Vos fournisseurs, leurs contacts et leurs commandes en cours."
        />
        <Link
          href="/dashboard/commandes/nouvelle"
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          Nouvelle commande
        </Link>
      </div>
      <p className="text-xs text-slate-500">
        Pour ajouter un fournisseur, créez une commande ou ouvrez une fiche existante — pas de création
        isolée dans cette version.
      </p>

      {suppliers.length === 0 ? (
        <EmptyState
          title="Aucun fournisseur"
          description="Ajoutez un fournisseur depuis une nouvelle commande."
        />
      ) : (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {suppliers.map((s) => {
            const openOrders = s.purchaseOrders.length;
            const awaitingConfirm = s.purchaseOrders.filter(
              (o) =>
                !o.confirmedDeliveryAt &&
                (o.status === "A_CONFIRMER" ||
                  o.status === "ENVOYEE_FOURNISSEUR" ||
                  o.sharedWithSupplier),
            ).length;
            const opsBits = [
              openOrders > 0
                ? `${openOrders} commande${openOrders > 1 ? "s" : ""} en cours`
                : null,
              awaitingConfirm > 0
                ? `${awaitingConfirm} confirmation${awaitingConfirm > 1 ? "s" : ""} attendue${
                    awaitingConfirm > 1 ? "s" : ""
                  }`
                : null,
            ].filter(Boolean);

            return (
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
                    </span>
                    {opsBits.length > 0 ? (
                      <span className="mt-1 block text-xs font-medium text-slate-800">
                        {opsBits.join(" · ")}
                      </span>
                    ) : (
                      <span className="mt-1 block text-xs text-slate-400">
                        Aucune commande ouverte
                      </span>
                    )}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                      s.status === "ACTIVE"
                        ? "bg-slate-100 text-slate-500"
                        : "bg-slate-50 text-slate-400"
                    }`}
                    title="Statut administratif de la fiche"
                  >
                    {s.status === "ACTIVE" ? "Fiche active" : "Inactif"}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
