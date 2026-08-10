/**
 * CHANTIER-V2A — Synthèse opérationnelle d’un chantier (loaders légers).
 * Réutilise evaluate* existants — pas de second moteur.
 */
import { TaskStatus, type PurchaseOrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  buildAttentionCard,
  buildPurchaseOrderAttentionCard,
  sortAttentionCards,
  type ATraiterAttentionCard,
} from "@/lib/a-traiter/attention-board";
import { loadAttentionForSheets } from "@/lib/follow-up/attention/batch";
import { serializeAttentionResult } from "@/lib/follow-up/attention/evaluate";
import {
  computeReceivingSnapshot,
  evaluatePurchaseOrderAttention,
  resolvePurchaseOrderAttentionResponsible,
} from "@/lib/purchase-orders/attention/evaluate";
import type { PurchaseOrderAttentionInput } from "@/lib/purchase-orders/attention/types";
import { PURCHASE_ORDER_STATUS_LABELS } from "@/lib/purchase-orders/status";
import {
  projectClientHref,
  projectSupplierHref,
  projectTeamHref,
} from "@/lib/messagerie/resolve-conversation";
import { CHANTIER_STATUS_LABELS } from "@/lib/chantier-dossier/constants";
import { isSharedVisibility } from "@/lib/equipe-acces/project-access";

const OPEN_TASK = { not: TaskStatus.COMPLETE };

const PO_ACTIVE: PurchaseOrderStatus[] = [
  "A_VALIDER",
  "VALIDEE",
  "ENVOYEE_FOURNISSEUR",
  "A_CONFIRMER",
  "CONFIRMEE",
  "LIVRAISON_PROGRAMMEE",
  "PARTIELLEMENT_RECUE",
  "REFUSEE",
  "RECUE",
];

export type ChantierOpsAttentionItem = {
  id: string;
  subjectType: "FOLLOW_UP" | "PURCHASE_ORDER";
  title: string;
  reason: string;
  urgency: string;
  href: string;
};

export type ChantierOpsAgendaItem = {
  id: string;
  title: string;
  startAt: string;
  type: string;
  status: string;
  purchaseOrderId: string | null;
};

export type ChantierOpsTeamSlot = {
  id: string;
  name: string;
  startAt: string;
  endAt: string;
  title: string;
};

export type ChantierOpsOrder = {
  id: string;
  number: string;
  supplierName: string;
  subject: string;
  status: string;
  statusLabel: string;
  deliveryAt: string | null;
  lineSummary: string | null;
  receivedLabel: string | null;
  hasAttention: boolean;
};

export type ChantierOpsTask = {
  id: string;
  title: string;
  assigneeName: string | null;
  desiredDate: string | null;
  overdue: boolean;
};

export type ChantierOpsSheet = {
  id: string;
  title: string;
  status: string;
  statusLabel: string;
};

export type ChantierOpsMessage = {
  id: string;
  channel: string;
  channelLabel: string;
  preview: string;
  senderName: string;
  createdAt: string;
};

export type ChantierOpsDocument = {
  id: string;
  name: string;
  createdAt: string;
  href: string | null;
};

export type ChantierOpsSummary = {
  projectId: string;
  counts: {
    aTraiter: number;
    deliveriesThisWeek: number;
    ordersToConfirm: number;
    openTasks: number;
  };
  attention: ChantierOpsAttentionItem[];
  agenda: ChantierOpsAgendaItem[];
  teamToday: ChantierOpsTeamSlot[];
  orders: ChantierOpsOrder[];
  tasks: ChantierOpsTask[];
  tasksMore: number;
  sheets: ChantierOpsSheet[];
  messages: ChantierOpsMessage[];
  documents: ChantierOpsDocument[];
  links: {
    aTraiter: string;
    agenda: string;
    planning: string;
    commandes: string;
    taches: string;
    fiches: string;
    documents: string;
    messagerie: string;
    team: string;
    client: string;
    suppliers: string;
    nouvelleTache: string;
    nouvelEvenement: string;
    nouveauDocument: string;
    nouvelleFiche: string;
    nouvelleCommande: string;
  };
};

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function channelLabel(ch: string) {
  if (ch === "INTERNE") return "Équipe";
  if (ch === "CLIENT") return "Client";
  if (ch === "FOURNISSEUR") return "Fournisseur";
  return ch;
}

function sheetStatusLabel(status: string) {
  const map: Record<string, string> = {
    NOUVEAU: "Nouveau",
    EN_COURS: "En cours",
    A_CONTROLER: "À contrôler",
    EN_ATTENTE: "En attente",
    BLOQUE: "Bloqué",
    TERMINE: "Terminé",
    ARCHIVE: "Archivé",
  };
  return map[status] ?? status;
}

/**
 * Charge la synthèse cockpit pour UN chantier.
 * Limites strictes — pas de collectATraiter organisation.
 */
export async function loadChantierCockpitOps(opts: {
  projectId: string;
  projectTitle: string;
  now?: Date;
  /** Vue externe : pas d’attention / commandes / tâches internes. */
  externalViewer?: boolean;
}): Promise<ChantierOpsSummary> {
  const now = opts.now ?? new Date();
  const projectId = opts.projectId;
  const day0 = startOfDay(now);
  const day1 = endOfDay(now);
  const weekEnd = endOfDay(addDays(day0, 7));

  const links = {
    aTraiter: `/dashboard/a-traiter?q=${encodeURIComponent(opts.projectTitle)}`,
    agenda: `/dashboard/agenda?projectId=${encodeURIComponent(projectId)}`,
    planning: `/dashboard/planning?projectId=${encodeURIComponent(projectId)}`,
    commandes: `/dashboard/commandes?projectId=${encodeURIComponent(projectId)}`,
    taches: `#tab-taches`,
    fiches: `/dashboard/fiches-suivi?q=${encodeURIComponent(opts.projectTitle)}`,
    documents: `#dossier-chantier`,
    messagerie: projectTeamHref(projectId),
    team: projectTeamHref(projectId),
    client: projectClientHref(projectId),
    suppliers: projectSupplierHref(projectId),
    nouvelleTache: `#tab-taches&create=1`,
    nouvelEvenement: `/dashboard/agenda?projectId=${encodeURIComponent(projectId)}&new=1`,
    nouveauDocument: `#dossier-chantier`,
    nouvelleFiche: `/dashboard/fiches-suivi/nouvelle?projectId=${encodeURIComponent(projectId)}`,
    nouvelleCommande: `/dashboard/commandes/nouvelle?projectId=${encodeURIComponent(projectId)}`,
  };

  if (opts.externalViewer) {
    const [agenda, documents] = await Promise.all([
      prisma.agendaEvent.findMany({
        where: {
          projectId,
          status: { not: "ANNULE" },
          startAt: { gte: day0 },
        },
        orderBy: { startAt: "asc" },
        take: 5,
        select: {
          id: true,
          title: true,
          startAt: true,
          type: true,
          status: true,
          purchaseOrderId: true,
        },
      }),
      prisma.chantierFile.findMany({
        where: { projectId },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: { id: true, name: true, createdAt: true, fileUrl: true, visibility: true },
      }),
    ]);

    const sharedDocs = documents
      .filter((d) => isSharedVisibility(d.visibility))
      .slice(0, 5);

    return {
      projectId,
      counts: {
        aTraiter: 0,
        deliveriesThisWeek: agenda.filter((e) => e.type === "LIVRAISON" && e.startAt <= weekEnd)
          .length,
        ordersToConfirm: 0,
        openTasks: 0,
      },
      attention: [],
      agenda: agenda.map((e) => ({
        id: e.id,
        title: e.title,
        startAt: e.startAt.toISOString(),
        type: e.type,
        status: e.status,
        purchaseOrderId: e.purchaseOrderId,
      })),
      teamToday: [],
      orders: [],
      tasks: [],
      tasksMore: 0,
      sheets: [],
      messages: [],
      documents: sharedDocs.map((d) => ({
        id: d.id,
        name: d.name,
        createdAt: d.createdAt.toISOString(),
        href: d.fileUrl,
      })),
      links,
    };
  }

  const [
    projectOrg,
    sheetsRaw,
    ordersRaw,
    agenda,
    teamEvents,
    openTasksCount,
    deliveriesWeek,
    ordersToConfirm,
    tasksRaw,
    messagesRaw,
    docsRaw,
    sheetsList,
  ] = await Promise.all([
    prisma.project.findUnique({
      where: { id: projectId },
      select: { organizationId: true },
    }),
    prisma.followUpSheet.findMany({
      where: {
        projectId,
        status: { notIn: ["TERMINE", "ARCHIVE"] },
      },
      take: 25,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        status: true,
        organizationId: true,
        nextAction: true,
        nextActionAt: true,
        nextActionDone: true,
        urgencyOverride: true,
        osNumber: true,
        orderNumber: true,
        workObject: true,
        clientName: true,
        assigneeId: true,
        assignee: { select: { name: true } },
      },
    }),
    prisma.purchaseOrder.findMany({
      where: { projectId, status: { in: PO_ACTIVE } },
      take: 20,
      orderBy: { updatedAt: "desc" },
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
        lines: {
          orderBy: { sortOrder: "asc" },
          take: 3,
          select: {
            id: true,
            designation: true,
            unit: true,
            quantity: true,
            receivedQty: true,
          },
        },
        receipts: {
          select: {
            id: true,
            receivedAt: true,
            cancelledAt: true,
            status: true,
            deliveryNoteNumber: true,
            documents: { where: { kind: "BL" }, select: { id: true }, take: 1 },
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
          where: { kind: { in: ["shared", "supplier_propose", "supplier_refuse"] } },
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
    }),
    prisma.agendaEvent.findMany({
      where: {
        projectId,
        status: { not: "ANNULE" },
        startAt: { gte: day0 },
      },
      orderBy: { startAt: "asc" },
      take: 6,
      select: {
        id: true,
        title: true,
        startAt: true,
        type: true,
        status: true,
        purchaseOrderId: true,
      },
    }),
    prisma.agendaEvent.findMany({
      where: {
        projectId,
        status: { not: "ANNULE" },
        startAt: { lte: day1 },
        endAt: { gte: day0 },
        responsibleId: { not: null },
      },
      orderBy: { startAt: "asc" },
      take: 8,
      select: {
        id: true,
        title: true,
        startAt: true,
        endAt: true,
        responsible: { select: { id: true, name: true } },
      },
    }),
    prisma.task.count({
      where: { projectId, status: OPEN_TASK },
    }),
    prisma.agendaEvent.count({
      where: {
        projectId,
        type: "LIVRAISON",
        status: { not: "ANNULE" },
        startAt: { gte: day0, lte: weekEnd },
      },
    }),
    prisma.purchaseOrder.count({
      where: {
        projectId,
        status: { in: ["A_CONFIRMER", "ENVOYEE_FOURNISSEUR", "A_VALIDER"] },
      },
    }),
    prisma.task.findMany({
      where: { projectId, status: OPEN_TASK },
      orderBy: [{ desiredDate: "asc" }, { updatedAt: "desc" }],
      take: 8,
      select: {
        id: true,
        title: true,
        desiredDate: true,
        assignedTo: { select: { name: true } },
      },
    }),
    prisma.message.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: {
        id: true,
        content: true,
        channel: true,
        createdAt: true,
        sender: { select: { name: true } },
      },
    }),
    prisma.chantierFile.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, createdAt: true, fileUrl: true },
    }),
    prisma.followUpSheet.findMany({
      where: {
        projectId,
        status: { notIn: ["TERMINE", "ARCHIVE"] },
      },
      orderBy: { updatedAt: "desc" },
      take: 4,
      select: { id: true, title: true, status: true },
    }),
  ]);

  const organizationId =
    projectOrg?.organizationId ??
    sheetsRaw.find((s) => s.organizationId)?.organizationId ??
    null;

  const attentionBatch = await loadAttentionForSheets({
    sheets: sheetsRaw.map((s) => ({
      id: s.id,
      status: s.status,
      title: s.title,
      nextActionAt: s.nextActionAt?.toISOString() ?? null,
      nextActionDone: s.nextActionDone,
      urgencyOverride: s.urgencyOverride,
    })),
    organizationId,
    now,
  });

  const cards: ATraiterAttentionCard[] = [];
  for (const s of sheetsRaw) {
    const att = attentionBatch.byId.get(s.id);
    if (!att) continue;
    const card = buildAttentionCard({
      sheet: {
        id: s.id,
        title: s.title,
        clientName: s.clientName,
        projectTitle: opts.projectTitle,
        osNumber: s.osNumber,
        orderNumber: s.orderNumber,
        workObject: s.workObject,
        nextAction: s.nextAction,
        nextActionDone: s.nextActionDone,
        nextActionAt: s.nextActionAt?.toISOString() ?? null,
        status: s.status,
        assigneeId: s.assigneeId,
        assigneeName: s.assignee?.name ?? null,
        statusEnteredAt: attentionBatch.statusEnteredAt.get(s.id) ?? null,
        relatedTaskId: null,
      },
      attention: att,
      now,
    });
    if (card) {
      cards.push({ ...card, projectId });
    }
  }

  for (const o of ordersRaw) {
    const sharedEv = o.events.find((e) => e.kind === "shared");
    const proposeEv = o.events.find((e) => e.kind === "supplier_propose");
    const refuseEv = o.events.find((e) => e.kind === "supplier_refuse");
    const receiptLines = o.receipts.flatMap((r) =>
      r.lines.map((l) => ({
        orderLineId: l.orderLineId,
        receivedQty: Number(l.receivedQty),
        damagedQty: Number(l.damagedQty),
        refusedQty: Number(l.refusedQty),
        receiptId: r.id,
      })),
    );
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
      projectTitle: opts.projectTitle,
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
      evaluatePurchaseOrderAttention(input, { now }),
    );
    const resp = resolvePurchaseOrderAttentionResponsible(input);
    const card = buildPurchaseOrderAttentionCard({
      order: {
        id: o.id,
        number: o.number,
        subject: o.subject,
        supplierName: input.supplierName,
        projectId,
        projectTitle: opts.projectTitle,
        status: o.status,
        responsibleId: resp.id,
        responsibleName: resp.name,
        lineDesignations: o.lines.map((l) => l.designation),
        agendaEventId: input.agendaEventId,
        confirmedDeliveryAt: o.confirmedDeliveryAt?.toISOString() ?? null,
        requestedDeliveryAt: o.requestedDeliveryAt?.toISOString() ?? null,
        sharedWithSupplier: o.sharedWithSupplier,
      },
      attention,
      now,
    });
    if (card) cards.push(card);
  }

  const sorted = [...cards].sort(sortAttentionCards).slice(0, 5);
  const attentionIds = new Set(
    sorted.filter((c) => c.subjectType === "PURCHASE_ORDER").map((c) => c.subjectId),
  );

  // Prioriser commandes : attention → partielle → prochaine livraison → récent
  const scored = ordersRaw.map((o) => {
    const delivery = o.confirmedDeliveryAt ?? o.requestedDeliveryAt;
    let score = 0;
    if (attentionIds.has(o.id)) score += 100;
    if (o.status === "PARTIELLEMENT_RECUE") score += 40;
    if (o.status === "A_CONFIRMER" || o.status === "REFUSEE") score += 50;
    if (delivery && delivery >= day0 && delivery <= weekEnd) score += 30;
    return { o, score };
  });
  scored.sort((a, b) => b.score - a.score);

  const orders: ChantierOpsOrder[] = scored.slice(0, 3).map(({ o }) => {
    const supplierName =
      o.externalOrganization.tradeName || o.externalOrganization.name;
    const delivery = o.confirmedDeliveryAt ?? o.requestedDeliveryAt;
    const line = o.lines[0];
    const snapLines = o.lines.map((l) => ({
      id: l.id,
      designation: l.designation,
      unit: l.unit,
      quantity: Number(l.quantity),
    }));
    const receiptLines = o.receipts.flatMap((r) =>
      r.lines.map((l) => ({
        orderLineId: l.orderLineId,
        receivedQty: Number(l.receivedQty),
        damagedQty: Number(l.damagedQty),
        refusedQty: Number(l.refusedQty),
        receiptId: r.id,
      })),
    );
    const snapInput: PurchaseOrderAttentionInput = {
      id: o.id,
      number: o.number,
      status: o.status,
      subject: o.subject,
      sharedWithSupplier: o.sharedWithSupplier,
      lines: snapLines,
      receipts: o.receipts.map((r) => ({
        id: r.id,
        receivedAt: r.receivedAt,
        cancelledAt: r.cancelledAt,
        status: r.status,
        deliveryNoteNumber: r.deliveryNoteNumber,
        hasBlDocument: r.documents.length > 0,
      })),
      receiptLines,
    };
    const snap = computeReceivingSnapshot(snapInput);
    return {
      id: o.id,
      number: o.number,
      supplierName,
      subject: o.subject,
      status: o.status,
      statusLabel: PURCHASE_ORDER_STATUS_LABELS[o.status] ?? o.status,
      deliveryAt: delivery?.toISOString() ?? null,
      lineSummary: line
        ? `${Number(line.quantity)} ${line.unit} ${line.designation}`
        : null,
      receivedLabel:
        snap.totalOrdered > 0
          ? `${snap.totalReceivedConforming} / ${snap.totalOrdered} reçus`
          : null,
      hasAttention: attentionIds.has(o.id),
    };
  });

  const tasksSorted = [...tasksRaw].sort((a, b) => {
    const ad = a.desiredDate?.getTime() ?? Number.POSITIVE_INFINITY;
    const bd = b.desiredDate?.getTime() ?? Number.POSITIVE_INFINITY;
    const aOver = a.desiredDate && a.desiredDate < day0 ? 0 : 1;
    const bOver = b.desiredDate && b.desiredDate < day0 ? 0 : 1;
    if (aOver !== bOver) return aOver - bOver;
    return ad - bd;
  });

  const teamToday: ChantierOpsTeamSlot[] = [];
  const seenResp = new Set<string>();
  for (const ev of teamEvents) {
    const rid = ev.responsible?.id;
    if (!rid || seenResp.has(rid)) continue;
    seenResp.add(rid);
    teamToday.push({
      id: ev.id,
      name: ev.responsible!.name,
      startAt: ev.startAt.toISOString(),
      endAt: ev.endAt.toISOString(),
      title: ev.title,
    });
    if (teamToday.length >= 4) break;
  }

  return {
    projectId,
    counts: {
      aTraiter: sorted.length,
      deliveriesThisWeek: deliveriesWeek,
      ordersToConfirm,
      openTasks: openTasksCount,
    },
    attention: sorted.map((c) => ({
      id: `${c.subjectType}:${c.subjectId}`,
      subjectType: c.subjectType,
      title: c.title,
      reason: c.primaryReason ?? c.nextAction ?? "À traiter",
      urgency: c.effectiveUrgency,
      href: c.actionUrl,
    })),
    agenda: agenda.map((e) => ({
      id: e.id,
      title: e.title,
      startAt: e.startAt.toISOString(),
      type: e.type,
      status: e.status,
      purchaseOrderId: e.purchaseOrderId,
    })),
    teamToday,
    orders,
    tasks: tasksSorted.slice(0, 3).map((t) => ({
      id: t.id,
      title: t.title,
      assigneeName: t.assignedTo?.name ?? null,
      desiredDate: t.desiredDate?.toISOString() ?? null,
      overdue: Boolean(t.desiredDate && t.desiredDate < day0),
    })),
    tasksMore: Math.max(0, openTasksCount - Math.min(3, tasksSorted.length)),
    sheets: sheetsList.map((s) => ({
      id: s.id,
      title: s.title,
      status: s.status,
      statusLabel: sheetStatusLabel(s.status),
    })),
    messages: messagesRaw.map((m) => ({
      id: m.id,
      channel: m.channel,
      channelLabel: channelLabel(m.channel),
      preview: m.content.slice(0, 80),
      senderName: m.sender.name,
      createdAt: m.createdAt.toISOString(),
    })),
    documents: docsRaw.map((d) => ({
      id: d.id,
      name: d.name,
      createdAt: d.createdAt.toISOString(),
      href: d.fileUrl,
    })),
    links,
  };
}

export function chantierStatusDisplayLabel(status: string) {
  return CHANTIER_STATUS_LABELS[status as keyof typeof CHANTIER_STATUS_LABELS] ?? status;
}
