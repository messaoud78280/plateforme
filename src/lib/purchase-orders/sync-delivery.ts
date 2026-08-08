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

  const payload = {
    title,
    description,
    location: location ?? undefined,
    type: "LIVRAISON" as const,
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
  };

  let eventId: string;
  if (existing) {
    await prisma.agendaEvent.update({
      where: { id: existing.id },
      data: payload,
    });
    eventId = existing.id;
  } else {
    try {
      const created = await prisma.agendaEvent.create({
        data: {
          ...payload,
          ownerUserId,
          createdById: actorId,
        },
        select: { id: true },
      });
      eventId = created.id;
    } catch (e) {
      // Concurrence / index unique partiel : reprendre l’événement existant
      const raced = await prisma.agendaEvent.findFirst({
        where: {
          purchaseOrderId: order.id,
          type: "LIVRAISON",
          status: { not: "ANNULE" },
        },
        select: { id: true },
      });
      if (!raced) throw e;
      await prisma.agendaEvent.update({
        where: { id: raced.id },
        data: payload,
      });
      eventId = raced.id;
    }
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

/**
 * AGENDA-V2A.1 — Décision pure : peut-on déplacer une livraison depuis l’Agenda ?
 *
 * proposedDeliveryAt / proposedDeliveryStatus = proposition FOURNISSEUR → ABC.
 * Ne pas les réutiliser pour une contre-proposition ABC → fournisseur
 * (futur : modèle DeliveryProposal dédié).
 */
export type AgendaDeliveryRescheduleDecision =
  | {
      action: "update_requested";
      field: "requestedDeliveryAt";
    }
  | {
      action: "update_confirmed_internal";
      field: "confirmedDeliveryAt";
    }
  | {
      action: "block_supplier_confirmed";
      code: "SUPPLIER_CONFIRMED_LOCKED";
      confirmedAt: Date;
      supplierName: string;
      message: string;
    }
  | {
      action: "block_closed";
      code: "DELIVERY_CLOSED";
      message: string;
    };

export function decideAgendaDeliveryReschedule(order: {
  status: PurchaseOrderStatus | string;
  confirmedDeliveryAt: Date | null;
  sharedWithSupplier: boolean;
  supplierName?: string | null;
}): AgendaDeliveryRescheduleDecision {
  if (["ANNULEE", "REFUSEE", "CLOTUREE", "RECUE"].includes(String(order.status))) {
    return {
      action: "block_closed",
      code: "DELIVERY_CLOSED",
      message: "Cette livraison ne peut plus être déplacée",
    };
  }

  const supplier = (order.supplierName || "Le fournisseur").trim() || "Le fournisseur";

  // Confirmée + collaboration fournisseur : jamais écraser confirmedDeliveryAt unilatéralement
  if (order.confirmedDeliveryAt && order.sharedWithSupplier) {
    const when = fmtShort(order.confirmedDeliveryAt);
    return {
      action: "block_supplier_confirmed",
      code: "SUPPLIER_CONFIRMED_LOCKED",
      confirmedAt: order.confirmedDeliveryAt,
      supplierName: supplier,
      message: `Cette livraison a déjà été confirmée par ${supplier} à ${when}.\n\nPour éviter une divergence avec le fournisseur, son horaire ne peut pas être modifié directement depuis l’Agenda.\n\nGérez la modification depuis la commande (messagerie / validation fournisseur).`,
    };
  }

  // Confirmée mais sans collab fournisseur (interne) → maj confirmed
  if (order.confirmedDeliveryAt && !order.sharedWithSupplier) {
    return { action: "update_confirmed_internal", field: "confirmedDeliveryAt" };
  }

  // Non confirmée → date demandée uniquement
  return { action: "update_requested", field: "requestedDeliveryAt" };
}

/**
 * AGENDA-V2A / V2A.1 — Déplacement agenda d’une livraison liée :
 * PurchaseOrder d’abord, Agenda ensuite. Jamais Agenda seul.
 */
export async function reschedulePurchaseOrderDeliveryFromAgenda(opts: {
  orderId: string;
  newStartAt: Date;
  actorUserId: string;
  actorName?: string;
}): Promise<
  | { ok: true; eventId: string | null; field: "requestedDeliveryAt" | "confirmedDeliveryAt" }
  | {
      ok: false;
      error: string;
      code?: "SUPPLIER_CONFIRMED_LOCKED" | "DELIVERY_CLOSED";
      confirmedAt?: string;
      supplierName?: string;
      purchaseOrderId?: string;
      orderUrl?: string;
    }
> {
  const order = await prisma.purchaseOrder.findUnique({
    where: { id: opts.orderId },
    select: {
      id: true,
      number: true,
      status: true,
      sharedWithSupplier: true,
      confirmedDeliveryAt: true,
      requestedDeliveryAt: true,
      externalOrganizationId: true,
      externalOrganization: { select: { name: true, tradeName: true } },
    },
  });
  if (!order) return { ok: false, error: "Commande introuvable" };

  const supplierName =
    order.externalOrganization.tradeName || order.externalOrganization.name;
  const decision = decideAgendaDeliveryReschedule({
    status: order.status,
    confirmedDeliveryAt: order.confirmedDeliveryAt,
    sharedWithSupplier: order.sharedWithSupplier,
    supplierName,
  });

  if (decision.action === "block_closed") {
    return { ok: false, error: decision.message, code: decision.code };
  }

  if (decision.action === "block_supplier_confirmed") {
    return {
      ok: false,
      error: decision.message,
      code: decision.code,
      confirmedAt: decision.confirmedAt.toISOString(),
      supplierName: decision.supplierName,
      purchaseOrderId: order.id,
      orderUrl: `/dashboard/commandes/${order.id}`,
    };
  }

  const field = decision.field;
  await prisma.purchaseOrder.update({
    where: { id: order.id },
    data: { [field]: opts.newStartAt },
  });

  await prisma.purchaseOrderEvent.create({
    data: {
      orderId: order.id,
      kind: "delivery_reschedule",
      label:
        field === "requestedDeliveryAt"
          ? "Date demandée modifiée"
          : "Livraison reportée (interne)",
      detail: `${opts.actorName ?? "Agenda"} — ${field === "requestedDeliveryAt" ? "demandée" : "confirmée interne"} : ${fmtShort(opts.newStartAt)} (via agenda)`,
      actorUserId: opts.actorUserId,
    },
  });

  const synced = await syncPurchaseOrderDeliveryEvent({
    orderId: order.id,
    actorUserId: opts.actorUserId,
    postSystemMessage: true,
    systemMessage: `↻ ${
      field === "requestedDeliveryAt" ? "Date de livraison demandée" : "Livraison"
    } reportée — ${fmtShort(opts.newStartAt)}\n${order.number}\n[Voir la commande](/dashboard/commandes/${order.id})`,
  });

  // Informer le fournisseur si commande partagée et date demandée modifiée
  if (field === "requestedDeliveryAt" && order.sharedWithSupplier) {
    const { createNotification } = await import("@/lib/notifications");
    const users = await prisma.user.findMany({
      where: {
        externalOrganizationId: order.externalOrganizationId,
        OR: [{ personType: "SUPPLIER" }, { permissionProfile: "FOURNISSEUR" }],
      },
      select: { id: true },
      take: 20,
    });
    for (const u of users) {
      await createNotification({
        userId: u.id,
        type: "DELIVERY_CHECK",
        title: `Date demandée modifiée — ${order.number}`,
        message: `Nouveau créneau demandé : ${fmtShort(opts.newStartAt)}`,
        actionUrl: `/dashboard/commandes/${order.id}`,
      });
    }
  }

  return { ok: true, eventId: synced.eventId, field };
}
