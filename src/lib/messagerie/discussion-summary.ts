/**
 * MESSAGERIE-V2C.7 / V2C.7.1 — Projection UI unifiée (lecture seule, pas d’unification DB).
 *
 * Agrège :
 * - DirectMessage
 * - TaskMessage (hors BC / POINT.P legacy masqués)
 * - ProjectChannel (activité récente, ACL = Par chantier)
 *
 * Ne fusionne pas les tables. Ne recopie jamais Message → Direct/Task.
 *
 * ## Règle de déduplication BC / fournisseur (V2C.7.1)
 *
 * Si un TaskMessage legacy représente le même contexte métier qu’un
 * ProjectChannel SUPPLIER (ex. « POINT.P — Résidence … BC-2026-043 ») :
 * - le channel est la source active dans Discussions
 * - le TaskMessage reste en DB (historique)
 * - il est exclu de la liste globale (`excludeLegacyPurchaseOrderTasksWhere`
 *   + `shouldHideTaskAgainstProjectChannels`)
 *
 * Deep-links commande / agenda / cockpit → `resolveConversationForContext`
 * (channel Point.P), jamais un clone DirectMessage.
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
  /** Contexte : Tâche | Chantier | Commande — distinct du périmètre. */
  contextLabel?: string | null;
  projectName?: string | null;
  href?: string;
};

export function discussionSortKey(d: DiscussionSummary): number {
  if (!d.lastMessageAt) return 0;
  return new Date(d.lastMessageAt).getTime();
}
