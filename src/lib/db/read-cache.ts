/**
 * Cache mémoire process-local pour lectures dashboard.
 * TTL court — jamais pour écritures.
 */

type Entry<T> = { expiresAt: number; value: T };

const store = new Map<string, Entry<unknown>>();
const MAX_ENTRIES = 80;

export function getCached<T>(key: string): T | null {
  const hit = store.get(key) as Entry<T> | undefined;
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    store.delete(key);
    return null;
  }
  return hit.value;
}

export function setCached<T>(key: string, value: T, ttlMs: number): void {
  if (store.size >= MAX_ENTRIES) {
    const oldest = store.keys().next().value;
    if (oldest) store.delete(oldest);
  }
  store.set(key, { value, expiresAt: Date.now() + Math.max(1_000, ttlMs) });
}
