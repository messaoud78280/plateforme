import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  isInternalPurchaseOrderActor,
  resolvePurchaseOrderOrgId,
} from "@/lib/purchase-orders/access";
import { assertDashboardHrefAllowed } from "@/lib/equipe-acces/assert-dashboard-access";
import { SuppliersWorkspace } from "@/components/suppliers/SuppliersWorkspace";

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
  assertDashboardHrefAllowed({
    href: "/dashboard/fournisseurs",
    personType: session.user.personType,
    permissionProfile: session.user.permissionProfile,
  });

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
      email: true,
      siret: true,
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

  const items = suppliers.map((s) => {
    const openOrders = s.purchaseOrders.length;
    const awaitingConfirm = s.purchaseOrders.filter(
      (o) =>
        !o.confirmedDeliveryAt &&
        (o.status === "A_CONFIRMER" ||
          o.status === "ENVOYEE_FOURNISSEUR" ||
          o.sharedWithSupplier),
    ).length;
    return {
      id: s.id,
      name: s.name,
      tradeName: s.tradeName,
      activity: s.activity,
      city: s.city,
      phone: s.phone,
      email: s.email,
      siret: s.siret,
      status: s.status,
      contactsCount: s._count.contacts,
      openOrdersCount: openOrders,
      awaitingConfirmCount: awaitingConfirm,
    };
  });

  return <SuppliersWorkspace initialSuppliers={items} />;
}
