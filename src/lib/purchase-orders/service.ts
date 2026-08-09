import type { Prisma, PurchaseOrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { generatePurchaseOrderNumber } from "@/lib/purchase-orders/numbering";
import { computeOrderAmountHt } from "@/lib/purchase-orders/totals";
import {
  canTransitionPurchaseOrder,
  PURCHASE_ORDER_STATUS_LABELS,
} from "@/lib/purchase-orders/status";
import { syncPurchaseOrderDeliveryEvent } from "@/lib/purchase-orders/sync-delivery";
import { createNotification } from "@/lib/notifications";
import { safeSyncPurchaseOrderAttentionAfterMutation } from "@/lib/purchase-orders/attention/sync-notifications";

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

  if (input.requestedDeliveryAt) {
    await syncPurchaseOrderDeliveryEvent({
      orderId: order.id,
      actorUserId: input.requestedById,
    });
  }

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

  if (
    opts.toStatus === "ANNULEE" ||
    opts.toStatus === "CONFIRMEE" ||
    opts.toStatus === "A_CONFIRMER" ||
    opts.toStatus === "LIVRAISON_PROGRAMMEE" ||
    opts.confirmedDeliveryAt !== undefined
  ) {
    await syncPurchaseOrderDeliveryEvent({
      orderId: order.id,
      actorUserId: opts.actorUserId,
    });
  }

  if (opts.toStatus === "ANNULEE") {
    const full = await prisma.purchaseOrder.findUnique({
      where: { id: order.id },
      select: {
        number: true,
        requestedById: true,
        responsibleId: true,
        sharedWithSupplier: true,
        externalOrganizationId: true,
      },
    });
    if (full) {
      const ids = new Set<string>([full.requestedById]);
      if (full.responsibleId) ids.add(full.responsibleId);
      for (const userId of ids) {
        await createNotification({
          userId,
          type: "DELIVERY_CHECK",
          title: `Commande annulée — ${full.number}`,
          message: "La livraison associée a été retirée de l’agenda actif.",
          actionUrl: `/dashboard/commandes/${order.id}`,
        });
      }
      if (full.sharedWithSupplier) {
        const suppliers = await prisma.user.findMany({
          where: {
            externalOrganizationId: full.externalOrganizationId,
            OR: [{ personType: "SUPPLIER" }, { permissionProfile: "FOURNISSEUR" }],
          },
          select: { id: true },
          take: 20,
        });
        for (const u of suppliers) {
          await createNotification({
            userId: u.id,
            type: "DELIVERY_CHECK",
            title: `Commande annulée — ${full.number}`,
            message: "Cette commande a été annulée par l’entreprise.",
            actionUrl: `/dashboard/commandes/${order.id}`,
          });
        }
      }
    }
  }

  await safeSyncPurchaseOrderAttentionAfterMutation(order.id);

  return updated;
}

export const purchaseOrderDetailInclude = {
  lines: { orderBy: { sortOrder: "asc" as const } },
  events: { orderBy: { createdAt: "desc" as const }, take: 40 },
  documents: { orderBy: { createdAt: "desc" as const }, take: 20 },
  organization: { select: { id: true, name: true } },
  externalOrganization: {
    select: {
      id: true,
      name: true,
      tradeName: true,
      phone: true,
      email: true,
      activity: true,
      contacts: {
        orderBy: [{ isPrimary: "desc" as const }, { lastName: "asc" as const }],
        take: 12,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          jobTitle: true,
        },
      },
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
  agendaEvents: {
    where: { type: "LIVRAISON", status: { not: "ANNULE" } },
    orderBy: { startAt: "asc" as const },
    take: 1,
    select: { id: true, startAt: true, status: true, title: true },
  },
  receipts: {
    where: { cancelledAt: null },
    orderBy: { receivedAt: "desc" as const },
    take: 10,
    select: {
      id: true,
      receivedAt: true,
      status: true,
      deliveryNoteNumber: true,
      commentShared: true,
      receivedBy: { select: { id: true, name: true } },
      documents: {
        where: { kind: "BL" },
        take: 3,
        select: { id: true, name: true, fileUrl: true },
      },
    },
  },
} satisfies Prisma.PurchaseOrderInclude;
