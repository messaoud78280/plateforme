/**
 * COMMANDES-V2C / V2D — Projection liste commandes (batch, sans N+1).
 * Réutilise evaluatePurchaseOrderAttention + computeReceivingSnapshot + nextAction.
 */
import type { PurchaseOrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { serializeAttentionResult } from "@/lib/follow-up/attention/evaluate";
import type { UrgencyLevel } from "@/lib/follow-up/types";
import { urgencyRank } from "@/lib/follow-up/urgency";
import {
  computeReceivingSnapshot,
  evaluatePurchaseOrderAttention,
} from "@/lib/purchase-orders/attention/evaluate";
import type { PurchaseOrderAttentionInput } from "@/lib/purchase-orders/attention/types";
import { PURCHASE_ORDER_STATUS_LABELS } from "@/lib/purchase-orders/status";
import { purchaseOrderAttentionSelect } from "@/lib/purchase-orders/attention/select";
import {
  evaluatePurchaseOrderNextAction,
  formatPurchaseOrderAttentionWhy,
  type PurchaseOrderNextActionCode,
} from "@/lib/purchase-orders/next-action";
import {
  withPerfLog,
  runWithPerfContext,
  summarizePerfQueries,
} from "@/lib/perf/server-timing";

export type PurchaseOrderListDeliveryKind = "confirmed" | "proposed" | "requested" | "none";

export type PurchaseOrderListRow = {
  id: string;
  number: string;
  subject: string;
  subjectShort: string;
  status: PurchaseOrderStatus;
  statusLabel: string;
  supplierName: string;
  supplierId: string;
  projectId: string | null;
  projectTitle: string | null;
  projectTitleShort: string | null;
  deliveryAt: string | null;
  deliveryKind: PurchaseOrderListDeliveryKind;
  deliveryLabel: string | null;
  orderedQty: number;
  receivedQty: number;
  fullyReceived: boolean;
  attentionActive: boolean;
  attentionUrgency: UrgencyLevel | null;
  attentionShort: string | null;
  attentionReason: string | null;
  /** Raison courte explicable (liste) */
  attentionWhy: string | null;
  nextActionCode: PurchaseOrderNextActionCode;
  nextActionLabel: string;
  nextActionNeedsUser: boolean;
  nextActionHref: string | null;
  agendaEventId: string | null;
  sharedWithSupplier: boolean;
  updatedAt: string;
  canReceive: boolean;
  canMessage: boolean;
};

export type PurchaseOrderListSummary = {
  total: number;
  toTreat: number;
  deliveriesToday: number;
  overdue: number;
  deliveriesThisWeek: number;
  /** @deprecated alias toTreat */
  needingAttention: number;
  toConfirm: number;
};

function stripProjectFromSubject(subject: string, projectTitle: string | null): string {
  let s = subject.trim();
  if (projectTitle) {
    for (const sep of [" — ", " - ", " – "]) {
      const suffix = `${sep}${projectTitle}`;
      if (s.endsWith(suffix)) s = s.slice(0, -suffix.length).trim();
      if (s.includes(suffix)) s = s.split(suffix).join("").trim();
    }
  }
  // Variante fréquente seed démo
  s = s.replace(/\s*[—–-]\s*Résidence (?:Victor Hugo|Les Lilas)\s*/gi, " ").trim();
  return s || subject.trim();
}

function shortProjectTitle(title: string | null): string | null {
  if (!title) return null;
  return title.replace(/^Résidence\s+/i, "").trim() || title;
}

function deliveryInfo(o: {
  confirmedDeliveryAt: Date | null;
  proposedDeliveryAt: Date | null;
  proposedDeliveryStatus: string;
  requestedDeliveryAt: Date | null;
}): {
  at: Date | null;
  kind: PurchaseOrderListDeliveryKind;
  label: string | null;
} {
  if (o.confirmedDeliveryAt) {
    return { at: o.confirmedDeliveryAt, kind: "confirmed", label: "Confirmée" };
  }
  if (o.proposedDeliveryStatus === "PENDING" && o.proposedDeliveryAt) {
    return { at: o.proposedDeliveryAt, kind: "proposed", label: "Proposée" };
  }
  if (o.requestedDeliveryAt) {
    return { at: o.requestedDeliveryAt, kind: "requested", label: "Demandée" };
  }
  return { at: null, kind: "none", label: null };
}

function attentionShortLabel(urgency: UrgencyLevel | null, reason: string | null): string | null {
  if (!urgency || urgency === "NORMAL") return null;
  if (urgency === "CRITIQUE" || urgency === "URGENT") return "Urgent";
  return "À traiter";
}

function startOfWeek(d: Date): Date {
  const x = new Date(d);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfWeek(d: Date): Date {
  const s = startOfWeek(d);
  const e = new Date(s);
  e.setDate(e.getDate() + 7);
  return e;
}

export async function loadPurchaseOrdersListView(opts: {
  organizationId: string;
  /** Filtre portail fournisseur */
  supplierOrgId?: string | null;
  take?: number;
  now?: Date;
}): Promise<{ rows: PurchaseOrderListRow[]; summary: PurchaseOrderListSummary }> {
  return runWithPerfContext(() =>
    withPerfLog("commandes.listView", async () => {
  const take = opts.take ?? 80;
  const now = opts.now ?? new Date();

  const orders = await prisma.purchaseOrder.findMany({
    where: {
      organizationId: opts.organizationId,
      ...(opts.supplierOrgId
        ? {
            sharedWithSupplier: true,
            externalOrganizationId: opts.supplierOrgId,
          }
        : {}),
    },
    select: {
      ...purchaseOrderAttentionSelect,
      updatedAt: true,
      externalOrganizationId: true,
      externalOrganization: {
        select: { id: true, name: true, tradeName: true },
      },
    },
    orderBy: { updatedAt: "desc" },
    take,
  });

  const weekStart = startOfWeek(now);
  const weekEnd = endOfWeek(now);

  const rows: PurchaseOrderListRow[] = [];
  let toConfirm = 0;
  let deliveriesThisWeek = 0;
  let needingAttention = 0;
  let toTreat = 0;
  let deliveriesToday = 0;
  let overdue = 0;
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(now);
  dayEnd.setHours(23, 59, 59, 999);

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

    const input: PurchaseOrderAttentionInput = {
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

    const snap = computeReceivingSnapshot(input);
    const attention = serializeAttentionResult(
      evaluatePurchaseOrderAttention(input, { now }),
    );
    const del = deliveryInfo(o);
    const projectTitle = o.project?.title ?? null;
    const urgency =
      attention.effectiveUrgency && attention.effectiveUrgency !== "NORMAL"
        ? attention.effectiveUrgency
        : null;
    const reason = attention.primaryReason;
    const active = Boolean(urgency && reason);

    if (o.status === "A_CONFIRMER" || o.status === "ENVOYEE_FOURNISSEUR") toConfirm += 1;
    if (del.at && del.at >= weekStart && del.at < weekEnd) deliveriesThisWeek += 1;
    if (active) needingAttention += 1;

    const hasReceiptIssue = receiptLines.some(
      (l) => Number(l.damagedQty) > 0 || Number(l.refusedQty) > 0,
    );
    const next = evaluatePurchaseOrderNextAction(
      {
        status: o.status,
        sharedWithSupplier: o.sharedWithSupplier,
        proposedDeliveryStatus: o.proposedDeliveryStatus,
        requestedDeliveryAt: o.requestedDeliveryAt,
        confirmedDeliveryAt: o.confirmedDeliveryAt,
        proposedDeliveryAt: o.proposedDeliveryAt,
        supplierName: input.supplierName,
        orderedQty: snap.totalOrdered,
        receivedQty: snap.totalReceivedConforming,
        fullyReceived: snap.fullyReceived,
        hasReceiptIssue,
      },
      { now },
    );
    if (next.needsUserAction) toTreat += 1;
    if (del.at && del.at >= dayStart && del.at <= dayEnd && !snap.fullyReceived) {
      deliveriesToday += 1;
    }
    if (
      next.code === "RELANCER_LIVRAISON_EN_RETARD" ||
      (del.at && del.at < dayStart && !snap.fullyReceived && del.kind === "confirmed")
    ) {
      overdue += 1;
    }

    const attentionWhy = formatPurchaseOrderAttentionWhy(
      {
        attentionReason: reason,
        deliveryAt: del.at ? del.at.toISOString() : null,
        deliveryKind: del.kind,
        orderedQty: snap.totalOrdered,
        receivedQty: snap.totalReceivedConforming,
        fullyReceived: snap.fullyReceived,
        nextActionCode: next.code,
      },
      { now },
    );

    const canReceive = [
      "CONFIRMEE",
      "LIVRAISON_PROGRAMMEE",
      "PARTIELLEMENT_RECUE",
      "A_CONFIRMER",
    ].includes(o.status);

    const nextHref =
      next.hrefKind === "reception"
        ? `/dashboard/commandes/${o.id}/reception`
        : next.hrefKind === "detail"
          ? `/dashboard/commandes/${o.id}`
          : null;

    rows.push({
      id: o.id,
      number: o.number,
      subject: o.subject,
      subjectShort: stripProjectFromSubject(o.subject, projectTitle),
      status: o.status,
      statusLabel: PURCHASE_ORDER_STATUS_LABELS[o.status] ?? o.status,
      supplierName: input.supplierName ?? "Fournisseur",
      supplierId: o.externalOrganizationId,
      projectId: o.project?.id ?? null,
      projectTitle,
      projectTitleShort: shortProjectTitle(projectTitle),
      deliveryAt: del.at ? del.at.toISOString() : null,
      deliveryKind: del.kind,
      deliveryLabel: del.label,
      orderedQty: snap.totalOrdered,
      receivedQty: snap.totalReceivedConforming,
      fullyReceived: snap.fullyReceived,
      attentionActive: active || next.needsUserAction,
      attentionUrgency: urgency,
      attentionShort: attentionShortLabel(urgency, reason),
      attentionReason: reason,
      attentionWhy,
      nextActionCode: next.code,
      nextActionLabel: next.label,
      nextActionNeedsUser: next.needsUserAction,
      nextActionHref: nextHref,
      agendaEventId: input.agendaEventId ?? null,
      sharedWithSupplier: o.sharedWithSupplier,
      updatedAt: o.updatedAt.toISOString(),
      canReceive,
      canMessage: Boolean(o.project?.id && o.sharedWithSupplier),
    });
  }

  // Tri défaut : action requise → attention → livraison proche → récentes
  rows.sort((a, b) => {
    if (a.nextActionNeedsUser !== b.nextActionNeedsUser) {
      return a.nextActionNeedsUser ? -1 : 1;
    }
    const ua = a.attentionUrgency ? urgencyRank(a.attentionUrgency) : -1;
    const ub = b.attentionUrgency ? urgencyRank(b.attentionUrgency) : -1;
    if (ub !== ua) return ub - ua;
    const da = a.deliveryAt ? new Date(a.deliveryAt).getTime() : Number.POSITIVE_INFINITY;
    const db = b.deliveryAt ? new Date(b.deliveryAt).getTime() : Number.POSITIVE_INFINITY;
    if (da !== db) return da - db;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  return {
    rows,
    summary: {
      total: rows.length,
      toTreat,
      deliveriesToday,
      overdue,
      deliveriesThisWeek,
      needingAttention: toTreat,
      toConfirm,
    },
  };
    }).finally(() => {
      const s = summarizePerfQueries(5);
      if (s.count > 0) {
        console.info(`[perf] commandes.queries count=${s.count}`);
        for (const q of s.top) {
          console.info(`[perf] commandes.top ${q.model}.${q.action} ${q.ms}ms`);
        }
      }
    }),
  );
}
