import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { PurchaseOrderStatus } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import {
  isInternalPurchaseOrderActor,
  resolvePurchaseOrderOrgId,
} from "@/lib/purchase-orders/access";
import { actionsForPurchaseOrderStatus } from "@/lib/purchase-orders/status";
import { transitionPurchaseOrder } from "@/lib/purchase-orders/service";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  if (!isInternalPurchaseOrderActor(session.user)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const orgId = await resolvePurchaseOrderOrgId(session.user);
  if (!orgId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const body = (await req.json().catch(() => null)) as {
    action?: string;
    confirmedDeliveryAt?: string;
  } | null;

  const order = await prisma.purchaseOrder.findFirst({
    where: { id, organizationId: orgId },
    select: { id: true, status: true },
  });
  if (!order) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  const allowed = actionsForPurchaseOrderStatus(order.status);
  const hit = allowed.find((a) => a.action === body?.action);
  if (!hit) {
    return NextResponse.json({ error: "Action non pertinente" }, { status: 400 });
  }

  try {
    const updated = await transitionPurchaseOrder({
      orderId: id,
      organizationId: orgId,
      toStatus: hit.next as PurchaseOrderStatus,
      actorUserId: session.user.id,
      confirmedDeliveryAt: body?.confirmedDeliveryAt
        ? new Date(body.confirmedDeliveryAt)
        : hit.action === "confirm_delivery"
          ? new Date()
          : undefined,
      shareWithSupplier:
        hit.action === "send_supplier" || hit.next === "ENVOYEE_FOURNISSEUR",
    });
    return NextResponse.json({ ok: true, order: updated });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
