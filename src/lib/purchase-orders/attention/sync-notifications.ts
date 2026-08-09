/**
 * CDE-3B2 — Sync INITIAL notifications PurchaseOrder (idempotent).
 * Consomme evaluatePurchaseOrderAttention — ne recalcule pas les règles métier.
 * Pas d’e-mail / SMS / WhatsApp. Destinataires internes uniquement.
 */
import { prisma } from "@/lib/prisma";
import { buildStagedAttentionDedupeKey } from "@/lib/follow-up/attention/escalation-policy";
import {
  notificationTypeForPurchaseOrderAttentionLevel,
  shouldNotifyAttentionLevel,
} from "@/lib/follow-up/attention/notify-policy";
import { URGENCY_LABELS, type UrgencyLevel } from "@/lib/follow-up/types";
import {
  computeReceivingSnapshot,
  evaluatePurchaseOrderAttention,
} from "@/lib/purchase-orders/attention/evaluate";
import { purchaseOrderAttentionEpisodeKey } from "@/lib/purchase-orders/attention/episode";
import type { PurchaseOrderAttentionInput } from "@/lib/purchase-orders/attention/types";
import type { SyncAttentionResult } from "@/lib/follow-up/attention/sync-notifications";

function isInternalPerson(personType: string | null | undefined): boolean {
  if (!personType) return true;
  return personType === "INTERNAL";
}

/** Action URL contextualisée selon le code primary. */
export function purchaseOrderAttentionActionUrl(
  orderId: string,
  code: string | null | undefined,
): string {
  const base = `/dashboard/commandes/${orderId}`;
  switch (code) {
    case "SUPPLIER_PROPOSAL_PENDING":
      return `${base}?focus=proposition`;
    case "RECEIPT_ISSUE":
    case "PARTIAL_RECEIPT_PENDING":
    case "DELIVERY_OVERDUE":
      return `${base}/reception`;
    case "DELIVERY_NOTE_MISSING":
      return `${base}?focus=documents`;
    default:
      return base;
  }
}

/**
 * Destinataire INITIAL commande :
 * 1. responsable interne
 * 2. demandeur interne
 * Jamais fournisseur / client.
 */
export async function resolvePurchaseOrderNotificationRecipient(order: {
  responsibleId?: string | null;
  requestedById?: string | null;
}): Promise<string | null> {
  const candidates = [order.responsibleId, order.requestedById].filter(
    (id): id is string => Boolean(id),
  );
  for (const id of candidates) {
    const u = await prisma.user.findUnique({
      where: { id },
      select: { id: true, personType: true },
    });
    if (u && isInternalPerson(u.personType)) return u.id;
  }
  return null;
}

/**
 * Pour chaque commande diagnostiquée : au plus une notif INITIAL sur le primaryReason.
 * Secondary reasons → visibles dans À traiter uniquement (anti-spam).
 */
export async function syncAttentionNotificationsForPurchaseOrders(
  orders: PurchaseOrderAttentionInput[],
  opts?: {
    now?: Date;
    organizationId?: string | null;
    ownerUserIdByOrderId?: Map<string, string>;
  },
): Promise<SyncAttentionResult> {
  const result: SyncAttentionResult = {
    examined: orders.length,
    created: 0,
    skipped: 0,
    unchanged: 0,
  };
  if (orders.length === 0) return result;

  const now = opts?.now ?? new Date();

  for (const order of orders) {
    try {
      const attention = evaluatePurchaseOrderAttention(order, { now });
      if (!shouldNotifyAttentionLevel(attention.effectiveUrgency)) {
        result.skipped += 1;
        continue;
      }
      const primary = attention.attentionItems[0];
      if (!primary?.code || !attention.primaryReason) {
        result.skipped += 1;
        continue;
      }

      const recipientId = await resolvePurchaseOrderNotificationRecipient(order);
      if (!recipientId) {
        result.skipped += 1;
        continue;
      }

      const snap = computeReceivingSnapshot(order);
      const episode = purchaseOrderAttentionEpisodeKey(order, primary.code, snap);
      const level = attention.effectiveUrgency as UrgencyLevel;
      const dedupeKey = buildStagedAttentionDedupeKey({
        userId: recipientId,
        sheetId: order.id,
        code: primary.code,
        level,
        episode,
        stage: "INITIAL",
        subjectType: "PURCHASE_ORDER",
      });

      const existing = await prisma.notification.findUnique({
        where: { dedupeKey },
        select: { id: true },
      });
      if (existing) {
        result.unchanged += 1;
        continue;
      }

      const supplier = (order.supplierName || "Fournisseur").trim();
      const title = `${URGENCY_LABELS[level]} · ${supplier} — ${order.number}`;
      const message = attention.primaryReason;

      await prisma.notification.create({
        data: {
          userId: recipientId,
          type: notificationTypeForPurchaseOrderAttentionLevel(level),
          title,
          message,
          actionUrl: purchaseOrderAttentionActionUrl(order.id, primary.code),
          dedupeKey,
        },
      });
      result.created += 1;
    } catch (e: unknown) {
      const code =
        e && typeof e === "object" && "code" in e
          ? String((e as { code?: string }).code)
          : "";
      if (code === "P2002") {
        result.unchanged += 1;
      } else {
        console.error("[syncAttentionNotificationsForPurchaseOrders]", order.id, e);
        result.skipped += 1;
      }
    }
  }

  return result;
}
