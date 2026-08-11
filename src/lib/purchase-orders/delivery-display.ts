/**
 * COHERENCE-PLATFORM-V1 — date de livraison affichée = une vérité.
 * PurchaseOrder = source métier ; AgendaEvent = projection.
 *
 * Priorité opérationnelle (alignée sync agenda) :
 * confirmedDeliveryAt ?? requestedDeliveryAt
 * (proposed PENDING n’est jamais la foi affichée comme « livraison »).
 */
import { resolvePurchaseOrderDeliveryReference } from "@/lib/purchase-orders/next-action";

export { resolvePurchaseOrderDeliveryReference };

export const PURCHASE_ORDER_DISPLAY_TZ = "Europe/Paris";

export function toDeliveryDate(v: Date | string | null | undefined): Date | null {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Instant de référence livraison (confirmé > demandé). */
export function getEffectivePurchaseOrderDeliveryAt(input: {
  confirmedDeliveryAt?: Date | string | null;
  requestedDeliveryAt?: Date | string | null;
}): Date | null {
  return resolvePurchaseOrderDeliveryReference({
    confirmedDeliveryAt: input.confirmedDeliveryAt ?? null,
    requestedDeliveryAt: input.requestedDeliveryAt ?? null,
  });
}

/** Heure courte fr-FR en Europe/Paris (évite 07:45Z → 09:45 local). */
export function formatPurchaseOrderDeliveryTime(
  d: Date | string | null | undefined,
): string | null {
  const date = toDeliveryDate(d);
  if (!date) return null;
  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: PURCHASE_ORDER_DISPLAY_TZ,
  });
}

/** Date + heure fr-FR Europe/Paris. */
export function formatPurchaseOrderDeliveryDateTime(
  d: Date | string | null | undefined,
): string | null {
  const date = toDeliveryDate(d);
  if (!date) return null;
  return date.toLocaleString("fr-FR", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: PURCHASE_ORDER_DISPLAY_TZ,
  });
}

/** Jour court + heure (listes). */
export function formatPurchaseOrderDeliveryShort(
  d: Date | string | null | undefined,
): { date: string; time: string } | null {
  const date = toDeliveryDate(d);
  if (!date) return null;
  return {
    date: date.toLocaleDateString("fr-FR", {
      weekday: "short",
      day: "numeric",
      month: "short",
      timeZone: PURCHASE_ORDER_DISPLAY_TZ,
    }),
    time: date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: PURCHASE_ORDER_DISPLAY_TZ,
    }),
  };
}
