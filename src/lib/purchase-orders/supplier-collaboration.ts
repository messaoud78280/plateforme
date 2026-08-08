import type { Prisma, PurchaseOrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { purchaseOrderDetailInclude } from "@/lib/purchase-orders/service";
import {
  REFUSE_REASONS,
  type SupplierRefuseReasonKey,
} from "@/lib/purchase-orders/supplier-ui";
import { syncPurchaseOrderDeliveryEvent } from "@/lib/purchase-orders/sync-delivery";

export type { SupplierRefuseReasonKey };
export { REFUSE_REASONS };

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

function fmtSlot(d: Date | null | undefined) {
  if (!d) return "—";
  return d.toLocaleString("fr-FR", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function loadSupplierScopedOrder(opts: {
  orderId: string;
  hostOrganizationId: string;
  supplierOrganizationId: string;
}) {
  return prisma.purchaseOrder.findFirst({
    where: {
      id: opts.orderId,
      organizationId: opts.hostOrganizationId,
      externalOrganizationId: opts.supplierOrganizationId,
      sharedWithSupplier: true,
    },
    include: purchaseOrderDetailInclude,
  });
}

async function notifyInternalUsers(opts: {
  orderId: string;
  number: string;
  requestedById: string;
  responsibleId: string | null;
  title: string;
  message: string;
  type?: "DELIVERY_CHECK" | "MESSAGE_RECEIVED" | "CLIENT_DECISION";
}) {
  const ids = new Set<string>([opts.requestedById]);
  if (opts.responsibleId) ids.add(opts.responsibleId);
  const url = `/dashboard/commandes/${opts.orderId}`;
  for (const userId of ids) {
    await createNotification({
      userId,
      type: opts.type ?? "DELIVERY_CHECK",
      title: opts.title,
      message: opts.message,
      actionUrl: url,
    });
  }
}

async function notifySupplierUsers(opts: {
  supplierOrganizationId: string;
  orderId: string;
  title: string;
  message: string;
}) {
  const users = await prisma.user.findMany({
    where: {
      externalOrganizationId: opts.supplierOrganizationId,
      OR: [{ personType: "SUPPLIER" }, { permissionProfile: "FOURNISSEUR" }],
    },
    select: { id: true },
    take: 20,
  });
  for (const u of users) {
    await createNotification({
      userId: u.id,
      type: "DELIVERY_CHECK",
      title: opts.title,
      message: opts.message,
      actionUrl: `/dashboard/commandes/${opts.orderId}`,
    });
  }
}

/** Masque les champs internes avant envoi au fournisseur. */
export function sanitizeOrderForSupplier<T extends Record<string, unknown>>(order: T): T {
  const clone = { ...order };
  delete (clone as { internalNotes?: unknown }).internalNotes;
  delete (clone as { validator?: unknown }).validator;
  delete (clone as { validatorId?: unknown }).validatorId;
  delete (clone as { discountHt?: unknown }).discountHt;
  const withReceipts = clone as unknown as { receipts?: unknown };
  if (Array.isArray(withReceipts.receipts)) {
    withReceipts.receipts = withReceipts.receipts.map((r) => {
      if (!r || typeof r !== "object") return r;
      const { commentInternal: _i, ...rest } = r as Record<string, unknown>;
      return rest;
    });
  }
  return clone;
}

export async function sharePurchaseOrderWithSupplier(opts: {
  orderId: string;
  organizationId: string;
  actorUserId: string;
  contactId?: string | null;
}) {
  const order = await prisma.purchaseOrder.findFirst({
    where: { id: opts.orderId, organizationId: opts.organizationId },
    select: {
      id: true,
      number: true,
      status: true,
      sharedWithSupplier: true,
      externalOrganizationId: true,
      requestedById: true,
      responsibleId: true,
    },
  });
  if (!order) throw new Error("Commande introuvable");

  const nextStatus: PurchaseOrderStatus =
    order.status === "BROUILLON" || order.status === "VALIDEE"
      ? "A_CONFIRMER"
      : order.status === "ENVOYEE_FOURNISSEUR"
        ? "A_CONFIRMER"
        : order.status;

  const data: Prisma.PurchaseOrderUpdateInput = {
    sharedWithSupplier: true,
    status: nextStatus,
  };
  if (opts.contactId) {
    data.contact = { connect: { id: opts.contactId } };
  }

  const updated = await prisma.purchaseOrder.update({
    where: { id: order.id },
    data,
  });

  await appendEvent({
    orderId: order.id,
    kind: "shared",
    label: "Commande partagée fournisseur",
    detail: `${order.number} — visible par le fournisseur`,
    actorUserId: opts.actorUserId,
  });

  await notifySupplierUsers({
    supplierOrganizationId: order.externalOrganizationId,
    orderId: order.id,
    title: `Nouvelle commande à confirmer — ${order.number}`,
    message: "Une commande vous a été partagée. Merci de confirmer ou proposer un créneau.",
  });

  await syncPurchaseOrderDeliveryEvent({
    orderId: order.id,
    actorUserId: opts.actorUserId,
  });

  return updated;
}

export async function supplierConfirmPurchaseOrder(opts: {
  orderId: string;
  hostOrganizationId: string;
  supplierOrganizationId: string;
  actorUserId: string;
  actorName: string;
  supplierOrgName: string;
  confirmedDeliveryAt?: Date | null;
}) {
  const order = await loadSupplierScopedOrder({
    orderId: opts.orderId,
    hostOrganizationId: opts.hostOrganizationId,
    supplierOrganizationId: opts.supplierOrganizationId,
  });
  if (!order) throw new Error("Commande introuvable ou non partagée");
  if (!["A_CONFIRMER", "ENVOYEE_FOURNISSEUR"].includes(order.status)) {
    throw new Error("Cette commande ne peut plus être confirmée");
  }

  const confirmedAt =
    opts.confirmedDeliveryAt ?? order.requestedDeliveryAt ?? new Date();

  const updated = await prisma.purchaseOrder.update({
    where: { id: order.id },
    data: {
      status: "CONFIRMEE",
      confirmedDeliveryAt: confirmedAt,
      proposedDeliveryAt: null,
      proposedDeliveryComment: null,
      proposedDeliveryStatus: "NONE",
    },
  });

  await appendEvent({
    orderId: order.id,
    kind: "supplier_confirm",
    label: "Commande confirmée",
    detail: `${opts.actorName} (${opts.supplierOrgName}) — livraison confirmée : ${fmtSlot(confirmedAt)}`,
    actorUserId: opts.actorUserId,
  });

  await notifyInternalUsers({
    orderId: order.id,
    number: order.number,
    requestedById: order.requestedById,
    responsibleId: order.responsibleId,
    title: `${opts.supplierOrgName} a confirmé la livraison`,
    message: `${order.number} — ${fmtSlot(confirmedAt)}`,
  });

  await syncPurchaseOrderDeliveryEvent({
    orderId: order.id,
    actorUserId: opts.actorUserId,
    postSystemMessage: true,
    systemMessage: `✓ Livraison confirmée — ${fmtSlot(confirmedAt)}\n${order.number} · ${opts.supplierOrgName}\n[Voir la commande](/dashboard/commandes/${order.id})`,
  });

  return updated;
}

export async function supplierProposeDelivery(opts: {
  orderId: string;
  hostOrganizationId: string;
  supplierOrganizationId: string;
  actorUserId: string;
  actorName: string;
  supplierOrgName: string;
  proposedDeliveryAt: Date;
  comment?: string | null;
}) {
  const order = await loadSupplierScopedOrder({
    orderId: opts.orderId,
    hostOrganizationId: opts.hostOrganizationId,
    supplierOrganizationId: opts.supplierOrganizationId,
  });
  if (!order) throw new Error("Commande introuvable ou non partagée");
  if (
    !["A_CONFIRMER", "ENVOYEE_FOURNISSEUR", "CONFIRMEE", "LIVRAISON_PROGRAMMEE"].includes(
      order.status,
    )
  ) {
    throw new Error("Proposition impossible pour ce statut");
  }
  if (!order.requestedDeliveryAt) {
    throw new Error("Aucune date demandée à comparer");
  }

  // Ne jamais écraser requestedDeliveryAt ni confirmedDeliveryAt ici.
  const updated = await prisma.purchaseOrder.update({
    where: { id: order.id },
    data: {
      proposedDeliveryAt: opts.proposedDeliveryAt,
      proposedDeliveryComment: opts.comment?.trim() || null,
      proposedDeliveryStatus: "PENDING",
      // Rester en attente de validation interne si pas encore confirmée
      status:
        order.status === "CONFIRMEE" || order.status === "LIVRAISON_PROGRAMMEE"
          ? order.status
          : "A_CONFIRMER",
    },
  });

  await appendEvent({
    orderId: order.id,
    kind: "supplier_propose",
    label: "Proposition nouvelle date",
    detail: `${opts.actorName} (${opts.supplierOrgName}) propose ${fmtSlot(opts.proposedDeliveryAt)} (demandé : ${fmtSlot(order.requestedDeliveryAt)})${opts.comment?.trim() ? ` — « ${opts.comment.trim()} »` : ""}`,
    actorUserId: opts.actorUserId,
  });

  await notifyInternalUsers({
    orderId: order.id,
    number: order.number,
    requestedById: order.requestedById,
    responsibleId: order.responsibleId,
    title: `${opts.supplierOrgName} propose une nouvelle heure de livraison`,
    message: `${order.number} : ${fmtSlot(opts.proposedDeliveryAt)} au lieu de ${fmtSlot(order.requestedDeliveryAt)}`,
    type: "CLIENT_DECISION",
  });

  // Agenda confirmé / demandé inchangé ; description peut mentionner la proposition
  await syncPurchaseOrderDeliveryEvent({
    orderId: order.id,
    actorUserId: opts.actorUserId,
    postSystemMessage: Boolean(order.legacyTaskId),
    systemMessage: order.legacyTaskId
      ? `POINT.P propose une modification de livraison — ${fmtSlot(order.requestedDeliveryAt)} → ${fmtSlot(opts.proposedDeliveryAt)}\n[Voir la commande](/dashboard/commandes/${order.id})`
      : null,
  });

  return updated;
}

export async function supplierRefusePurchaseOrder(opts: {
  orderId: string;
  hostOrganizationId: string;
  supplierOrganizationId: string;
  actorUserId: string;
  actorName: string;
  supplierOrgName: string;
  reasonKey: SupplierRefuseReasonKey;
  detail?: string | null;
}) {
  const order = await loadSupplierScopedOrder({
    orderId: opts.orderId,
    hostOrganizationId: opts.hostOrganizationId,
    supplierOrganizationId: opts.supplierOrganizationId,
  });
  if (!order) throw new Error("Commande introuvable ou non partagée");
  if (!["A_CONFIRMER", "ENVOYEE_FOURNISSEUR"].includes(order.status)) {
    throw new Error("Cette commande ne peut plus être refusée");
  }

  const reasonLabel =
    REFUSE_REASONS.find((r) => r.key === opts.reasonKey)?.label ?? "Autre";

  const updated = await prisma.purchaseOrder.update({
    where: { id: order.id },
    data: {
      status: "REFUSEE",
      supplierRefuseReason: reasonLabel,
      proposedDeliveryStatus: "NONE",
      proposedDeliveryAt: null,
      proposedDeliveryComment: null,
    },
  });

  await appendEvent({
    orderId: order.id,
    kind: "supplier_refuse",
    label: "Commande refusée",
    detail: `${opts.actorName} (${opts.supplierOrgName}) — ${reasonLabel}${opts.detail?.trim() ? ` — ${opts.detail.trim()}` : ""}`,
    actorUserId: opts.actorUserId,
  });

  await notifyInternalUsers({
    orderId: order.id,
    number: order.number,
    requestedById: order.requestedById,
    responsibleId: order.responsibleId,
    title: `${opts.supplierOrgName} a refusé ${order.number}`,
    message: reasonLabel,
    type: "CLIENT_DECISION",
  });

  await syncPurchaseOrderDeliveryEvent({
    orderId: order.id,
    actorUserId: opts.actorUserId,
  });

  return updated;
}

export async function acceptSupplierDeliveryProposal(opts: {
  orderId: string;
  organizationId: string;
  actorUserId: string;
  actorName: string;
}) {
  const order = await prisma.purchaseOrder.findFirst({
    where: { id: opts.orderId, organizationId: opts.organizationId },
    select: {
      id: true,
      number: true,
      requestedDeliveryAt: true,
      confirmedDeliveryAt: true,
      proposedDeliveryAt: true,
      proposedDeliveryStatus: true,
      externalOrganizationId: true,
      externalOrganization: { select: { name: true, tradeName: true } },
    },
  });
  if (!order) throw new Error("Commande introuvable");
  if (order.proposedDeliveryStatus !== "PENDING" || !order.proposedDeliveryAt) {
    throw new Error("Aucune proposition en attente");
  }

  const supplierName =
    order.externalOrganization.tradeName || order.externalOrganization.name;

  const updated = await prisma.purchaseOrder.update({
    where: { id: order.id },
    data: {
      confirmedDeliveryAt: order.proposedDeliveryAt,
      proposedDeliveryStatus: "ACCEPTED",
      status: "CONFIRMEE",
    },
  });

  await appendEvent({
    orderId: order.id,
    kind: "proposal_accepted",
    label: "Proposition acceptée",
    detail: `${opts.actorName} accepte ${fmtSlot(order.proposedDeliveryAt)} (demandé conservé : ${fmtSlot(order.requestedDeliveryAt)})`,
    actorUserId: opts.actorUserId,
  });

  await notifySupplierUsers({
    supplierOrganizationId: order.externalOrganizationId,
    orderId: order.id,
    title: `Votre proposition de livraison a été acceptée`,
    message: `${order.number} — créneau confirmé ${fmtSlot(order.proposedDeliveryAt)}`,
  });

  await syncPurchaseOrderDeliveryEvent({
    orderId: order.id,
    actorUserId: opts.actorUserId,
    postSystemMessage: true,
    systemMessage: `✓ Livraison confirmée — ${fmtSlot(order.proposedDeliveryAt)}\n${order.number} · ${supplierName}\nAcceptée par ${opts.actorName}\n[Voir la commande](/dashboard/commandes/${order.id})`,
  });

  return updated;
}

export async function refuseSupplierDeliveryProposal(opts: {
  orderId: string;
  organizationId: string;
  actorUserId: string;
  actorName: string;
  comment?: string | null;
}) {
  const order = await prisma.purchaseOrder.findFirst({
    where: { id: opts.orderId, organizationId: opts.organizationId },
    select: {
      id: true,
      number: true,
      confirmedDeliveryAt: true,
      proposedDeliveryAt: true,
      proposedDeliveryStatus: true,
      externalOrganizationId: true,
    },
  });
  if (!order) throw new Error("Commande introuvable");
  if (order.proposedDeliveryStatus !== "PENDING") {
    throw new Error("Aucune proposition en attente");
  }

  const updated = await prisma.purchaseOrder.update({
    where: { id: order.id },
    data: {
      proposedDeliveryStatus: "REFUSED",
      // confirmedDeliveryAt volontairement non touché
    },
  });

  await appendEvent({
    orderId: order.id,
    kind: "proposal_refused",
    label: "Proposition refusée",
    detail: `${opts.actorName} refuse ${fmtSlot(order.proposedDeliveryAt)}${opts.comment?.trim() ? ` — ${opts.comment.trim()}` : ""}`,
    actorUserId: opts.actorUserId,
  });

  await notifySupplierUsers({
    supplierOrganizationId: order.externalOrganizationId,
    orderId: order.id,
    title: `Proposition refusée — ${order.number}`,
    message: "Votre créneau n’a pas été accepté. Vous pouvez proposer une autre date.",
  });

  await syncPurchaseOrderDeliveryEvent({
    orderId: order.id,
    actorUserId: opts.actorUserId,
  });

  return updated;
}

