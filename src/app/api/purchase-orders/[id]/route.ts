import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  canListPurchaseOrders,
  isInternalPurchaseOrderActor,
  resolvePurchaseOrderOrgId,
} from "@/lib/purchase-orders/access";
import { purchaseOrderDetailInclude } from "@/lib/purchase-orders/service";
import { computeOrderAmountHt } from "@/lib/purchase-orders/totals";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  if (!canListPurchaseOrders(session.user)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const orgId = await resolvePurchaseOrderOrgId(session.user);
  if (!orgId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

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

  if (!order) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  if (isSupplier) {
    const u = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { externalOrganizationId: true },
    });
    if (u?.externalOrganizationId !== order.externalOrganizationId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }
  }

  return NextResponse.json({ order });
}

export async function PATCH(req: Request, ctx: Ctx) {
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

  const existing = await prisma.purchaseOrder.findFirst({
    where: { id, organizationId: orgId },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  if (Array.isArray(body.lines)) {
    const lines = body.lines as Record<string, unknown>[];
    await prisma.purchaseOrderLine.deleteMany({ where: { orderId: id } });
    await prisma.purchaseOrderLine.createMany({
      data: lines
        .map((l, i) => ({
          orderId: id,
          designation: String(l.designation ?? "").trim(),
          quantity: Number(l.quantity ?? 0),
          unit: String(l.unit ?? "U"),
          unitPriceHt:
            l.unitPriceHt === null || l.unitPriceHt === undefined || l.unitPriceHt === ""
              ? null
              : Number(l.unitPriceHt),
          tvaRate:
            l.tvaRate === null || l.tvaRate === undefined || l.tvaRate === ""
              ? null
              : Number(l.tvaRate),
          sortOrder: i,
        }))
        .filter((l) => l.designation && l.quantity > 0),
    });
    const amountHt = computeOrderAmountHt(
      lines.map((l) => ({
        quantity: Number(l.quantity ?? 0),
        unitPriceHt:
          l.unitPriceHt === null || l.unitPriceHt === undefined || l.unitPriceHt === ""
            ? null
            : Number(l.unitPriceHt),
      })),
    );
    await prisma.purchaseOrder.update({
      where: { id },
      data: { amountHt: amountHt ?? undefined },
    });
  }

  const order = await prisma.purchaseOrder.update({
    where: { id },
    data: {
      ...(body.subject != null ? { subject: String(body.subject) } : {}),
      ...(body.responsibleId !== undefined
        ? { responsibleId: body.responsibleId ? String(body.responsibleId) : null }
        : {}),
      ...(body.requestedDeliveryAt !== undefined
        ? {
            requestedDeliveryAt: body.requestedDeliveryAt
              ? new Date(String(body.requestedDeliveryAt))
              : null,
          }
        : {}),
      ...(body.confirmedDeliveryAt !== undefined
        ? {
            confirmedDeliveryAt: body.confirmedDeliveryAt
              ? new Date(String(body.confirmedDeliveryAt))
              : null,
          }
        : {}),
      ...(body.deliveryAddress !== undefined
        ? { deliveryAddress: body.deliveryAddress ? String(body.deliveryAddress) : null }
        : {}),
      ...(body.deliveryInstructions !== undefined
        ? {
            deliveryInstructions: body.deliveryInstructions
              ? String(body.deliveryInstructions)
              : null,
          }
        : {}),
      ...(body.internalNotes !== undefined
        ? { internalNotes: body.internalNotes ? String(body.internalNotes) : null }
        : {}),
    },
    include: purchaseOrderDetailInclude,
  });

  await prisma.purchaseOrderEvent.create({
    data: {
      orderId: id,
      kind: "updated",
      label: "Commande modifiée",
      actorUserId: session.user.id,
    },
  });

  return NextResponse.json({ ok: true, order });
}
