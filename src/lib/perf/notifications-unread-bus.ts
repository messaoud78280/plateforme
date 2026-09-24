"use client";

/**
 * Bus unique notifications unread — un poll partagé + pause onglet caché.
 */

import { startVisibilityAwareInterval } from "@/lib/perf/visibility-poll";

type Listener = (unreadCount: number) => void;

let lastCount = 0;
let lastFetchAt = 0;
let inflight: Promise<number> | null = null;
const listeners = new Set<Listener>();
let stopPoll: (() => void) | null = null;

const POLL_MS = 90_000;
const STALE_MS = 10_000;

async function fetchUnread(): Promise<number> {
  const res = await fetch("/api/notifications/unread-count", { cache: "no-store" });
  if (!res.ok) return lastCount;
  const data = (await res.json()) as { unreadCount?: number };
  return typeof data.unreadCount === "number" ? data.unreadCount : 0;
}

function emit(n: number) {
  lastCount = n;
  lastFetchAt = Date.now();
  for (const l of listeners) l(n);
}

export async function getNotificationsUnread(force = false): Promise<number> {
  const now = Date.now();
  if (!force && now - lastFetchAt < STALE_MS && lastFetchAt > 0) {
    return lastCount;
  }
  if (inflight) return inflight;

  inflight = fetchUnread()
    .then((n) => {
      emit(n);
      return n;
    })
    .catch(() => lastCount)
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

function ensurePoll() {
  if (typeof window === "undefined" || stopPoll) return;
  stopPoll = startVisibilityAwareInterval(
    () => void getNotificationsUnread(true),
    POLL_MS,
    { runImmediately: false },
  );
}

function teardown() {
  stopPoll?.();
  stopPoll = null;
}

export function subscribeNotificationsUnread(listener: Listener): () => void {
  listeners.add(listener);
  listener(lastCount);
  ensurePoll();
  void getNotificationsUnread(true);

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) teardown();
  };
}

export function setNotificationsUnreadOptimistic(n: number) {
  emit(Math.max(0, n));
}
