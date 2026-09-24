"use client";

/**
 * Bus unique « À traiter » — un seul poll partagé pour sidebar + header.
 * Évite 2× /api/a-traiter/count (Badge + Dot) toutes les 45 s.
 */

import { startVisibilityAwareInterval } from "@/lib/perf/visibility-poll";

type Snapshot = { total: number; capped: boolean };
type Listener = (s: Snapshot) => void;

let snapshot: Snapshot = { total: 0, capped: false };
let lastFetchAt = 0;
let inflight: Promise<Snapshot> | null = null;
const listeners = new Set<Listener>();
let stopPoll: (() => void) | null = null;

const POLL_MS = 60_000;
const STALE_MS = 8_000;

async function fetchCount(): Promise<Snapshot> {
  const res = await fetch("/api/a-traiter/count", { cache: "no-store" });
  if (!res.ok) return snapshot;
  const data = (await res.json()) as { total?: number; capped?: boolean };
  return {
    total: typeof data.total === "number" ? data.total : 0,
    capped: Boolean(data.capped),
  };
}

function emit(next: Snapshot) {
  snapshot = next;
  lastFetchAt = Date.now();
  for (const l of listeners) l(next);
}

export async function getATraiterCount(force = false): Promise<Snapshot> {
  const now = Date.now();
  if (!force && now - lastFetchAt < STALE_MS && lastFetchAt > 0) {
    return snapshot;
  }
  if (inflight) return inflight;

  inflight = fetchCount()
    .then((s) => {
      emit(s);
      return s;
    })
    .catch(() => snapshot)
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

function ensurePoll() {
  if (typeof window === "undefined" || stopPoll) return;
  stopPoll = startVisibilityAwareInterval(
    () => void getATraiterCount(true),
    POLL_MS,
    { runImmediately: false },
  );
}

function teardown() {
  stopPoll?.();
  stopPoll = null;
}

export function subscribeATraiterCount(listener: Listener): () => void {
  listeners.add(listener);
  listener(snapshot);
  ensurePoll();
  void getATraiterCount(true);

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) teardown();
  };
}

export function getATraiterCountSnapshot(): Snapshot {
  return snapshot;
}
