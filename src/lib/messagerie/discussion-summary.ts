/**
 * MESSAGERIE-V2C.7 — Projection UI unifiée (lecture seule, pas d’unification DB).
 *
 * Agrège DirectMessage + TaskMessage (+ ProjectChannel via Par chantier / deep-links).
 * Ne fusionne pas les tables.
 *
 * Doublons métier connus (à ne pas afficher deux fois dans Discussions) :
 * - TaskMessage legacy « POINT.P — … BC-2026-xxx » vs ProjectChannel FOURNISSEUR Point.P
 *   → deep-links commande / livraison ciblent le channel (resolveConversationForContext).
 * - Ne pas supprimer les TaskMessage historiques en DB.
 */

export type DiscussionSourceType = "DIRECT" | "TASK" | "PROJECT_CHANNEL";

export type DiscussionSummary = {
  key: string;
  sourceType: DiscussionSourceType;
  /** ID technique (userId | taskId | channelId) */
  sourceId: string;
  title: string;
  subtitle: string;
  lastMessagePreview: string;
  lastMessageAt: string | null;
  unreadCount: number;
  pinned: boolean;
  /** Périmètre réel (qui peut lire) — pas le sujet métier. */
  partyType: string;
  partyBadge: string;
  projectName?: string | null;
};

export function discussionSortKey(d: DiscussionSummary): number {
  if (!d.lastMessageAt) return 0;
  return new Date(d.lastMessageAt).getTime();
}
