import type { UrgencyLevel } from "@/lib/follow-up/types";
import { urgencyRank } from "@/lib/follow-up/urgency";

/**
 * Politique W3-C1 — quels niveaux d’attention génèrent une notification interne.
 * Centralisé pour configuration ultérieure (pas de duplication dans les composants).
 */
export const ATTENTION_NOTIFY_MIN_LEVEL: UrgencyLevel = "IMPORTANT";

export function shouldNotifyAttentionLevel(level: UrgencyLevel | string): boolean {
  return urgencyRank(level as UrgencyLevel) >= urgencyRank(ATTENTION_NOTIFY_MIN_LEVEL);
}

export function notificationTypeForAttentionLevel(
  level: UrgencyLevel | string,
): "FOLLOWUP_CRITICAL" | "FOLLOWUP_URGENT" | "FOLLOWUP_ATTENTION" {
  if (urgencyRank(level as UrgencyLevel) >= urgencyRank("CRITIQUE")) return "FOLLOWUP_CRITICAL";
  if (urgencyRank(level as UrgencyLevel) >= urgencyRank("URGENT")) return "FOLLOWUP_URGENT";
  return "FOLLOWUP_ATTENTION";
}

/** CDE-3B2 — types Notification pour commandes (même hiérarchie W3). */
export function notificationTypeForPurchaseOrderAttentionLevel(
  level: UrgencyLevel | string,
): "PURCHASE_ORDER_CRITICAL" | "PURCHASE_ORDER_URGENT" | "PURCHASE_ORDER_ATTENTION" {
  if (urgencyRank(level as UrgencyLevel) >= urgencyRank("CRITIQUE")) {
    return "PURCHASE_ORDER_CRITICAL";
  }
  if (urgencyRank(level as UrgencyLevel) >= urgencyRank("URGENT")) {
    return "PURCHASE_ORDER_URGENT";
  }
  return "PURCHASE_ORDER_ATTENTION";
}

/**
 * Clé legacy W3-C1 (sans épisode / stage).
 * Les nouvelles notifs INITIAL utilisent buildStagedAttentionDedupeKey (épisode).
 */
export function buildAttentionDedupeKey(opts: {
  userId: string;
  sheetId: string;
  code: string;
  level: string;
}): string {
  return `ATTENTION:${opts.userId}:${opts.sheetId}:${opts.code}:${opts.level}`;
}
