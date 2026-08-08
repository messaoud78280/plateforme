/**
 * CDE-3B1 — Moteur d’attention commandes (pur, sans I/O, sans notification).
 * Source quantités = receipt lines actives (pas le cache receivedQty).
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

/** Aligné sur receiving.ts — évite d’importer le module I/O. */
function conformingQty(received: number, damaged: number, refused: number): number {
  return Math.max(0, received - damaged - refused);
}
import type {
  EvaluatePurchaseOrderAttentionContext,
  PurchaseOrderAttentionInput,
  PurchaseOrderAttentionItem,
  PurchaseOrderAttentionResult,
  PurchaseOrderReceivingSnapshot,
} from "@/lib/purchase-orders/attention/types";

const CLOSED = new Set(["ANNULEE", "CLOTUREE", "BROUILLON", "RECUE"]);
const AWAITING_SUPPLIER = new Set(["ENVOYEE_FOURNISSEUR", "A_CONFIRMER"]);

function n(v: unknown): number {
  const x = typeof v === "number" ? v : Number(v);
  return Number.isFinite(x) ? x : 0;
}

function supplierLabel(order: PurchaseOrderAttentionInput): string {
  return (order.supplierName || "Le fournisseur").trim() || "Le fournisseur";
}

function formatQty(q: number, unit: string, designation: string): string {
  const qty = Number.isInteger(q) ? String(q) : q.toFixed(1).replace(/\.0$/, "");
  return `${qty} ${unit} ${designation}`.trim();
}

function formatWhenFr(d: Date): string {
  return d.toLocaleString("fr-FR", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
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

function ruleSupplierRefused(
  order: PurchaseOrderAttentionInput,
): PurchaseOrderAttentionItem | null {
  if (order.status !== "REFUSEE") return null;
  const name = supplierLabel(order);
  const motif = order.supplierRefuseReason?.trim();
  return {
    code: "SUPPLIER_REFUSED",
    level: "URGENT",
    reason: motif
      ? `${name} a refusé la commande. Motif : ${motif}.`
      : `${name} a refusé la commande.`,
    relatedEntity: { type: "purchase_order", id: order.id, label: order.number },
  };
}

function ruleSupplierNoResponse(
  order: PurchaseOrderAttentionInput,
  now: Date,
  policy: PurchaseOrderAttentionPolicy,
): PurchaseOrderAttentionItem | null {
  if (!order.sharedWithSupplier) return null;
  if (!AWAITING_SUPPLIER.has(String(order.status))) return null;
  if (order.confirmedDeliveryAt) return null;
  if (order.status === "REFUSEE") return null;

  const proposed = (order.proposedDeliveryStatus || "NONE").toUpperCase();
  // Proposition ou refus de proposition = réponse fournisseur
  if (proposed === "PENDING" || proposed === "ACCEPTED" || proposed === "REFUSED") {
    return null;
  }

  const sharedAt = toDate(order.sharedWithSupplierAt);
  if (!sharedAt) {
    // Pas de timestamp fiable → pas d’alerte (évite faux positif sur updatedAt)
    return null;
  }

  const hours = hoursBetween(sharedAt, now);
  if (hours < policy.supplierResponseHours) return null;

  const name = supplierLabel(order);
  return {
    code: "SUPPLIER_NO_RESPONSE",
    level: hours >= policy.supplierResponseHours * 2 ? "URGENT" : "IMPORTANT",
    reason: `${name} n’a pas répondu à la commande depuis ${formatDaysSince(hours)}.`,
    overdueByHours: hours - policy.supplierResponseHours,
    relatedEntity: { type: "purchase_order", id: order.id, label: order.number },
  };
}

function ruleDeliveryUnconfirmed(
  order: PurchaseOrderAttentionInput,
  now: Date,
  policy: PurchaseOrderAttentionPolicy,
): PurchaseOrderAttentionItem | null {
  if (CLOSED.has(String(order.status)) || order.status === "REFUSEE") return null;
  if (order.confirmedDeliveryAt) return null;
  const requested = toDate(order.requestedDeliveryAt);
  if (!requested) return null;
  // Si le fournisseur a déjà proposé un créneau, ce n’est plus « sans confirmation »
  // au sens « ignoré » — la confirmation interne reste ouverte mais hors cette règle.
  const proposed = (order.proposedDeliveryStatus || "NONE").toUpperCase();
  if (proposed === "PENDING") return null;

  const hoursUntil = hoursBetween(now, requested);
  const dayDiff = calendarDaysBetween(now, requested);
  const name = supplierLabel(order);
  const when = formatWhenFr(requested);

  if (hoursUntil < 0) {
    return {
      code: "DELIVERY_UNCONFIRMED",
      level: "CRITIQUE",
      reason: `Livraison demandée ${when} — toujours non confirmée par ${name}.`,
      dueAt: requested,
      overdueByHours: -hoursUntil,
      relatedEntity: { type: "purchase_order", id: order.id, label: order.number },
    };
  }

  if (dayDiff === 0) {
    return {
      code: "DELIVERY_UNCONFIRMED",
      level: "URGENT",
      reason: `Livraison demandée aujourd’hui à ${requested.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} — toujours non confirmée par ${name}.`,
      dueAt: requested,
      relatedEntity: { type: "purchase_order", id: order.id, label: order.number },
    };
  }

  if (dayDiff === 1) {
    return {
      code: "DELIVERY_UNCONFIRMED",
      level: "IMPORTANT",
      reason: `Livraison demandée demain à ${requested.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} — toujours non confirmée par ${name}.`,
      dueAt: requested,
      relatedEntity: { type: "purchase_order", id: order.id, label: order.number },
    };
  }

  if (hoursUntil <= policy.unconfirmedDeliveryWarningHours) {
    return {
      code: "DELIVERY_UNCONFIRMED",
      level: "A_SURVEILLER",
      reason: `Livraison demandée ${when} — toujours non confirmée par ${name}.`,
      dueAt: requested,
      relatedEntity: { type: "purchase_order", id: order.id, label: order.number },
    };
  }

  return null;
}

function ruleDeliveryNotReceived(
  order: PurchaseOrderAttentionInput,
  snap: PurchaseOrderReceivingSnapshot,
  now: Date,
  policy: PurchaseOrderAttentionPolicy,
): PurchaseOrderAttentionItem | null {
  if (CLOSED.has(String(order.status)) || order.status === "REFUSEE") return null;
  const confirmed = toDate(order.confirmedDeliveryAt);
  if (!confirmed) return null;
  if (snap.activeReceiptCount > 0) return null;

  const hoursAfter = hoursBetween(confirmed, now);
  if (hoursAfter < policy.deliveryGraceHours) return null;

  const name = supplierLabel(order);
  const when = formatWhenFr(confirmed);
  let level: UrgencyLevel = "IMPORTANT";
  if (hoursAfter >= policy.deliveryNotReceivedUrgentHours * 6) level = "CRITIQUE";
  else if (hoursAfter >= policy.deliveryNotReceivedUrgentHours) level = "URGENT";
  else if (hoursAfter < policy.deliveryNotReceivedUrgentHours) level = "A_SURVEILLER";

  return {
    code: "DELIVERY_NOT_RECEIVED",
    level,
    reason: `Livraison ${name} prévue à ${when} — aucune réception enregistrée.`,
    dueAt: confirmed,
    overdueByHours: hoursAfter,
    relatedEntity: order.agendaEventId
      ? { type: "agenda", id: order.agendaEventId, label: order.number }
      : { type: "purchase_order", id: order.id, label: order.number },
  };
}

function rulePartialPending(
  order: PurchaseOrderAttentionInput,
  snap: PurchaseOrderReceivingSnapshot,
  now: Date,
  policy: PurchaseOrderAttentionPolicy,
): PurchaseOrderAttentionItem | null {
  if (CLOSED.has(String(order.status)) || order.status === "REFUSEE") return null;
  if (!snap.partiallyReceived || snap.totalRemaining <= 0) return null;
  if (!snap.lastActiveReceiptAt) return null;

  const hoursSince = hoursBetween(snap.lastActiveReceiptAt, now);
  if (hoursSince < policy.partialReceiptReminderHours) return null;

  const remainingLine = snap.lineSummaries.find((l) => l.remaining > 0);
  const detail = remainingLine
    ? formatQty(snap.totalRemaining, remainingLine.unit, remainingLine.designation)
    : `${snap.totalRemaining} unité(s)`;

  return {
    code: "PARTIAL_DELIVERY_PENDING",
    level: hoursSince >= policy.partialReceiptReminderHours * 2 ? "IMPORTANT" : "A_SURVEILLER",
    reason: `${detail} restent à livrer depuis ${formatDaysSince(hoursSince)}.`,
    overdueByHours: hoursSince - policy.partialReceiptReminderHours,
    relatedEntity: { type: "purchase_order", id: order.id, label: order.number },
  };
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

  let level: UrgencyLevel = "IMPORTANT";
  if (allBad || ratio >= policy.receiptIssueUrgentRatio) level = "URGENT";

  const parts: string[] = [];
  if (snap.totalDamaged > 0) {
    parts.push(
      `${snap.totalDamaged} ${snap.totalDamaged > 1 ? "unités signalées endommagées" : "unité signalée endommagée"}`,
    );
  }
  if (snap.totalRefused > 0) {
    parts.push(
      `${snap.totalRefused} ${snap.totalRefused > 1 ? "unités refusées" : "unité refusée"}`,
    );
  }

  return {
    code: "RECEIPT_ISSUE",
    level,
    reason: `${parts.join(" et ")} lors de la réception.`,
    relatedEntity: { type: "purchase_order", id: order.id, label: order.number },
  };
}

function ruleDeliveryNoteMissing(
  order: PurchaseOrderAttentionInput,
  now: Date,
  policy: PurchaseOrderAttentionPolicy,
): PurchaseOrderAttentionItem | null {
  if (!policy.deliveryNoteMissingEnabled) return null;
  if (CLOSED.has(String(order.status)) && order.status !== "RECUE") return null;

  const active = order.receipts.filter((r) => !toDate(r.cancelledAt));
  if (active.length === 0) return null;

  // Réception la plus ancienne sans BL (n° ni document)
  const missing = active
    .filter((r) => !r.deliveryNoteNumber?.trim() && !r.hasBlDocument)
    .map((r) => ({ r, at: toDate(r.receivedAt) }))
    .filter((x): x is { r: (typeof active)[0]; at: Date } => Boolean(x.at))
    .sort((a, b) => a.at.getTime() - b.at.getTime());

  if (missing.length === 0) return null;
  const oldest = missing[0]!;
  const hours = hoursBetween(oldest.at, now);
  if (hours < policy.deliveryNoteGraceHours) return null;

  return {
    code: "DELIVERY_NOTE_MISSING",
    level: hours >= policy.deliveryNoteGraceHours * 3 ? "IMPORTANT" : "A_SURVEILLER",
    reason: `Réception enregistrée ${formatDaysSince(hours)} — bon de livraison manquant.`,
    overdueByHours: hours - policy.deliveryNoteGraceHours,
    relatedEntity: { type: "purchase_order", id: order.id, label: order.number },
  };
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

  if (order.status === "ANNULEE" || order.status === "CLOTUREE" || order.status === "BROUILLON") {
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

  const noResponse = ruleSupplierNoResponse(order, now, policy);
  if (noResponse) items.push(noResponse);

  const unconfirmed = ruleDeliveryUnconfirmed(order, now, policy);
  if (unconfirmed) items.push(unconfirmed);

  const notReceived = ruleDeliveryNotReceived(order, snap, now, policy);
  if (notReceived) items.push(notReceived);

  const partial = rulePartialPending(order, snap, now, policy);
  if (partial) items.push(partial);

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
