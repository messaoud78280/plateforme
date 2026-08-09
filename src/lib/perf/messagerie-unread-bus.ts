"use client";

/**
 * Poll partagé messagerie non-lus — PERF-V1A.
 * Un seul fetch périodique pour sidebar + header + mobile + toast.
 */

type Listener = (total: number) => void;

let lastTotal = 0;
let lastFetchAt = 0;
let inflight: Promise<number> | null = null;
const listeners = new Set<Listener>();

const MIN_INTERVAL_MS = 40_000;
const STALE_MS = 20_000;

async function fetchUnread(): Promise<number> {
  const res = await fetch("/api/messagerie/unread-count", { cache: "no-store" });
  if (!res.ok) return lastTotal;
  const data = (await res.json()) as { total?: number };
  return typeof data.total === "number" ? data.total : 0;
}

export async function getMessagerieUnread(force = false): Promise<number> {
  const now = Date.now();
  if (!force && now - lastFetchAt < STALE_MS && lastFetchAt > 0) {
    return lastTotal;
  }
  if (inflight) return inflight;

  inflight = fetchUnread()
    .then((total) => {
      lastTotal = total;
      lastFetchAt = Date.now();
      for (const l of listeners) l(total);
      return total;
    })
    .catch(() => lastTotal)
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

export function subscribeMessagerieUnread(listener: Listener): () => void {
  listeners.add(listener);
  listener(lastTotal);

  // Premier abonné lance le poll
  if (listeners.size === 1) {
    void getMessagerieUnread(true);
    const id = window.setInterval(() => {
      void getMessagerieUnread(true);
    }, MIN_INTERVAL_MS);
    (subscribeMessagerieUnread as { _timer?: number })._timer = id;
  }

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      const t = (subscribeMessagerieUnread as { _timer?: number })._timer;
      if (t) window.clearInterval(t);
    }
  };
}

export function useMessagerieUnreadTotal(): number {
  // lazy import react hooks pattern via require in consumer — use dedicated hook file
  return lastTotal;
}
