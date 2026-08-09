/**
 * CDE-3B1 — Chargement batch des diagnostics commande (évite N+1).
 */
import { prisma } from "@/lib/prisma";
import { serializeAttentionResult } from "@/lib/follow-up/attention/evaluate";
import type { SerializedAttention } from "@/lib/follow-up/attention/evaluate";
import {
  evaluatePurchaseOrderAttention,
  resolvePurchaseOrderAttentionResponsible,
} from "@/lib/purchase-orders/attention/evaluate";
import type { PurchaseOrderAttentionPolicy } from "@/lib/purchase-orders/attention/policy";
import { DEFAULT_PURCHASE_ORDER_ATTENTION_POLICY } from "@/lib/purchase-orders/attention/policy";

const ACTIVE_STATUSES = [
  "A_VALIDER",
  "VALIDEE",
  "ENVOYEE_FOURNISSEUR",
  "A_CONFIRMER",
  "CONFIRMEE",
  "LIVRAISON_PROGRAMMEE",
  "PARTIELLEMENT_RECUE",
  "REFUSEE",
  // RECUE incluse pour BL manquant éventuel juste après clôture réception
  "RECUE",
] as const;

export type PurchaseOrderAttentionBatchRow = {
  id: string;
  number: string;
  subject: string;
  status: string;
  sharedWithSupplier: boolean;
  requestedDeliveryAt: Date | null;
  confirmedDeliveryAt: Date | null;
  proposedDeliveryAt: Date | null;
  proposedDeliveryStatus: string;
  supplierRefuseReason: string | null;
  supplierName: string | null;
  projectId: string | null;
  projectTitle: string | null;
  responsibleId: string | null;
  responsibleName: string | null;
  requestedById: string;
  requestedByName: string | null;
  lineDesignations: string[];
  agendaEventId: string | null;
  sharedWithSupplierAt: Date | null;
  attention: SerializedAttention;
};

export async function loadPurchaseOrderAttention(opts: {
  organizationId: string;
  /** Filtrer aux commandes dont le responsable / demandeur = userId */
  actorUserId?: string | null;
  take?: number;
  now?: Date;
  policy?: PurchaseOrderAttentionPolicy;
  /** PERF-V1 : moins de lignes / docs pour badge & accueil */
  light?: boolean;
}): Promise<PurchaseOrderAttentionBatchRow[]> {
  const take = opts.take ?? 120;
  const now = opts.now ?? new Date();
  const policy = opts.policy ?? DEFAULT_PURCHASE_ORDER_ATTENTION_POLICY;
  const light = Boolean(opts.light);
  void light; // réservé : take déjà plafonné côté collect ; lignes/docs toujours complets pour qty/BL

  const orders = await prisma.purchaseOrder.findMany({
    where: {
      organizationId: opts.organizationId,
      status: { in: [...ACTIVE_STATUSES] },
      ...(opts.actorUserId
        ? {
            OR: [
              { responsibleId: opts.actorUserId },
              { requestedById: opts.actorUserId },
            ],
          }
        : {}),
    },
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
        orderBy: { sortOrder: "asc" as const },
        // Toujours toutes les lignes — le snapshot qty ne doit pas être tronqué (badge / board)
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
    orderBy: { updatedAt: "desc" },
    take,
  });

  const rows: PurchaseOrderAttentionBatchRow[] = [];

  for (const o of orders) {
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

    const input = {
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

    const attention = serializeAttentionResult(
      evaluatePurchaseOrderAttention(input, { now, policy }),
    );

    const responsible = resolvePurchaseOrderAttentionResponsible(input);

    rows.push({
      id: o.id,
      number: o.number,
      subject: o.subject,
      status: o.status,
      sharedWithSupplier: o.sharedWithSupplier,
      requestedDeliveryAt: o.requestedDeliveryAt,
      confirmedDeliveryAt: o.confirmedDeliveryAt,
      proposedDeliveryAt: o.proposedDeliveryAt,
      proposedDeliveryStatus: o.proposedDeliveryStatus,
      supplierRefuseReason: o.supplierRefuseReason,
      supplierName: input.supplierName,
      projectId: o.project?.id ?? null,
      projectTitle: input.projectTitle,
      responsibleId: responsible.id,
      responsibleName: responsible.name,
      requestedById: o.requestedById,
      requestedByName: o.requestedBy?.name ?? null,
      lineDesignations: o.lines.map((l) => l.designation),
      agendaEventId: input.agendaEventId,
      sharedWithSupplierAt: input.sharedWithSupplierAt,
      attention,
    });
  }

  return rows;
}
