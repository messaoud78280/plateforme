import type { Prisma, PurchaseOrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { generatePurchaseOrderNumber } from "@/lib/purchase-orders/numbering";
import { computeOrderAmountHt } from "@/lib/purchase-orders/totals";
import {
  canTransitionPurchaseOrder,
  PURCHASE_ORDER_STATUS_LABELS,
} from "@/lib/purchase-orders/status";

export type CreatePurchaseOrderLineInput = {
  designation: string;
  quantity: number;
  unit?: string;
  unitPriceHt?: number | null;
  tvaRate?: number | null;
};

export type CreatePurchaseOrderInput = {
  organizationId: string;
  subject: string;
  projectId: string;
  externalOrganizationId: string;
  contactId?: string | null;
  requestedById: string;
  responsibleId?: string | null;
  followUpSheetId?: string | null;
  requestedDeliveryAt?: Date | null;
  deliveryPlaceType?: string;
  deliveryAddress?: string | null;
  lines: CreatePurchaseOrderLineInput[];
  status?: PurchaseOrderStatus;
  internalNotes?: string | null;
  deliveryInstructions?: string | null;
  urgency?: string | null;
  /** Champs détail optionnels */
  details?: {
    supplierRef?: string | null;
    quoteRef?: string | null;
    quoteDate?: Date | null;
    tvaRate?: number | null;
    discountHt?: number | null;
    deliveryFeesHt?: number | null;
    paymentTerms?: string | null;
    siteContactName?: string | null;
    siteContactPhone?: string | null;
    partialDeliveryAllowed?: boolean;
    supplierNotes?: string | null;
    validatorId?: string | null;
  };
};

async function appendEvent(opts: {
  orderId: string;
  kind: string;
  label: string;
  detail?: string | null;
  actorUserId?: string | null;
}) {
  await prisma.purchaseOrderEvent.create({
    data: {
      orderId: opts.orderId,
      kind: opts.kind,
      label: opts.label,
      detail: opts.detail ?? undefined,
      actorUserId: opts.actorUserId ?? undefined,
    },
  });
}

export async function createPurchaseOrder(input: CreatePurchaseOrderInput) {
  const lines = input.lines
    .map((l) => ({
      designation: l.designation.trim(),
      quantity: Number(l.quantity),
      unit: (l.unit ?? "U").trim() || "U",
      unitPriceHt: l.unitPriceHt ?? null,
      tvaRate: l.tvaRate ?? null,
    }))
    .filter((l) => l.designation && l.quantity > 0);

  if (!input.subject.trim()) throw new Error("Objet requis");
  if (!input.projectId) throw new Error("Chantier requis");
  if (!input.externalOrganizationId) throw new Error("Fournisseur requis");
  if (lines.length === 0) throw new Error("Au moins une ligne est requise");

  const amountHt = computeOrderAmountHt(lines, {
    discountHt: input.details?.discountHt,
    deliveryFeesHt: input.details?.deliveryFeesHt,
  });

  const number = await generatePurchaseOrderNumber(input.organizationId);
  const status = input.status ?? "A_CONFIRMER";

  const order = await prisma.purchaseOrder.create({
    data: {
      organizationId: input.organizationId,
      number,
      status,
      subject: input.subject.trim(),
      projectId: input.projectId,
      followUpSheetId: input.followUpSheetId ?? undefined,
      externalOrganizationId: input.externalOrganizationId,
      contactId: input.contactId ?? undefined,
      requestedById: input.requestedById,
      responsibleId: input.responsibleId ?? undefined,
      validatorId: input.details?.validatorId ?? undefined,
      requestedDeliveryAt: input.requestedDeliveryAt ?? undefined,
      deliveryPlaceType: input.deliveryPlaceType ?? "CHANTIER",
      deliveryAddress: input.deliveryAddress ?? undefined,
      amountHt: amountHt ?? undefined,
      tvaRate: input.details?.tvaRate ?? undefined,
      discountHt: input.details?.discountHt ?? undefined,
      deliveryFeesHt: input.details?.deliveryFeesHt ?? undefined,
      supplierRef: input.details?.supplierRef ?? undefined,
      quoteRef: input.details?.quoteRef ?? undefined,
      quoteDate: input.details?.quoteDate ?? undefined,
      paymentTerms: input.details?.paymentTerms ?? undefined,
      deliveryInstructions: input.deliveryInstructions ?? undefined,
      siteContactName: input.details?.siteContactName ?? undefined,
      siteContactPhone: input.details?.siteContactPhone ?? undefined,
      partialDeliveryAllowed: input.details?.partialDeliveryAllowed ?? true,
      internalNotes: input.internalNotes ?? undefined,
      supplierNotes: input.details?.supplierNotes ?? undefined,
      urgency: input.urgency ?? undefined,
      lines: {
        create: lines.map((l, i) => ({
          designation: l.designation,
          quantity: l.quantity,
          unit: l.unit,
          unitPriceHt: l.unitPriceHt ?? undefined,
          tvaRate: l.tvaRate ?? undefined,
          sortOrder: i,
        })),
      },
    },
    include: {
      lines: true,
      externalOrganization: { select: { id: true, name: true, tradeName: true } },
      project: { select: { id: true, title: true } },
    },
  });

  await appendEvent({
    orderId: order.id,
    kind: "created",
    label: "Commande créée",
    detail: `${order.number} — ${order.subject}`,
    actorUserId: input.requestedById,
  });

  return order;
}

export async function transitionPurchaseOrder(opts: {
  orderId: string;
  organizationId: string;
  toStatus: PurchaseOrderStatus;
  actorUserId: string;
  confirmedDeliveryAt?: Date | null;
  shareWithSupplier?: boolean;
  detail?: string | null;
}) {
  const order = await prisma.purchaseOrder.findFirst({
    where: { id: opts.orderId, organizationId: opts.organizationId },
    select: { id: true, status: true, number: true },
  });
  if (!order) throw new Error("Commande introuvable");
  if (!canTransitionPurchaseOrder(order.status, opts.toStatus)) {
    throw new Error(
      `Transition impossible : ${PURCHASE_ORDER_STATUS_LABELS[order.status]} → ${PURCHASE_ORDER_STATUS_LABELS[opts.toStatus]}`,
    );
  }

  const data: Prisma.PurchaseOrderUpdateInput = {
    status: opts.toStatus,
  };
  if (opts.confirmedDeliveryAt !== undefined) {
    data.confirmedDeliveryAt = opts.confirmedDeliveryAt;
  }
  if (opts.shareWithSupplier || opts.toStatus === "ENVOYEE_FOURNISSEUR") {
    data.sharedWithSupplier = true;
  }

  const updated = await prisma.purchaseOrder.update({
    where: { id: order.id },
    data,
  });

  await appendEvent({
    orderId: order.id,
    kind: "status",
    label: PURCHASE_ORDER_STATUS_LABELS[opts.toStatus],
    detail: opts.detail ?? `${order.number} → ${PURCHASE_ORDER_STATUS_LABELS[opts.toStatus]}`,
    actorUserId: opts.actorUserId,
  });

  return updated;
}

export const purchaseOrderDetailInclude = {
  lines: { orderBy: { sortOrder: "asc" as const } },
  events: { orderBy: { createdAt: "desc" as const }, take: 40 },
  documents: { orderBy: { createdAt: "desc" as const }, take: 20 },
  externalOrganization: {
    select: {
      id: true,
      name: true,
      tradeName: true,
      phone: true,
      email: true,
      activity: true,
    },
  },
  contact: {
    select: { id: true, firstName: true, lastName: true, jobTitle: true, email: true, phone: true },
  },
  project: {
    select: { id: true, title: true, siteAddress: true, siteCity: true },
  },
  followUpSheet: { select: { id: true, title: true, osNumber: true } },
  requestedBy: { select: { id: true, name: true } },
  responsible: { select: { id: true, name: true } },
  validator: { select: { id: true, name: true } },
} satisfies Prisma.PurchaseOrderInclude;
