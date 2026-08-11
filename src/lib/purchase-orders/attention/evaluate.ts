/**
 * CDE-3B1 — Moteur d’attention commandes (pur, sans I/O, sans notification).
 *
 * Source quantités reçues (retenue) :
 *   PurchaseOrderReceiptLine sur réceptions actives (cancelledAt = null)
 *   qty conforme = received − damaged − refused
 *   ≠ PurchaseOrderLine.receivedQty (cache UI uniquement — peut diverger hors transaction globale)
 */
import type { UrgencyLevel } from "@/lib/follow-up/types";
import { maxUrgency, urgencyRank } from "@/lib/follow-up/urgency";
import {
  calendarDaysBetween,
  hoursBetween,
  toDate,
} from "@/lib/follow-up/attention/dates";
import {
  DEFAULT_PURCHASE_ORDER_ATTENTION_POLICY,
  type PurchaseOrderAttentionPolicy,
} from "@/lib/purchase-orders/attention/policy";
import type {
  EvaluatePurchaseOrderAttentionContext,
  PurchaseOrderAttentionCode,
  PurchaseOrderAttentionInput,
  PurchaseOrderAttentionItem,
  PurchaseOrderAttentionResult,
  PurchaseOrderReceivingSnapshot,
} from "@/lib/purchase-orders/attention/types";

/** Aligné sur receiving.ts — évite d’importer le module I/O. */
function conformingQty(received: number, damaged: number, refused: number): number {
  return Math.max(0, received - damaged - refused);
}

const TERMINAL = new Set(["ANNULEE", "CLOTUREE", "BROUILLON"]);
const AWAITING_SUPPLIER = new Set(["ENVOYEE_FOURNISSEUR", "A_CONFIRMER"]);

function n(v: unknown): number {
  const x = typeof v === "number" ? v : Number(v);
  return Number.isFinite(x) ? x : 0;
}

function supplierLabel(order: PurchaseOrderAttentionInput): string {
  return (order.supplierName || "Le fournisseur").trim() || "Le fournisseur";
}

function formatWhenFr(d: Date): string {
  return d.toLocaleString("fr-FR", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  });
}

function formatDaysSince(hours: number): string {
  if (hours < 36) {
    const h = Math.max(1, Math.round(hours));
    return `${h} h`;
  }
  const days = Math.max(1, Math.round(hours / 24));
  return days === 1 ? "1 jour" : `${days} jours`;
}

export function purchaseOrderAttentionActionLabel(
  code: PurchaseOrderAttentionCode | string,
  supplierName?: string | null,
): string {
  const name = (supplierName || "le fournisseur").trim();
  switch (code) {
    case "SUPPLIER_NO_RESPONSE":
      return `Relancer ${name}`;
    case "SUPPLIER_PROPOSAL_PENDING":
      return "Examiner la proposition";
    case "SUPPLIER_REFUSED":
      return `Replanifier / Contacter ${name}`;
    case "ORDER_NOT_SENT":
      return "Envoyer au fournisseur";
    case "DELIVERY_UNCONFIRMED":
      return `Obtenir confirmation ${name}`;
    case "DELIVERY_OVERDUE":
      return "Réceptionner / Contacter fournisseur";
    case "PARTIAL_RECEIPT_PENDING":
      return "Compléter la réception";
    case "RECEIPT_ISSUE":
      return "Traiter l’anomalie";
    case "DELIVERY_NOTE_MISSING":
      return "Ajouter le BL";
    default:
      return "Obtenir confirmation";
  }
}

/** État réception depuis les lignes de réception actives (pas le cache ligne). */
export function computeReceivingSnapshot(
  order: PurchaseOrderAttentionInput,
): PurchaseOrderReceivingSnapshot {
  const activeReceipts = order.receipts.filter((r) => !toDate(r.cancelledAt));
  const activeIds = new Set(activeReceipts.map((r) => r.id));
  const lines = order.lines.map((l) => {
    let received = 0;
    let damaged = 0;
    let refused = 0;
    for (const rl of order.receiptLines) {
      if (!activeIds.has(rl.receiptId) || rl.orderLineId !== l.id) continue;
      received += n(rl.receivedQty);
      damaged += n(rl.damagedQty);
      refused += n(rl.refusedQty);
    }
    const conforming = conformingQty(received, damaged, refused);
    const ordered = n(l.quantity);
    return {
      designation: l.designation,
      unit: l.unit,
      ordered,
      remaining: Math.max(0, ordered - conforming),
      damaged,
      refused,
      conforming,
    };
  });

  const totalOrdered = lines.reduce((s, l) => s + l.ordered, 0);
  const totalReceivedConforming = lines.reduce((s, l) => s + l.conforming, 0);
  const totalDamaged = lines.reduce((s, l) => s + l.damaged, 0);
  const totalRefused = lines.reduce((s, l) => s + l.refused, 0);
  const totalRemaining = lines.reduce((s, l) => s + l.remaining, 0);
  const hasIssues = totalDamaged > 0 || totalRefused > 0;
  const fullyReceived = lines.length > 0 && totalRemaining === 0 && totalOrdered > 0;
  const partiallyReceived = totalReceivedConforming > 0 && !fullyReceived;

  let lastActiveReceiptAt: Date | null = null;
  for (const r of activeReceipts) {
    const at = toDate(r.receivedAt);
    if (!at) continue;
    if (!lastActiveReceiptAt || at.getTime() > lastActiveReceiptAt.getTime()) {
      lastActiveReceiptAt = at;
    }
  }

  return {
    totalOrdered,
    totalReceivedConforming,
    totalDamaged,
    totalRefused,
    totalRemaining,
    fullyReceived,
    partiallyReceived,
    hasIssues,
    lastActiveReceiptAt,
    activeReceiptCount: activeReceipts.length,
    lineSummaries: lines.map((l) => ({
      designation: l.designation,
      unit: l.unit,
      ordered: l.ordered,
      remaining: l.remaining,
      damaged: l.damaged,
      refused: l.refused,
    })),
  };
}

function pickPrimary(items: PurchaseOrderAttentionItem[]): PurchaseOrderAttentionItem | null {
  if (items.length === 0) return null;
  return items.slice().sort((a, b) => urgencyRank(b.level) - urgencyRank(a.level))[0] ?? null;
}

function withAction(
  item: PurchaseOrderAttentionItem,
  order: PurchaseOrderAttentionInput,
): PurchaseOrderAttentionItem {
  return {
    ...item,
    actionLabel: purchaseOrderAttentionActionLabel(item.code, order.supplierName),
  };
}

function ruleSupplierRefused(
  order: PurchaseOrderAttentionInput,
): PurchaseOrderAttentionItem | null {
  const refusedStatus = order.status === "REFUSEE";
  const motif = order.supplierRefuseReason?.trim();
  if (!refusedStatus && !motif) return null;
  if (!refusedStatus && order.confirmedDeliveryAt) return null;

  const name = supplierLabel(order);
  return withAction(
    {
      code: "SUPPLIER_REFUSED",
      level: "URGENT",
      reason: motif
        ? `${name} a refusé la livraison demandée. Motif : ${motif}.`
        : `${name} a refusé la livraison demandée.`,
      relatedEntity: { type: "purchase_order", id: order.id, label: order.number },
    },
    order,
  );
}

function ruleSupplierNoResponse(
  order: PurchaseOrderAttentionInput,
  now: Date,
  policy: PurchaseOrderAttentionPolicy,
): PurchaseOrderAttentionItem | null {
  if (!order.sharedWithSupplier) return null;
  if (!AWAITING_SUPPLIER.has(String(order.status))) return null;
  if (order.confirmedDeliveryAt) return null;
  if (order.status === "REFUSEE" || order.supplierRefuseReason?.trim()) return null;

  const proposed = (order.proposedDeliveryStatus || "NONE").toUpperCase();
  if (proposed === "PENDING" || proposed === "ACCEPTED" || proposed === "REFUSED") {
    return null;
  }

  const sharedAt = toDate(order.sharedWithSupplierAt);
  if (!sharedAt) return null;

  const hours = hoursBetween(sharedAt, now);
  if (hours < policy.supplierResponseHours) return null;

  const name = supplierLabel(order);
  return withAction(
    {
      code: "SUPPLIER_NO_RESPONSE",
      level: hours >= policy.supplierResponseHours * 2 ? "URGENT" : "IMPORTANT",
      reason: `${name} n’a pas répondu à la demande de confirmation.`,
      overdueByHours: hours - policy.supplierResponseHours,
      relatedEntity: { type: "purchase_order", id: order.id, label: order.number },
    },
    order,
  );
}

function ruleSupplierProposalPending(
  order: PurchaseOrderAttentionInput,
  now: Date,
  policy: PurchaseOrderAttentionPolicy,
): PurchaseOrderAttentionItem | null {
  if (TERMINAL.has(String(order.status)) || order.status === "REFUSEE") return null;
  const proposed = (order.proposedDeliveryStatus || "NONE").toUpperCase();
  if (proposed !== "PENDING") return null;

  const proposedAt = toDate(order.proposedDeliveryAt) ?? toDate(order.sharedWithSupplierAt);
  const hours = proposedAt ? hoursBetween(proposedAt, now) : 0;
  const name = supplierLabel(order);
  const when = toDate(order.proposedDeliveryAt);

  return withAction(
    {
      code: "SUPPLIER_PROPOSAL_PENDING",
      level: hours >= policy.proposalPendingUrgentHours ? "URGENT" : "IMPORTANT",
      reason: when
        ? `${name} a proposé un créneau (${formatWhenFr(when)}) — réponse ABC en attente.`
        : `${name} a proposé un créneau — réponse ABC en attente.`,
      dueAt: when,
      overdueByHours: Math.max(0, hours - policy.proposalPendingUrgentHours),
      relatedEntity: { type: "purchase_order", id: order.id, label: order.number },
    },
    order,
  );
}

function ruleOrderNotSent(
  order: PurchaseOrderAttentionInput,
  now: Date,
  policy: PurchaseOrderAttentionPolicy,
): PurchaseOrderAttentionItem | null {
  if (order.sharedWithSupplier) return null;
  if (TERMINAL.has(String(order.status)) || order.status === "REFUSEE") return null;
  if (order.status === "BROUILLON") return null;
  if (["RECUE", "PARTIELLEMENT_RECUE", "CLOTUREE"].includes(String(order.status))) {
    return null;
  }

  const requested = toDate(order.requestedDeliveryAt);
  if (!requested) return null;
  const hoursUntil = hoursBetween(now, requested);
  if (hoursUntil > policy.orderNotSentWarningHours) return null;

  const name = supplierLabel(order);
  return withAction(
    {
      code: "ORDER_NOT_SENT",
      level: hoursUntil < 0 || hoursUntil <= 24 ? "CRITIQUE" : "URGENT",
      reason: `Commande non envoyée à ${name} — livraison demandée ${formatWhenFr(requested)}.`,
      dueAt: requested,
      relatedEntity: { type: "purchase_order", id: order.id, label: order.number },
    },
    order,
  );
}

function ruleDeliveryUnconfirmed(
  order: PurchaseOrderAttentionInput,
  now: Date,
  policy: PurchaseOrderAttentionPolicy,
): PurchaseOrderAttentionItem | null {
  if (TERMINAL.has(String(order.status)) || order.status === "REFUSEE") return null;
  if (order.status === "RECUE") return null;
  if (order.confirmedDeliveryAt) return null;
  const requested = toDate(order.requestedDeliveryAt);
  if (!requested) return null;
  const proposed = (order.proposedDeliveryStatus || "NONE").toUpperCase();
  if (proposed === "PENDING") return null;

  const hoursUntil = hoursBetween(now, requested);
  const dayDiff = calendarDaysBetween(now, requested);
  const name = supplierLabel(order);
  const when = formatWhenFr(requested);

  if (hoursUntil < 0 || dayDiff === 0) {
    return withAction(
      {
        code: "DELIVERY_UNCONFIRMED",
        level: "CRITIQUE",
        reason:
          dayDiff === 0 && hoursUntil >= 0
            ? `Livraison demandée aujourd’hui — toujours à confirmer par ${name}.`
            : `Livraison demandée ${when} — toujours non confirmée par ${name}.`,
        dueAt: requested,
        overdueByHours: hoursUntil < 0 ? -hoursUntil : 0,
        relatedEntity: { type: "purchase_order", id: order.id, label: order.number },
      },
      order,
    );
  }

  if (hoursUntil <= policy.unconfirmedDeliveryUrgentHours || dayDiff === 1) {
    return withAction(
      {
        code: "DELIVERY_UNCONFIRMED",
        level: "URGENT",
        reason:
          dayDiff === 1
            ? `Livraison demain — toujours à confirmer par ${name}.`
            : `Livraison demandée ${when} — toujours à confirmer par ${name}.`,
        dueAt: requested,
        relatedEntity: { type: "purchase_order", id: order.id, label: order.number },
      },
      order,
    );
  }

  if (hoursUntil <= policy.unconfirmedDeliveryImportantHours) {
    return withAction(
      {
        code: "DELIVERY_UNCONFIRMED",
        level: "IMPORTANT",
        reason: `Livraison demandée ${when} — toujours à confirmer par ${name}.`,
        dueAt: requested,
        relatedEntity: { type: "purchase_order", id: order.id, label: order.number },
      },
      order,
    );
  }

  return null;
}

/** Livraison confirmée dépassée sans réception (ou sans qty conforme). */
function ruleDeliveryOverdue(
  order: PurchaseOrderAttentionInput,
  snap: PurchaseOrderReceivingSnapshot,
  now: Date,
  policy: PurchaseOrderAttentionPolicy,
): PurchaseOrderAttentionItem | null {
  if (TERMINAL.has(String(order.status)) || order.status === "REFUSEE") return null;
  if (snap.fullyReceived || order.status === "RECUE") return null;
  // Réception partielle → règle PARTIAL, pas « non livrée »
  if (snap.activeReceiptCount > 0) return null;

  const confirmed = toDate(order.confirmedDeliveryAt);
  if (!confirmed) return null;

  const hoursAfter = hoursBetween(confirmed, now);
  if (hoursAfter < policy.deliveryGraceHours) return null;

  const name = supplierLabel(order);
  const when = formatWhenFr(confirmed);
  let level: UrgencyLevel = "IMPORTANT";
  if (hoursAfter >= policy.deliveryOverdueCriticalHours) level = "CRITIQUE";
  else if (hoursAfter >= policy.deliveryOverdueUrgentHours) level = "URGENT";

  return withAction(
    {
      code: "DELIVERY_OVERDUE",
      level,
      reason: `Livraison ${name} prévue à ${when} — aucune quantité reçue.`,
      dueAt: confirmed,
      overdueByHours: hoursAfter,
      relatedEntity: order.agendaEventId
        ? { type: "agenda", id: order.agendaEventId, label: order.number }
        : { type: "purchase_order", id: order.id, label: order.number },
    },
    order,
  );
}

function rulePartialPending(
  order: PurchaseOrderAttentionInput,
  snap: PurchaseOrderReceivingSnapshot,
  now: Date,
  policy: PurchaseOrderAttentionPolicy,
): PurchaseOrderAttentionItem | null {
  if (TERMINAL.has(String(order.status)) || order.status === "REFUSEE") return null;
  if (snap.fullyReceived || order.status === "RECUE") return null;
  if (!snap.partiallyReceived || snap.totalRemaining <= 0) return null;
  if (!snap.lastActiveReceiptAt) return null;

  const hoursSince = hoursBetween(snap.lastActiveReceiptAt, now);
  if (hoursSince < policy.partialReceiptImportantHours) return null;

  let level: UrgencyLevel = "IMPORTANT";
  if (hoursSince >= policy.partialReceiptUrgentHours) level = "URGENT";

  const received = Math.round(snap.totalReceivedConforming);
  const ordered = Math.round(snap.totalOrdered);
  const remaining = Math.round(snap.totalRemaining);

  return withAction(
    {
      code: "PARTIAL_RECEIPT_PENDING",
      level,
      reason: `${received} / ${ordered} reçus — ${remaining} restent à livrer depuis ${formatDaysSince(hoursSince)}.`,
      overdueByHours: hoursSince - policy.partialReceiptImportantHours,
      relatedEntity: { type: "purchase_order", id: order.id, label: order.number },
    },
    order,
  );
}

function ruleReceiptIssue(
  order: PurchaseOrderAttentionInput,
  snap: PurchaseOrderReceivingSnapshot,
  policy: PurchaseOrderAttentionPolicy,
): PurchaseOrderAttentionItem | null {
  if (!snap.hasIssues) return null;
  if (order.status === "ANNULEE" || order.status === "CLOTUREE") return null;

  const issueQty = snap.totalDamaged + snap.totalRefused;
  const ratio =
    snap.totalOrdered > 0 ? issueQty / snap.totalOrdered : issueQty > 0 ? 1 : 0;
  const allBad =
    snap.totalReceivedConforming === 0 && issueQty > 0 && snap.activeReceiptCount > 0;

  let level: UrgencyLevel = "URGENT";
  if (allBad || ratio >= Math.max(policy.receiptIssueUrgentRatio, 0.5)) level = "CRITIQUE";

  const parts: string[] = [];
  if (snap.totalDamaged > 0) {
    parts.push(
      `${snap.totalDamaged} ${snap.totalDamaged > 1 ? "unités endommagées" : "unité endommagée"}`,
    );
  }
  if (snap.totalRefused > 0) {
    parts.push(
      `${snap.totalRefused} ${snap.totalRefused > 1 ? "unités refusées" : "unité refusée"}`,
    );
  }

  return withAction(
    {
      code: "RECEIPT_ISSUE",
      level,
      reason: `${parts.join(" et ")} à la réception.`,
      relatedEntity: { type: "purchase_order", id: order.id, label: order.number },
    },
    order,
  );
}

function ruleDeliveryNoteMissing(
  order: PurchaseOrderAttentionInput,
  now: Date,
  policy: PurchaseOrderAttentionPolicy,
): PurchaseOrderAttentionItem | null {
  if (!policy.deliveryNoteMissingEnabled) return null;
  if (TERMINAL.has(String(order.status)) && order.status !== "RECUE") return null;

  const active = order.receipts.filter((r) => !toDate(r.cancelledAt));
  if (active.length === 0) return null;

  const missing = active
    .filter((r) => !r.deliveryNoteNumber?.trim() && !r.hasBlDocument)
    .map((r) => ({ r, at: toDate(r.receivedAt) }))
    .filter((x): x is { r: (typeof active)[0]; at: Date } => Boolean(x.at))
    .sort((a, b) => a.at.getTime() - b.at.getTime());

  if (missing.length === 0) return null;
  const oldest = missing[0]!;
  const hours = hoursBetween(oldest.at, now);
  if (hours < policy.deliveryNoteImportantHours) {
    // Grâce courte : WATCH après ~12 h si déjà > 12 h
    if (hours >= 12) {
      return withAction(
        {
          code: "DELIVERY_NOTE_MISSING",
          level: "A_SURVEILLER",
          reason: `Réception enregistrée — bon de livraison manquant.`,
          overdueByHours: hours,
          relatedEntity: { type: "purchase_order", id: order.id, label: order.number },
        },
        order,
      );
    }
    return null;
  }

  let level: UrgencyLevel = "IMPORTANT";
  if (hours >= policy.deliveryNoteUrgentHours) level = "URGENT";

  return withAction(
    {
      code: "DELIVERY_NOTE_MISSING",
      level,
      reason: `Réception enregistrée depuis ${formatDaysSince(hours)} — bon de livraison manquant.`,
      overdueByHours: hours - policy.deliveryNoteImportantHours,
      relatedEntity: { type: "purchase_order", id: order.id, label: order.number },
    },
    order,
  );
}

/**
 * Analyse une commande + contexte → situations d’attention.
 * Déterministe, sans I/O, sans mutation, sans notification.
 */
export function evaluatePurchaseOrderAttention(
  order: PurchaseOrderAttentionInput,
  context: EvaluatePurchaseOrderAttentionContext = {},
): PurchaseOrderAttentionResult {
  const now = context.now ?? new Date();
  const policy = context.policy ?? DEFAULT_PURCHASE_ORDER_ATTENTION_POLICY;
  const items: PurchaseOrderAttentionItem[] = [];

  if (TERMINAL.has(String(order.status))) {
    return {
      effectiveUrgency: "NORMAL",
      computedUrgency: "NORMAL",
      manualUrgency: null,
      primaryReason: null,
      attentionItems: [],
    };
  }

  const snap = computeReceivingSnapshot(order);

  const refused = ruleSupplierRefused(order);
  if (refused) items.push(refused);

  const proposal = ruleSupplierProposalPending(order, now, policy);
  if (proposal) items.push(proposal);

  const noResponse = ruleSupplierNoResponse(order, now, policy);
  if (noResponse) items.push(noResponse);

  const notSent = ruleOrderNotSent(order, now, policy);
  if (notSent) items.push(notSent);

  // Livraison entièrement reçue → plus d’alertes livraison / partiel / non confirmée
  if (!snap.fullyReceived && order.status !== "RECUE") {
    const unconfirmed = ruleDeliveryUnconfirmed(order, now, policy);
    if (unconfirmed) items.push(unconfirmed);

    const overdue = ruleDeliveryOverdue(order, snap, now, policy);
    if (overdue) items.push(overdue);

    const partial = rulePartialPending(order, snap, now, policy);
    if (partial) items.push(partial);
  }

  const issue = ruleReceiptIssue(order, snap, policy);
  if (issue) items.push(issue);

  const bl = ruleDeliveryNoteMissing(order, now, policy);
  if (bl) items.push(bl);

  const computedUrgency = items.reduce<UrgencyLevel>(
    (acc, it) => maxUrgency(acc, it.level),
    "NORMAL",
  );
  const primary = pickPrimary(items);

  return {
    effectiveUrgency: computedUrgency,
    computedUrgency,
    manualUrgency: null,
    primaryReason: primary?.reason ?? null,
    attentionItems: items.sort((a, b) => urgencyRank(b.level) - urgencyRank(a.level)),
  };
}

/** Responsable d’action pour la carte À traiter / CDE-3B2. */
export function resolvePurchaseOrderAttentionResponsible(order: {
  responsibleId?: string | null;
  responsibleName?: string | null;
  requestedById?: string | null;
  requestedByName?: string | null;
}): { id: string | null; name: string | null } {
  if (order.responsibleId) {
    return { id: order.responsibleId, name: order.responsibleName ?? null };
  }
  if (order.requestedById) {
    return { id: order.requestedById, name: order.requestedByName ?? null };
  }
  return { id: null, name: null };
}
