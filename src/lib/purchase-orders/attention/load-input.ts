/**
 * CDE-3B2.1 — Charge une commande en PurchaseOrderAttentionInput (1 PO).
 */
import { prisma } from "@/lib/prisma";
import type { PurchaseOrderAttentionInput } from "@/lib/purchase-orders/attention/types";

export async function loadPurchaseOrderAttentionInput(
  orderId: string,
): Promise<PurchaseOrderAttentionInput | null> {
  const o = await prisma.purchaseOrder.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      number: true,
      subject: true,
      status: true,
      sharedWithSupplier: true,
      requestedDeliveryAt: true,
      confirmedDeliveryAt: true,
      proposedDeliveryAt: true,
      proposedDeliveryStatus: true,
      supplierRefuseReason: true,
      responsibleId: true,
      requestedById: true,
      responsible: { select: { id: true, name: true } },
      requestedBy: { select: { id: true, name: true } },
      externalOrganization: { select: { name: true, tradeName: true } },
      project: { select: { id: true, title: true } },
      lines: {
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          designation: true,
          unit: true,
          quantity: true,
        },
      },
      receipts: {
        select: {
          id: true,
          receivedAt: true,
          cancelledAt: true,
          status: true,
          deliveryNoteNumber: true,
          documents: {
            where: { kind: "BL" },
            select: { id: true },
            take: 1,
          },
          lines: {
            select: {
              orderLineId: true,
              receivedQty: true,
              damagedQty: true,
              refusedQty: true,
            },
          },
        },
      },
      events: {
        where: {
          kind: { in: ["shared", "supplier_propose", "supplier_refuse"] },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { id: true, kind: true, createdAt: true },
      },
      agendaEvents: {
        where: { type: "LIVRAISON", status: { not: "ANNULE" } },
        take: 1,
        select: { id: true },
      },
    },
  });
  if (!o) return null;

  const receiptLines = o.receipts.flatMap((r) =>
    r.lines.map((l) => ({
      orderLineId: l.orderLineId,
      receivedQty: Number(l.receivedQty),
      damagedQty: Number(l.damagedQty),
      refusedQty: Number(l.refusedQty),
      receiptId: r.id,
    })),
  );

  const sharedEv = o.events.find((e) => e.kind === "shared");
  const proposeEv = o.events.find((e) => e.kind === "supplier_propose");
  const refuseEv = o.events.find((e) => e.kind === "supplier_refuse");

  return {
    id: o.id,
    number: o.number,
    status: o.status,
    subject: o.subject,
    sharedWithSupplier: o.sharedWithSupplier,
    sharedWithSupplierAt: sharedEv?.createdAt ?? null,
    sharedEventId: sharedEv?.id ?? null,
    proposeEventId: proposeEv?.id ?? null,
    refuseEventId: refuseEv?.id ?? null,
    requestedDeliveryAt: o.requestedDeliveryAt,
    confirmedDeliveryAt: o.confirmedDeliveryAt,
    proposedDeliveryAt: o.proposedDeliveryAt,
    proposedDeliveryStatus: o.proposedDeliveryStatus,
    supplierRefuseReason: o.supplierRefuseReason,
    supplierName: o.externalOrganization.tradeName || o.externalOrganization.name,
    projectTitle: o.project?.title ?? null,
    responsibleId: o.responsibleId,
    responsibleName: o.responsible?.name ?? null,
    requestedById: o.requestedById,
    requestedByName: o.requestedBy?.name ?? null,
    lines: o.lines.map((l) => ({
      id: l.id,
      designation: l.designation,
      unit: l.unit,
      quantity: Number(l.quantity),
    })),
    receipts: o.receipts.map((r) => ({
      id: r.id,
      receivedAt: r.receivedAt,
      cancelledAt: r.cancelledAt,
      status: r.status,
      deliveryNoteNumber: r.deliveryNoteNumber,
      hasBlDocument: r.documents.length > 0,
    })),
    receiptLines,
    agendaEventId: o.agendaEvents[0]?.id ?? null,
  };
}
