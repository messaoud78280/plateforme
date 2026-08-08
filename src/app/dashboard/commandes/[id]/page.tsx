import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  canListPurchaseOrders,
  isInternalPurchaseOrderActor,
  resolvePurchaseOrderOrgId,
} from "@/lib/purchase-orders/access";
import { purchaseOrderDetailInclude } from "@/lib/purchase-orders/service";
import { PurchaseOrderDetailClient } from "@/components/purchase-orders/PurchaseOrderDetailClient";

export const dynamic = "force-dynamic";

export default async function CommandeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/connexion?callbackUrl=/dashboard/commandes");
  if (!canListPurchaseOrders(session.user)) redirect("/dashboard");

  const { id } = await params;
  const orgId = await resolvePurchaseOrderOrgId(session.user);
  if (!orgId) redirect("/dashboard/commandes");

  const isSupplier =
    session.user.personType === "SUPPLIER" ||
    session.user.permissionProfile === "FOURNISSEUR";

  const order = await prisma.purchaseOrder.findFirst({
    where: {
      id,
      organizationId: orgId,
      ...(isSupplier ? { sharedWithSupplier: true } : {}),
    },
    include: purchaseOrderDetailInclude,
  });
  if (!order) notFound();

  if (isSupplier) {
    const u = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { externalOrganizationId: true },
    });
    if (u?.externalOrganizationId !== order.externalOrganizationId) {
      redirect("/dashboard/commandes");
    }
  }

  const serialized = JSON.parse(JSON.stringify(order));

  return (
    <PurchaseOrderDetailClient
      order={serialized}
      canAct={isInternalPurchaseOrderActor(session.user)}
    />
  );
}
