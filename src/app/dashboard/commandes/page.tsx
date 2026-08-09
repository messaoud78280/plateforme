import { redirect } from "next/navigation";
import Link from "next/link";
import { getCachedServerSession } from "@/lib/auth/cached-session";
import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  canListPurchaseOrders,
  isInternalPurchaseOrderActor,
  isSupplierPurchaseOrderActor,
  resolvePurchaseOrderOrgId,
} from "@/lib/purchase-orders/access";
import { PURCHASE_ORDER_STATUS_LABELS } from "@/lib/purchase-orders/status";
import { loadPurchaseOrdersListView } from "@/lib/purchase-orders/list-view";
import { PurchaseOrdersListClient } from "@/components/purchase-orders/PurchaseOrdersListClient";

export const dynamic = "force-dynamic";

/** Portail fournisseur — liste volontairement simple (≠ pilotage interne V2C). */
async function SupplierOrdersSimple({
  orgId,
  supplierOrgId,
}: {
  orgId: string;
  supplierOrgId: string;
}) {
  const orders = await prisma.purchaseOrder.findMany({
    where: {
      organizationId: orgId,
      sharedWithSupplier: true,
      externalOrganizationId: supplierOrgId,
    },
    select: {
      id: true,
      number: true,
      subject: true,
      status: true,
      requestedDeliveryAt: true,
      confirmedDeliveryAt: true,
      project: { select: { title: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 80,
  });

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-extrabold text-[#1e3a5f]">Commandes</h1>
        <p className="mt-1 text-sm text-slate-600">Vos commandes partagées à confirmer ou suivre.</p>
      </header>
      {orders.length === 0 ? (
        <EmptyState
          title="Aucune commande partagée"
          description="Les commandes que l’entreprise partage avec vous apparaîtront ici."
        />
      ) : (
        <ul className="space-y-2">
          {orders.map((o) => {
            const when = o.confirmedDeliveryAt ?? o.requestedDeliveryAt;
            return (
              <li key={o.id}>
                <Link
                  href={`/dashboard/commandes/${o.id}`}
                  className="block rounded-xl border border-slate-200 bg-white px-4 py-3 hover:border-[#1e3a5f]/30"
                >
                  <p className="font-bold text-slate-900">{o.number}</p>
                  <p className="text-sm text-slate-700">{o.subject}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {o.project?.title ?? "—"}
                    {" · "}
                    {PURCHASE_ORDER_STATUS_LABELS[o.status]}
                    {when
                      ? ` · ${when.toLocaleString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}`
                      : ""}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default async function CommandesPage() {
  const session = await getCachedServerSession();
  if (!session?.user?.id) redirect("/connexion?callbackUrl=/dashboard/commandes");
  if (!canListPurchaseOrders(session.user)) redirect("/dashboard");

  const orgId = await resolvePurchaseOrderOrgId(session.user);
  const canCreate = isInternalPurchaseOrderActor(session.user);
  const isSupplier = isSupplierPurchaseOrderActor(session.user);

  if (isSupplier) {
    const u = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { externalOrganizationId: true },
    });
    if (!orgId || !u?.externalOrganizationId) {
      return (
        <EmptyState
          title="Aucune commande"
          description="Les commandes partagées avec vous apparaîtront ici."
        />
      );
    }
    return (
      <SupplierOrdersSimple orgId={orgId} supplierOrgId={u.externalOrganizationId} />
    );
  }

  if (!orgId) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-extrabold text-[#1e3a5f]">Commandes</h1>
        <EmptyState
          title="Organisation introuvable"
          description="Impossible d’afficher les commandes pour le moment."
        />
      </div>
    );
  }

  const { rows, summary } = await loadPurchaseOrdersListView({
    organizationId: orgId,
  });

  return (
    <PurchaseOrdersListClient
      rows={rows}
      summary={summary}
      canCreate={canCreate}
      canOpenSupplier={canCreate}
    />
  );
}
