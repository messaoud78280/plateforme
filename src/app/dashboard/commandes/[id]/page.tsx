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
import { sanitizeOrderForSupplier } from "@/lib/purchase-orders/supplier-collaboration";
import { getPurchaseOrderReceivingState } from "@/lib/purchase-orders/receiving";
import { canReceivePurchaseOrder } from "@/lib/purchase-orders/receiving";
import { PurchaseOrderDetailClient } from "@/components/purchase-orders/PurchaseOrderDetailClient";
import { sanitizeInternalReturnTo } from "@/lib/navigation/safe-return-to";
import { canAccessDashboardHref } from "@/lib/equipe-acces/dashboard-policy";

export const dynamic = "force-dynamic";

export default async function CommandeDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/connexion?callbackUrl=/dashboard/commandes");
  if (!canListPurchaseOrders(session.user)) redirect("/dashboard");

  const { id } = await params;
  const { returnTo: returnToRaw } = await searchParams;
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

  const payload = isSupplier
    ? sanitizeOrderForSupplier(order as unknown as Record<string, unknown>)
    : order;
  const serialized = JSON.parse(JSON.stringify(payload));
  const receiving = await getPurchaseOrderReceivingState(order.id);

  return (
    <PurchaseOrderDetailClient
      order={serialized}
      canAct={isInternalPurchaseOrderActor(session.user)}
      canReceive={
        isInternalPurchaseOrderActor(session.user) &&
        canReceivePurchaseOrder(session.user)
      }
      canPrepareSupplierInvoice={canAccessDashboardHref(
        "/dashboard/depenses",
        session.user.personType,
        session.user.permissionProfile,
      )}
      canOpenSupplier={canAccessDashboardHref(
        "/dashboard/fournisseurs",
        session.user.personType,
        session.user.permissionProfile,
      )}
      isSupplierView={isSupplier}
      receiving={receiving}
      returnTo={sanitizeInternalReturnTo(returnToRaw, "/dashboard/commandes")}
    />
  );
}
