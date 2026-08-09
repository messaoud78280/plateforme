/**
 * CDE-3A — Réception chantier : état quantités + création / annulation de réceptions.
 *
 * Source de vérité quantités = PurchaseOrderReceiptLine (réceptions non annulées).
 * PurchaseOrderLine.receivedQty = cache UI/listes uniquement — jamais pour alertes critiques.
 * Après chaque mutation de réception, refreshLineCaches() recalcule ce cache.
 */
import type { PurchaseOrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { syncPurchaseOrderDeliveryEvent } from "@/lib/purchase-orders/sync-delivery";
import { safeSyncPurchaseOrderAttentionAfterMutation } from "@/lib/purchase-orders/attention/sync-notifications";

export type ReceiptLineInput = {
  orderLineId: string;
  receivedQty: number;
  damagedQty?: number;
  refusedQty?: number;
  refuseReason?: string | null;
  comment?: string | null;
};

export type LineReceivingState = {
  orderLineId: string;
  designation: string;
  unit: string;
  ordered: number;
  receivedConforming: number;
  damaged: number;
  refused: number;
  remaining: number;
};

export type PurchaseOrderReceivingState = {
  orderId: string;
  lines: LineReceivingState[];
  totalOrdered: number;
  totalReceivedConforming: number;
  totalDamaged: number;
  totalRefused: number;
  totalRemaining: number;
  fullyReceived: boolean;
  partiallyReceived: boolean;
  hasIssues: boolean;
  suggestedStatus: PurchaseOrderStatus | null;
};

function n(v: unknown): number {
  const x = typeof v === "number" ? v : Number(v);
  return Number.isFinite(x) ? x : 0;
}

/** Quantité conforme = reçue physiquement − endommagée − refusée (min 0). */
export function conformingQty(received: number, damaged: number, refused: number): number {
  return Math.max(0, received - damaged - refused);
}

export async function getPurchaseOrderReceivingState(
  orderId: string,
): Promise<PurchaseOrderReceivingState | null> {
  const order = await prisma.purchaseOrder.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      status: true,
      lines: {
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          designation: true,
          unit: true,
          quantity: true,
          receiptLines: {
            where: { receipt: { cancelledAt: null } },
            select: {
              receivedQty: true,
              damagedQty: true,
              refusedQty: true,
            },
          },
        },
      },
    },
  });
  if (!order) return null;

  const lines: LineReceivingState[] = order.lines.map((l) => {
    let received = 0;
    let damaged = 0;
    let refused = 0;
    for (const rl of l.receiptLines) {
      received += n(rl.receivedQty);
      damaged += n(rl.damagedQty);
      refused += n(rl.refusedQty);
    }
    const conforming = conformingQty(received, damaged, refused);
    const ordered = n(l.quantity);
    return {
      orderLineId: l.id,
      designation: l.designation,
      unit: l.unit,
      ordered,
      receivedConforming: conforming,
      damaged,
      refused,
      remaining: Math.max(0, ordered - conforming),
    };
  });

  const totalOrdered = lines.reduce((s, l) => s + l.ordered, 0);
  const totalReceivedConforming = lines.reduce((s, l) => s + l.receivedConforming, 0);
  const totalDamaged = lines.reduce((s, l) => s + l.damaged, 0);
  const totalRefused = lines.reduce((s, l) => s + l.refused, 0);
  const totalRemaining = lines.reduce((s, l) => s + l.remaining, 0);
  const hasIssues = totalDamaged > 0 || totalRefused > 0;
  const fullyReceived = lines.length > 0 && totalRemaining === 0 && totalOrdered > 0;
  const partiallyReceived = totalReceivedConforming > 0 && !fullyReceived;

  let suggestedStatus: PurchaseOrderStatus | null = null;
  if (fullyReceived) suggestedStatus = "RECUE";
  else if (partiallyReceived || hasIssues) suggestedStatus = "PARTIELLEMENT_RECUE";

  return {
    orderId: order.id,
    lines,
    totalOrdered,
    totalReceivedConforming,
    totalDamaged,
    totalRefused,
    totalRemaining,
    fullyReceived,
    partiallyReceived,
    hasIssues,
    suggestedStatus,
  };
}

/** Recalcule le cache receivedQty depuis les réceptions actives (transactionnel). */
export async function refreshLineCaches(orderId: string) {
  const state = await getPurchaseOrderReceivingState(orderId);
  if (!state) return null;
  await prisma.$transaction(
    state.lines.map((line) =>
      prisma.purchaseOrderLine.update({
        where: { id: line.orderLineId },
        data: { receivedQty: line.receivedConforming },
      }),
    ),
  );
  return state;
}

async function deriveOrderStatusAfterReceipt(orderId: string) {
  const state = await refreshLineCaches(orderId);
  if (!state?.suggestedStatus) return state;

  const order = await prisma.purchaseOrder.findUnique({
    where: { id: orderId },
    select: { status: true },
  });
  if (!order) return state;

  // Ne pas rétrograder une commande déjà clôturée
  if (order.status === "CLOTUREE" || order.status === "ANNULEE") return state;

  if (state.suggestedStatus !== order.status) {
    await prisma.purchaseOrder.update({
      where: { id: orderId },
      data: { status: state.suggestedStatus },
    });
  }
  return state;
}

export async function createPurchaseOrderReceipt(opts: {
  organizationId: string;
  orderId: string;
  receivedById: string;
  receivedByName: string;
  lines: ReceiptLineInput[];
  deliveryNoteNumber?: string | null;
  commentShared?: string | null;
  commentInternal?: string | null;
  blFileUrl?: string | null;
  blFileName?: string | null;
  allowOverReceive?: boolean;
}) {
  const order = await prisma.purchaseOrder.findFirst({
    where: { id: opts.orderId, organizationId: opts.organizationId },
    select: {
      id: true,
      number: true,
      status: true,
      requestedById: true,
      responsibleId: true,
      legacyTaskId: true,
      externalOrganizationId: true,
      externalOrganization: { select: { name: true, tradeName: true } },
      lines: { select: { id: true, quantity: true, designation: true } },
      sharedWithSupplier: true,
    },
  });
  if (!order) throw new Error("Commande introuvable");
  if (["ANNULEE", "CLOTUREE", "BROUILLON"].includes(order.status)) {
    throw new Error("Cette commande ne peut pas être réceptionnée");
  }

  const current = await getPurchaseOrderReceivingState(order.id);
  if (!current) throw new Error("État réception introuvable");

  const lineMap = new Map(order.lines.map((l) => [l.id, l]));
  const stateMap = new Map(current.lines.map((l) => [l.orderLineId, l]));

  const normalized: ReceiptLineInput[] = [];
  for (const raw of opts.lines) {
    const line = lineMap.get(raw.orderLineId);
    if (!line) throw new Error("Ligne de commande invalide");
    const receivedQty = n(raw.receivedQty);
    const damagedQty = n(raw.damagedQty);
    const refusedQty = n(raw.refusedQty);
    if (receivedQty < 0 || damagedQty < 0 || refusedQty < 0) {
      throw new Error("Quantités invalides");
    }
    if (receivedQty === 0 && damagedQty === 0 && refusedQty === 0) continue;
    if (damagedQty + refusedQty > receivedQty) {
      throw new Error(
        `Endommagé/refusé supérieur au reçu pour « ${line.designation} »`,
      );
    }
    const st = stateMap.get(raw.orderLineId)!;
    const conforming = conformingQty(receivedQty, damagedQty, refusedQty);
    if (conforming > st.remaining + 1e-9 && !opts.allowOverReceive) {
      throw new Error(
        `Quantité reçue supérieure à la quantité commandée restante pour « ${line.designation} » (${st.remaining} restant).`,
      );
    }
    normalized.push({
      orderLineId: raw.orderLineId,
      receivedQty,
      damagedQty,
      refusedQty,
      refuseReason: raw.refuseReason ?? null,
      comment: raw.comment ?? null,
    });
  }
  if (normalized.length === 0) throw new Error("Aucune quantité à réceptionner");

  const hasIssues = normalized.some(
    (l) => n(l.damagedQty) > 0 || n(l.refusedQty) > 0,
  );
  // Statut réception unitaire (avant cumul)
  let receiptStatus = "COMPLETE";
  const totalConformingNow = normalized.reduce(
    (s, l) => s + conformingQty(n(l.receivedQty), n(l.damagedQty), n(l.refusedQty)),
    0,
  );
  const remainingBefore = current.totalRemaining;
  if (hasIssues) receiptStatus = "WITH_ISSUES";
  else if (totalConformingNow + 1e-9 < remainingBefore) receiptStatus = "PARTIAL";

  const agenda = await prisma.agendaEvent.findFirst({
    where: {
      purchaseOrderId: order.id,
      type: "LIVRAISON",
      status: { not: "ANNULE" },
    },
    select: { id: true },
  });

  const receipt = await prisma.purchaseOrderReceipt.create({
    data: {
      organizationId: opts.organizationId,
      purchaseOrderId: order.id,
      receivedById: opts.receivedById,
      status: receiptStatus,
      deliveryNoteNumber: opts.deliveryNoteNumber?.trim() || null,
      commentShared: opts.commentShared?.trim() || null,
      commentInternal: opts.commentInternal?.trim() || null,
      agendaEventId: agenda?.id ?? null,
      lines: {
        create: normalized.map((l) => ({
          orderLineId: l.orderLineId,
          receivedQty: l.receivedQty,
          damagedQty: l.damagedQty ?? 0,
          refusedQty: l.refusedQty ?? 0,
          refuseReason: l.refuseReason ?? undefined,
          comment: l.comment ?? undefined,
        })),
      },
      ...(opts.blFileUrl
        ? {
            documents: {
              create: {
                orderId: order.id,
                kind: "BL",
                name: opts.blFileName?.trim() || opts.deliveryNoteNumber || "Bon de livraison",
                fileUrl: opts.blFileUrl,
              },
            },
          }
        : {}),
    },
    include: { lines: true, documents: true },
  });

  // GED-V2A — même fichier BL visible chantier / Documents (pas de copie binaire)
  if (opts.blFileUrl) {
    const blDoc = receipt.documents.find((d) => d.kind === "BL");
    if (blDoc?.fileUrl) {
      try {
        const { linkPurchaseOrderBlToChantier } = await import(
          "@/lib/ged/link-po-bl-to-chantier"
        );
        await linkPurchaseOrderBlToChantier({
          orderId: order.id,
          receiptId: receipt.id,
          purchaseOrderDocumentId: blDoc.id,
          fileUrl: blDoc.fileUrl,
          fileName: blDoc.name,
          addedById: opts.receivedById,
        });
      } catch {
        /* ne bloque pas la réception */
      }
    }
  }

  const state = await deriveOrderStatusAfterReceipt(order.id);
  const supplierName =
    order.externalOrganization.tradeName || order.externalOrganization.name;

  const summary = `${state?.totalReceivedConforming ?? 0} / ${state?.totalOrdered ?? 0} reçus`;
  const remaining = state?.totalRemaining ?? 0;

  await prisma.purchaseOrderEvent.create({
    data: {
      orderId: order.id,
      kind: "receipt",
      label:
        receiptStatus === "COMPLETE" && state?.fullyReceived
          ? "Réception complète"
          : hasIssues
            ? "Réception avec réserve"
            : "Réception partielle",
      detail: [
        `${opts.receivedByName} — ${summary}`,
        remaining > 0 ? `${remaining} restant à livrer` : null,
        opts.deliveryNoteNumber ? `BL ${opts.deliveryNoteNumber}` : null,
        hasIssues
          ? `Anomalies : ${state?.totalDamaged ?? 0} endommagé(s), ${state?.totalRefused ?? 0} refusé(s)`
          : null,
      ]
        .filter(Boolean)
        .join(" · "),
      actorUserId: opts.receivedById,
    },
  });

  // Agenda : TERMINE si tout reçu, sinon reste CONFIRME avec description partielle
  if (agenda) {
    await prisma.agendaEvent.update({
      where: { id: agenda.id },
      data: {
        status: state?.fullyReceived ? "TERMINE" : "CONFIRME",
        description: state?.fullyReceived
          ? `Réceptionnée — ${summary} — ${opts.receivedByName}`
          : `Livraison partielle — ${summary} — ${remaining} restant à livrer (complément à confirmer).`,
      },
    });
  } else {
    await syncPurchaseOrderDeliveryEvent({
      orderId: order.id,
      actorUserId: opts.receivedById,
    });
  }

  // Message SYSTEM legacy
  if (order.legacyTaskId) {
    const task = await prisma.task.findUnique({
      where: { id: order.legacyTaskId },
      select: { clientId: true, assignedToId: true },
    });
    if (task) {
      const content = state?.fullyReceived
        ? `✓ Livraison réceptionnée\n${order.number}\n${summary}\n${opts.receivedByName}`
        : `⚠ Livraison partielle\n${order.number}\n${summary}\n${remaining} restant à livrer\n[Voir la commande](/dashboard/commandes/${order.id})`;
      await prisma.taskMessage.create({
        data: {
          taskId: order.legacyTaskId,
          senderId: opts.receivedById,
          receiverId: task.assignedToId ?? task.clientId,
          content,
          kind: "SYSTEM",
          isInternal: false,
          payloadJson: {
            purchaseOrderId: order.id,
            receiptId: receipt.id,
          },
        },
      });
    }
  }

  // Notifications internes (pas toute la direction)
  const notifyIds = new Set<string>();
  if (order.requestedById) notifyIds.add(order.requestedById);
  if (order.responsibleId && order.responsibleId !== opts.receivedById) {
    notifyIds.add(order.responsibleId);
  }
  for (const userId of notifyIds) {
    if (userId === opts.receivedById) continue;
    await createNotification({
      userId,
      type: "DELIVERY_CHECK",
      title: state?.fullyReceived
        ? `Réception complète — ${order.number}`
        : hasIssues
          ? `Réception avec anomalie — ${order.number}`
          : `Réception partielle — ${order.number}`,
      message: `${summary}${remaining > 0 ? ` · ${remaining} restant` : ""} · ${supplierName}`,
      actionUrl: `/dashboard/commandes/${order.id}`,
    });
  }

  if (order.sharedWithSupplier) {
    const suppliers = await prisma.user.findMany({
      where: {
        externalOrganizationId: order.externalOrganizationId,
        OR: [{ personType: "SUPPLIER" }, { permissionProfile: "FOURNISSEUR" }],
      },
      select: { id: true },
      take: 20,
    });
    for (const u of suppliers) {
      await createNotification({
        userId: u.id,
        type: "DELIVERY_CHECK",
        title: state?.fullyReceived
          ? `Livraison réceptionnée — ${order.number}`
          : `Livraison partielle — ${order.number}`,
        message: hasIssues
          ? `${summary} — réception avec réserve`
          : `${summary}${remaining > 0 ? ` · ${remaining} restant à livrer` : ""}`,
        actionUrl: `/dashboard/commandes/${order.id}`,
      });
    }
  }

  await safeSyncPurchaseOrderAttentionAfterMutation(order.id);

  return { receipt, state };
}

export async function cancelPurchaseOrderReceipt(opts: {
  organizationId: string;
  receiptId: string;
  actorUserId: string;
  actorName: string;
}) {
  const receipt = await prisma.purchaseOrderReceipt.findFirst({
    where: { id: opts.receiptId, organizationId: opts.organizationId },
    select: {
      id: true,
      purchaseOrderId: true,
      cancelledAt: true,
      purchaseOrder: { select: { number: true } },
    },
  });
  if (!receipt) throw new Error("Réception introuvable");
  if (receipt.cancelledAt) throw new Error("Réception déjà annulée");

  await prisma.purchaseOrderReceipt.update({
    where: { id: receipt.id },
    data: {
      cancelledAt: new Date(),
      cancelledById: opts.actorUserId,
      status: "CANCELLED",
    },
  });

  await prisma.purchaseOrderEvent.create({
    data: {
      orderId: receipt.purchaseOrderId,
      kind: "receipt_cancelled",
      label: "Réception annulée",
      detail: `${opts.actorName} a annulé une réception (correction)`,
      actorUserId: opts.actorUserId,
    },
  });

  const state = await deriveOrderStatusAfterReceipt(receipt.purchaseOrderId);

  // Remettre agenda selon nouvel état
  const agenda = await prisma.agendaEvent.findFirst({
    where: {
      purchaseOrderId: receipt.purchaseOrderId,
      type: "LIVRAISON",
      status: { not: "ANNULE" },
    },
    select: { id: true },
  });
  if (agenda) {
    await prisma.agendaEvent.update({
      where: { id: agenda.id },
      data: {
        status: state?.fullyReceived
          ? "TERMINE"
          : state && state.totalReceivedConforming > 0
            ? "CONFIRME"
            : "CONFIRME",
        description: state?.fullyReceived
          ? `Réceptionnée — ${state.totalReceivedConforming} / ${state.totalOrdered}`
          : state && state.totalRemaining > 0
            ? `Livraison partielle — ${state.totalReceivedConforming} / ${state.totalOrdered} — ${state.totalRemaining} restant`
            : undefined,
      },
    });
  }

  // Si plus aucune réception et statut était RECUE → revenir CONFIRMEE
  if (state && state.totalReceivedConforming === 0) {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: receipt.purchaseOrderId },
      select: { status: true },
    });
    if (po && (po.status === "RECUE" || po.status === "PARTIELLEMENT_RECUE")) {
      await prisma.purchaseOrder.update({
        where: { id: receipt.purchaseOrderId },
        data: { status: "CONFIRMEE" },
      });
    }
  }

  await safeSyncPurchaseOrderAttentionAfterMutation(receipt.purchaseOrderId);

  return { state };
}

export function canReceivePurchaseOrder(user: {
  personType?: string | null;
  permissionProfile?: string | null;
}): boolean {
  if (user.personType === "SUPPLIER" || user.permissionProfile === "FOURNISSEUR") {
    return false;
  }
  if (user.personType === "CLIENT_EXT" || user.permissionProfile === "CLIENT") {
    return false;
  }
  return true;
}
