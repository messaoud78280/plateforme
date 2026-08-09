/**
 * MESSAGERIE-V2C.4 — Important & pin message = PERSONNELS (localStorage).
 * Distinct de l’épinglage conversation (`bework.msg.pins`).
 * Ne déclenche jamais W3 / À traiter / Urgent métier.
 */

export type MessageKindKey = "DIRECT" | "TASK" | "PROJECT";

export type PersonalMessageKey = `${MessageKindKey}:${string}`;

const IMPORTANT_KEY = "bework.msg.personal.important";
const PINNED_MSG_KEY = "bework.msg.personal.pinnedMessages";

function storageKey(kind: MessageKindKey, messageId: string): PersonalMessageKey {
  return `${kind}:${messageId}`;
}

function readSet(lsKey: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(lsKey);
    const arr = raw ? (JSON.parse(raw) as string[]) : [];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function writeSet(lsKey: string, set: Set<string>) {
  try {
    localStorage.setItem(lsKey, JSON.stringify([...set]));
  } catch {
    /* quota */
  }
}

export function isMessageImportant(kind: MessageKindKey, messageId: string): boolean {
  return readSet(IMPORTANT_KEY).has(storageKey(kind, messageId));
}

export function toggleMessageImportant(
  kind: MessageKindKey,
  messageId: string,
): boolean {
  const set = readSet(IMPORTANT_KEY);
  const k = storageKey(kind, messageId);
  if (set.has(k)) set.delete(k);
  else set.add(k);
  writeSet(IMPORTANT_KEY, set);
  return set.has(k);
}

export function setMessagesImportant(
  keys: { kind: MessageKindKey; messageId: string }[],
  value: boolean,
): void {
  const set = readSet(IMPORTANT_KEY);
  for (const { kind, messageId } of keys) {
    const k = storageKey(kind, messageId);
    if (value) set.add(k);
    else set.delete(k);
  }
  writeSet(IMPORTANT_KEY, set);
}

export function isMessagePinnedPersonal(kind: MessageKindKey, messageId: string): boolean {
  return readSet(PINNED_MSG_KEY).has(storageKey(kind, messageId));
}

export function toggleMessagePinnedPersonal(
  kind: MessageKindKey,
  messageId: string,
): boolean {
  const set = readSet(PINNED_MSG_KEY);
  const k = storageKey(kind, messageId);
  if (set.has(k)) set.delete(k);
  else set.add(k);
  writeSet(PINNED_MSG_KEY, set);
  return set.has(k);
}

export function listPinnedMessageKeys(): PersonalMessageKey[] {
  return [...readSet(PINNED_MSG_KEY)] as PersonalMessageKey[];
}

export function listImportantMessageKeys(): PersonalMessageKey[] {
  return [...readSet(IMPORTANT_KEY)] as PersonalMessageKey[];
}

export function parsePersonalMessageKey(
  key: string,
): { kind: MessageKindKey; messageId: string } | null {
  const i = key.indexOf(":");
  if (i < 0) return null;
  const kind = key.slice(0, i) as MessageKindKey;
  const messageId = key.slice(i + 1);
  if (!["DIRECT", "TASK", "PROJECT"].includes(kind) || !messageId) return null;
  return { kind, messageId };
}
