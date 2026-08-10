import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  isInternalPurchaseOrderActor,
  resolvePurchaseOrderOrgId,
} from "@/lib/purchase-orders/access";
import {
  canReceivePurchaseOrder,
  getPurchaseOrderReceivingState,
} from "@/lib/purchase-orders/receiving";
import { ReceivePurchaseOrderForm } from "@/components/purchase-orders/ReceivePurchaseOrderForm";
import { ContextBackButton } from "@/components/ui/ContextBackButton";
import {
  contextBackLabelForHref,
  sanitizeInternalReturnTo,
} from "@/lib/navigation/safe-return-to";

export const dynamic = "force-dynamic";

export default async function ReceptionCommandePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/connexion");
  if (!isInternalPurchaseOrderActor(session.user) || !canReceivePurchaseOrder(session.user)) {
    redirect("/dashboard/commandes");
  }

  const { id } = await params;
  const { returnTo: returnToRaw } = await searchParams;
  const orgId = await resolvePurchaseOrderOrgId(session.user);
  if (!orgId) redirect("/dashboard/commandes");

  const order = await prisma.purchaseOrder.findFirst({
    where: { id, organizationId: orgId },
    select: {
      id: true,
      number: true,
      status: true,
      project: { select: { title: true } },
      externalOrganization: { select: { name: true, tradeName: true } },
    },
  });
  if (!order) notFound();

  const state = await getPurchaseOrderReceivingState(order.id);
  if (!state) notFound();

  if (["ANNULEE", "CLOTUREE", "BROUILLON"].includes(order.status)) {
    redirect(`/dashboard/commandes/${order.id}`);
  }

  const fallback = `/dashboard/commandes/${order.id}`;
  const returnTo = sanitizeInternalReturnTo(returnToRaw, fallback);

  return (
    <div className="space-y-4">
      <div className="px-1">
        <ContextBackButton
          label={contextBackLabelForHref(returnTo, "Retour à la commande")}
          fallbackHref={fallback}
          returnTo={returnTo}
        />
      </div>
      <ReceivePurchaseOrderForm
        orderId={order.id}
        number={order.number}
        supplierName={
          order.externalOrganization.tradeName || order.externalOrganization.name
        }
        projectTitle={order.project?.title ?? null}
        lines={state.lines}
      />
    </div>
  );
}
