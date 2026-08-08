import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BackLink } from "@/components/ui/BackLink";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  DataTable,
  DataTableBody,
  DataTableHead,
  DataTableRow,
  DataTableTd,
  DataTableTh,
} from "@/components/ui/DataTable";
import {
  canListPurchaseOrders,
  isInternalPurchaseOrderActor,
  resolvePurchaseOrderOrgId,
} from "@/lib/purchase-orders/access";
import { PURCHASE_ORDER_STATUS_LABELS } from "@/lib/purchase-orders/status";

export const dynamic = "force-dynamic";

export default async function CommandesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/connexion?callbackUrl=/dashboard/commandes");
  if (!canListPurchaseOrders(session.user)) redirect("/dashboard");

  const orgId = await resolvePurchaseOrderOrgId(session.user);
  const canCreate = isInternalPurchaseOrderActor(session.user);

  const isSupplier =
    session.user.personType === "SUPPLIER" ||
    session.user.permissionProfile === "FOURNISSEUR";

  let supplierOrgId: string | null = null;
  if (isSupplier) {
    const u = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { externalOrganizationId: true },
    });
    supplierOrgId = u?.externalOrganizationId ?? null;
  }

  const orders =
    orgId == null
      ? []
      : await prisma.purchaseOrder.findMany({
          where: {
            organizationId: orgId,
            ...(isSupplier && supplierOrgId
              ? { sharedWithSupplier: true, externalOrganizationId: supplierOrgId }
              : isSupplier
                ? { id: "__none__" }
                : {}),
          },
          select: {
            id: true,
            number: true,
            subject: true,
            status: true,
            amountHt: true,
            requestedDeliveryAt: true,
            project: { select: { title: true } },
            externalOrganization: { select: { name: true, tradeName: true } },
            responsible: { select: { name: true } },
          },
          orderBy: { updatedAt: "desc" },
          take: 80,
        });

  return (
    <div className="space-y-6">
      <BackLink href="/dashboard">Tableau de bord</BackLink>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageHeader
          eyebrow="Chantier"
          title="Commandes"
          description="Demandes fournisseur liées à vos chantiers — simples à créer, suivies jusqu’à la réception."
        />
        <div className="flex flex-wrap gap-2">
          {canCreate ? (
            <Link
              href="/dashboard/fournisseurs"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
            >
              Fournisseurs
            </Link>
          ) : null}
          {canCreate ? (
            <Link
              href="/dashboard/commandes/nouvelle"
              className="rounded-lg bg-[#1e3a5f] px-3 py-2 text-xs font-bold text-white"
            >
              + Nouvelle commande
            </Link>
          ) : null}
        </div>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          title="Aucune commande"
          description={
            canCreate
              ? "Créez une commande pour un chantier en quelques champs."
              : "Les commandes partagées avec vous apparaîtront ici."
          }
        />
      ) : (
        <DataTable minWidth="880px">
          <DataTableHead>
            <DataTableTh>Référence</DataTableTh>
            <DataTableTh>Objet</DataTableTh>
            <DataTableTh>Chantier</DataTableTh>
            <DataTableTh>Fournisseur</DataTableTh>
            <DataTableTh>Statut</DataTableTh>
            <DataTableTh>Livraison</DataTableTh>
          </DataTableHead>
          <DataTableBody>
            {orders.map((o) => (
              <DataTableRow key={o.id}>
                <DataTableTd>
                  <Link
                    href={`/dashboard/commandes/${o.id}`}
                    className="font-semibold text-[#1e3a5f] hover:underline"
                  >
                    {o.number}
                  </Link>
                </DataTableTd>
                <DataTableTd>{o.subject}</DataTableTd>
                <DataTableTd>{o.project?.title ?? "—"}</DataTableTd>
                <DataTableTd>
                  {o.externalOrganization.tradeName || o.externalOrganization.name}
                </DataTableTd>
                <DataTableTd>
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold">
                    {PURCHASE_ORDER_STATUS_LABELS[o.status]}
                  </span>
                </DataTableTd>
                <DataTableTd>
                  {o.requestedDeliveryAt
                    ? new Date(o.requestedDeliveryAt).toLocaleString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—"}
                </DataTableTd>
              </DataTableRow>
            ))}
          </DataTableBody>
        </DataTable>
      )}
    </div>
  );
}
