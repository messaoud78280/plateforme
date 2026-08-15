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
import {
  acceptSupplierDeliveryProposal,
  refuseSupplierDeliveryProposal,
  sharePurchaseOrderWithSupplier,
} from "@/lib/purchase-orders/supplier-collaboration";
import { prisma } from "@/lib/prisma";
import { forbiddenUnlessDashboardHref } from "@/lib/equipe-acces/assert-api-dashboard-access";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  if (!isInternalPurchaseOrderActor(session.user)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  const personaDeny = forbiddenUnlessDashboardHref(session.user, "/dashboard/commandes");
  if (personaDeny) return personaDeny;

  const { id } = await ctx.params;
  const orgId = await resolvePurchaseOrderOrgId(session.user);
  if (!orgId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const body = (await req.json().catch(() => null)) as {
    action?: string;
    confirmedDeliveryAt?: string;
    contactId?: string;
    comment?: string;
  } | null;

  const order = await prisma.purchaseOrder.findFirst({
    where: { id, organizationId: orgId },
    select: {
      id: true,
      status: true,
      sharedWithSupplier: true,
      proposedDeliveryStatus: true,
    },
  });
  if (!order) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  const actorName = session.user.name || "Utilisateur";

  try {
    if (body?.action === "send_supplier") {
      const updated = await sharePurchaseOrderWithSupplier({
        orderId: id,
        organizationId: orgId,
        actorUserId: session.user.id,
        contactId: body.contactId ?? null,
      });
      return NextResponse.json({ ok: true, order: updated });
    }

    if (body?.action === "accept_proposal") {
      if (order.proposedDeliveryStatus !== "PENDING") {
        return NextResponse.json({ error: "Aucune proposition en attente" }, { status: 400 });
      }
      const updated = await acceptSupplierDeliveryProposal({
        orderId: id,
        organizationId: orgId,
        actorUserId: session.user.id,
        actorName,
      });
      return NextResponse.json({ ok: true, order: updated });
    }

    if (body?.action === "refuse_proposal") {
      if (order.proposedDeliveryStatus !== "PENDING") {
        return NextResponse.json({ error: "Aucune proposition en attente" }, { status: 400 });
      }
      const updated = await refuseSupplierDeliveryProposal({
        orderId: id,
        organizationId: orgId,
        actorUserId: session.user.id,
        actorName,
        comment: body.comment ?? null,
      });
      return NextResponse.json({ ok: true, order: updated });
    }

    const allowed = actionsForPurchaseOrderStatus(order.status).filter(
      (a) => a.action !== "send_supplier",
    );
    // Ne pas proposer "Partager" une seconde fois si déjà partagé (sauf re-partage volontaire)
    const hit = allowed.find((a) => a.action === body?.action);
    if (!hit) {
      return NextResponse.json({ error: "Action non pertinente" }, { status: 400 });
    }

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
      shareWithSupplier: hit.next === "ENVOYEE_FOURNISSEUR",
    });
    return NextResponse.json({ ok: true, order: updated });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
