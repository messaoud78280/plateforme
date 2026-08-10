/**
 * Projection DB partagée pour evaluatePurchaseOrderAttention + snapshot réception.
 * Pas de moteur distinct — select minimal métier.
 */
import type { Prisma } from "@prisma/client";

/** Relations nécessaires au moteur attention (liste, badge, board, cockpit). */
export const purchaseOrderAttentionSelect = {
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
    orderBy: { sortOrder: "asc" as const },
    // Toutes les lignes — qty / BL ne doivent pas être tronqués.
    select: {
      id: true,
      designation: true,
      unit: true,
      quantity: true,
    },
  },
  // evaluate filtre déjà cancelledAt — exclure en DB réduit le payload.
  receipts: {
    where: { cancelledAt: null },
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
  // Derniers events utiles (shared / propose / refuse) — pas l’historique complet.
  events: {
    where: {
      kind: { in: ["shared", "supplier_propose", "supplier_refuse"] },
    },
    orderBy: { createdAt: "desc" as const },
    take: 6,
    select: { id: true, kind: true, createdAt: true },
  },
  agendaEvents: {
    where: { type: "LIVRAISON", status: { not: "ANNULE" } },
    take: 1,
    select: { id: true },
  },
} satisfies Prisma.PurchaseOrderSelect;

export type PurchaseOrderAttentionDbRow = Prisma.PurchaseOrderGetPayload<{
  select: typeof purchaseOrderAttentionSelect;
}>;
