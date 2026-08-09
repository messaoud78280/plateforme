/**
 * MESSAGERIE-V2C.4 — Réactions via payloadJson.reactions (Direct / Task uniquement).
 * Une réaction active par utilisateur et par message.
 */

export const MESSAGE_REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"] as const;

export type MessageReactionEmoji = (typeof MESSAGE_REACTION_EMOJIS)[number];

/** userId → emoji */
export type MessageReactionsMap = Record<string, string>;

export function getReactionsFromPayload(payload: unknown): MessageReactionsMap {
  if (!payload || typeof payload !== "object") return {};
  const raw = (payload as { reactions?: unknown }).reactions;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: MessageReactionsMap = {};
  for (const [uid, emoji] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof emoji === "string" && emoji.trim()) out[uid] = emoji.trim();
  }
  return out;
}

export function applyReactionToMap(
  current: MessageReactionsMap,
  userId: string,
  emoji: string | null,
): MessageReactionsMap {
  const next = { ...current };
  if (!emoji) {
    delete next[userId];
    return next;
  }
  next[userId] = emoji;
  return next;
}

export function mergeReactionsIntoPayload(
  existing: unknown,
  reactions: MessageReactionsMap,
): Record<string, unknown> {
  const base =
    existing && typeof existing === "object" && !Array.isArray(existing)
      ? { ...(existing as Record<string, unknown>) }
      : {};
  return { ...base, reactions };
}

/** Agrège pour l’UI : [{ emoji, count, userIds }] */
export function aggregateReactions(
  map: MessageReactionsMap,
): { emoji: string; count: number; userIds: string[] }[] {
  const byEmoji = new Map<string, string[]>();
  for (const [uid, emoji] of Object.entries(map)) {
    const list = byEmoji.get(emoji) ?? [];
    list.push(uid);
    byEmoji.set(emoji, list);
  }
  return [...byEmoji.entries()]
    .map(([emoji, userIds]) => ({ emoji, count: userIds.length, userIds }))
    .sort((a, b) => b.count - a.count || a.emoji.localeCompare(b.emoji));
}
