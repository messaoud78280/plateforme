/**
 * CDE-3B2 — Épisode métier stable pour notifications commande.
 * Ancré sur données réelles (event / date / receipt) — jamais new Date() / updatedAt.
 */
import { episodeKeyFromStatusTransition } from "@/lib/follow-up/attention/escalation-policy";
import { toDate } from "@/lib/follow-up/attention/dates";
import type {
  PurchaseOrderAttentionInput,
  PurchaseOrderReceivingSnapshot,
} from "@/lib/purchase-orders/attention/types";

function msKey(v: Date | string | null | undefined, prefix: string): string {
  const d = toDate(v);
  if (!d) return `${prefix}:na`;
  return `${prefix}:t${d.getTime()}`;
}

/**
 * Clé d’épisode pour un code d’attention PO.
 * Même problème métier → même clé → pas de spam cron.
 * Résolution puis récidive → ancre différente → nouvelle notif OK.
 */
export function purchaseOrderAttentionEpisodeKey(
  order: PurchaseOrderAttentionInput,
  code: string,
  snap: PurchaseOrderReceivingSnapshot,
): string {
  switch (code) {
    case "SUPPLIER_NO_RESPONSE":
      return episodeKeyFromStatusTransition({
        eventId: order.sharedEventId ?? null,
        occurredAt: order.sharedWithSupplierAt,
      });
    case "SUPPLIER_PROPOSAL_PENDING":
      return episodeKeyFromStatusTransition({
        eventId: order.proposeEventId ?? null,
        occurredAt: order.proposedDeliveryAt ?? order.sharedWithSupplierAt,
      });
    case "SUPPLIER_REFUSED":
      return episodeKeyFromStatusTransition({
        eventId: order.refuseEventId ?? null,
        occurredAt: order.sharedWithSupplierAt ?? order.requestedDeliveryAt,
      });
    case "ORDER_NOT_SENT":
      return msKey(order.requestedDeliveryAt, "notsent");
    case "DELIVERY_UNCONFIRMED":
      return msKey(order.requestedDeliveryAt, "req");
    case "DELIVERY_OVERDUE":
      return msKey(order.confirmedDeliveryAt, "conf");
    case "PARTIAL_RECEIPT_PENDING": {
      const last = order.receipts
        .filter((r) => !toDate(r.cancelledAt))
        .sort((a, b) => {
          const ta = toDate(a.receivedAt)?.getTime() ?? 0;
          const tb = toDate(b.receivedAt)?.getTime() ?? 0;
          return tb - ta;
        })[0];
      if (last?.id) return `receipt:${last.id}`;
      return msKey(snap.lastActiveReceiptAt, "partial");
    }
    case "RECEIPT_ISSUE": {
      const issue = order.receipts.find(
        (r) =>
          !toDate(r.cancelledAt) &&
          (r.status === "WITH_ISSUES" || r.status === "REFUSED"),
      );
      if (issue?.id) return `issue:${issue.id}`;
      const any = order.receipts.find((r) => !toDate(r.cancelledAt));
      return any?.id ? `issue:${any.id}` : "issue:na";
    }
    case "DELIVERY_NOTE_MISSING": {
      const missing = order.receipts
        .filter((r) => !toDate(r.cancelledAt))
        .filter((r) => !r.deliveryNoteNumber?.trim() && !r.hasBlDocument)
        .sort((a, b) => {
          const ta = toDate(a.receivedAt)?.getTime() ?? 0;
          const tb = toDate(b.receivedAt)?.getTime() ?? 0;
          return ta - tb;
        })[0];
      return missing?.id ? `bl:${missing.id}` : "bl:na";
    }
    default:
      return episodeKeyFromStatusTransition({
        occurredAt: order.sharedWithSupplierAt ?? order.requestedDeliveryAt,
      });
  }
}
