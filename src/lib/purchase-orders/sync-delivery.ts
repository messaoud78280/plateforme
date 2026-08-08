/**
 * CDE-2B — Source de vérité livraison = PurchaseOrder (dates).
 * AgendaEvent LIVRAISON = représentation calendrier unique (purchaseOrderId).
 * Idempotent : N appels → 1 événement actif.
 */
import type { AgendaEventStatus, PurchaseOrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const DEFAULT_DURATION_MS = 60 * 60 * 1000;

export type DeliveryScheduleDecision = {
  action: "upsert" | "cancel" | "noop";
  startAt: Date | null;
  endAt: Date | null;
  agendaStatus: AgendaEventStatus;
  visualLabel: "A_CONFIRMER" | "CONFIRMEE" | "PROPOSITION" | "ANNULEE";
  descriptionExtra: string | null;
};

export function resolveDeliverySchedule(order: {
  status: PurchaseOrderStatus;
  requestedDeliveryAt: Date | null;
  confirmedDeliveryAt: Date | null;
  proposedDeliveryAt: Date | null;
  proposedDeliveryStatus: string | null;
}): DeliveryScheduleDecision {
  if (order.status === "ANNULEE" || order.status === "REFUSEE") {
    return {
      action: "cancel",
      startAt: null,
      endAt: null,
      agendaStatus: "ANNULE",
      visualLabel: "ANNULEE",
      descriptionExtra: null,
    };
  }

  const proposedPending =
    order.proposedDeliveryStatus === "PENDING" && order.proposedDeliveryAt;

  // Confirmée : agenda = date confirmée (jamais la proposition tant que non acceptée)
  if (order.confirmedDeliveryAt) {
    const startAt = order.confirmedDeliveryAt;
    return {
      action: "upsert",
      startAt,
      endAt: new Date(startAt.getTime() + DEFAULT_DURATION_MS),
      agendaStatus: "CONFIRME",
      visualLabel: proposedPending ? "PROPOSITION" : "CONFIRMEE",
      descriptionExtra: proposedPending
        ? `Proposition fournisseur en attente : ${fmtShort(order.proposedDeliveryAt)} (non appliquée à l’agenda tant que non acceptée).`
        : null,
    };
  }

  if (!order.requestedDeliveryAt) {
    return {
      action: "noop",
      startAt: null,
      endAt: null,
      agendaStatus: "PLANIFIE",
      visualLabel: "A_CONFIRMER",
      descriptionExtra: null,
    };
  }

  // Pas encore confirmée : garder la date DEMANDÉE sur l’agenda (pas la proposition)
  const startAt = order.requestedDeliveryAt;
  return {
    action: "upsert",
    startAt,
    endAt: new Date(startAt.getTime() + DEFAULT_DURATION_MS),
    agendaStatus: "PLANIFIE",
    visualLabel: proposedPending ? "PROPOSITION" : "A_CONFIRMER",
    descriptionExtra: proposedPending
      ? `Proposition fournisseur : ${fmtShort(order.proposedDeliveryAt)} — à valider (créneau affiché = demandé ${fmtShort(order.requestedDeliveryAt)}).`
      : "Livraison à confirmer par le fournisseur — créneau demandé, non garanti.",
  };
}

function fmtShort(d: Date | null | undefined) {
  if (!d) return "—";
  return d.toLocaleString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function postSystemTaskMessage(opts: {
  taskId: string;
  actorUserId: string;
  content: string;
  payload?: Record<string, unknown>;
}) {
  const task = await prisma.task.findUnique({
    where: { id: opts.taskId },
    select: { clientId: true, assignedToId: true },
  });
  if (!task) return;
  await prisma.taskMessage.create({
    data: {
      taskId: opts.taskId,
      senderId: opts.actorUserId,
      receiverId: task.assignedToId ?? task.clientId,
      content: opts.content,
      isInternal: false,
      kind: "SYSTEM",
      payloadJson: (opts.payload ?? undefined) as object | undefined,
    },
  });
}

async function ensureResponsibleAttendee(eventId: string, userId: string | null) {
  if (!userId) return;
  await prisma.agendaEventAttendee.upsert({
    where: { eventId_userId: { eventId, userId } },
    create: { eventId, userId, status: "ACCEPTE" },
    update: { status: "ACCEPTE" },
  });
}

/**
 * Synchronise l’AgendaEvent LIVRAISON unique lié à la commande.
 * Appelable après création, partage, confirmation, proposition, acceptation, annulation.
 */
export async function syncPurchaseOrderDeliveryEvent(opts: {
  orderId: string;
  actorUserId?: string | null;
  /** Poster un message SYSTEM sur legacyTask si confirmation */
  postSystemMessage?: boolean;
  systemMessage?: string | null;
}): Promise<{ eventId: string | null; action: string }> {
  const order = await prisma.purchaseOrder.findUnique({
    where: { id: opts.orderId },
    select: {
      id: true,
      number: true,
      subject: true,
      status: true,
      organizationId: true,
      projectId: true,
      followUpSheetId: true,
      legacyTaskId: true,
      requestedById: true,
      responsibleId: true,
      requestedDeliveryAt: true,
      confirmedDeliveryAt: true,
      proposedDeliveryAt: true,
      proposedDeliveryStatus: true,
      deliveryAddress: true,
      externalOrganization: { select: { name: true, tradeName: true } },
      project: { select: { title: true, siteAddress: true, siteCity: true } },
      lines: {
        take: 3,
        orderBy: { sortOrder: "asc" },
        select: { designation: true, quantity: true, unit: true },
      },
      organization: { select: { ownerUserId: true } },
    },
  });
  if (!order) return { eventId: null, action: "missing" };

  const schedule = resolveDeliverySchedule(order);
  const supplierName =
    order.externalOrganization.tradeName || order.externalOrganization.name;

  // Événement actif lié à la commande
  let existing = await prisma.agendaEvent.findFirst({
    where: {
      purchaseOrderId: order.id,
      type: "LIVRAISON",
      status: { not: "ANNULE" },
    },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  // Compat démo : récupérer l’événement legacy (task) sans purchaseOrderId
  if (!existing && order.legacyTaskId) {
    existing = await prisma.agendaEvent.findFirst({
      where: {
        type: "LIVRAISON",
        status: { not: "ANNULE" },
        OR: [
          { taskId: order.legacyTaskId },
          ...(order.followUpSheetId
            ? [{ followUpSheetId: order.followUpSheetId, title: { contains: order.number } }]
            : []),
        ],
      },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
  }

  if (schedule.action === "cancel") {
    if (existing) {
      await prisma.agendaEvent.update({
        where: { id: existing.id },
        data: {
          status: "ANNULE",
          purchaseOrderId: order.id,
          description: `Livraison annulée — commande ${order.number} (${order.status}).`,
        },
      });
    }
    // Annuler d’éventuels doublons encore actifs
    await prisma.agendaEvent.updateMany({
      where: {
        purchaseOrderId: order.id,
        type: "LIVRAISON",
        status: { not: "ANNULE" },
        ...(existing ? { id: { not: existing.id } } : {}),
      },
      data: { status: "ANNULE" },
    });
    return { eventId: existing?.id ?? null, action: "cancel" };
  }

  if (schedule.action === "noop" || !schedule.startAt || !schedule.endAt) {
    return { eventId: existing?.id ?? null, action: "noop" };
  }

  const lineSummary = order.lines
    .map((l) => `${Number(l.quantity)} ${l.unit} ${l.designation}`)
    .join(" · ");
  const location =
    order.deliveryAddress ||
    [order.project?.siteAddress, order.project?.siteCity].filter(Boolean).join(", ") ||
    order.project?.title ||
    null;

  const statusLabel =
    schedule.visualLabel === "CONFIRMEE"
      ? "Confirmée"
      : schedule.visualLabel === "PROPOSITION"
        ? schedule.agendaStatus === "CONFIRME"
          ? "Confirmée — proposition en attente"
          : "À confirmer — proposition fournisseur"
        : "À confirmer";

  const title = `Livraison ${supplierName} (${order.number})`;
  const description = [
    `${order.subject}${lineSummary ? ` — ${lineSummary}` : ""}`,
    `Statut : ${statusLabel}`,
    order.requestedDeliveryAt
      ? `Demandée : ${fmtShort(order.requestedDeliveryAt)}`
      : null,
    order.confirmedDeliveryAt
      ? `Confirmée : ${fmtShort(order.confirmedDeliveryAt)}`
      : null,
    schedule.descriptionExtra,
    `Commande : /dashboard/commandes/${order.id}`,
  ]
    .filter(Boolean)
    .join("\n");

  const ownerUserId =
    order.organization.ownerUserId || order.requestedById;
  const actorId = opts.actorUserId || order.requestedById;

  let eventId: string;
  if (existing) {
    await prisma.agendaEvent.update({
      where: { id: existing.id },
      data: {
        title,
        description,
        location: location ?? undefined,
        type: "LIVRAISON",
        status: schedule.agendaStatus,
        startAt: schedule.startAt,
        endAt: schedule.endAt,
        organizationId: order.organizationId,
        projectId: order.projectId ?? undefined,
        followUpSheetId: order.followUpSheetId ?? undefined,
        taskId: order.legacyTaskId ?? undefined,
        purchaseOrderId: order.id,
        responsibleId: order.responsibleId ?? undefined,
        colorKey: schedule.agendaStatus === "CONFIRME" ? "livraison" : "watch",
      },
    });
    eventId = existing.id;
  } else {
    const created = await prisma.agendaEvent.create({
      data: {
        title,
        description,
        location: location ?? undefined,
        type: "LIVRAISON",
        status: schedule.agendaStatus,
        startAt: schedule.startAt,
        endAt: schedule.endAt,
        organizationId: order.organizationId,
        ownerUserId,
        createdById: actorId,
        projectId: order.projectId ?? undefined,
        followUpSheetId: order.followUpSheetId ?? undefined,
        taskId: order.legacyTaskId ?? undefined,
        purchaseOrderId: order.id,
        responsibleId: order.responsibleId ?? undefined,
        colorKey: schedule.agendaStatus === "CONFIRME" ? "livraison" : "watch",
      },
      select: { id: true },
    });
    eventId = created.id;
  }

  // Dédupliquer : tout autre LIVRAISON actif pour cette PO → ANNULE
  await prisma.agendaEvent.updateMany({
    where: {
      purchaseOrderId: order.id,
      type: "LIVRAISON",
      status: { not: "ANNULE" },
      id: { not: eventId },
    },
    data: {
      status: "ANNULE",
      description: `Doublon annulé — une seule livraison ${order.number}.`,
    },
  });

  await ensureResponsibleAttendee(eventId, order.responsibleId);

  if (opts.postSystemMessage && order.legacyTaskId && opts.systemMessage) {
    await postSystemTaskMessage({
      taskId: order.legacyTaskId,
      actorUserId: actorId,
      content: opts.systemMessage,
      payload: {
        purchaseOrderId: order.id,
        agendaEventId: eventId,
        number: order.number,
      },
    });
  }

  return { eventId, action: existing ? "update" : "create" };
}

/** Compte les événements LIVRAISON actifs pour une commande (tests / garde-fou). */
export async function countActiveDeliveryEvents(orderId: string): Promise<number> {
  return prisma.agendaEvent.count({
    where: {
      purchaseOrderId: orderId,
      type: "LIVRAISON",
      status: { not: "ANNULE" },
    },
  });
}
