"use client";

/**
 * Bus Messagerie unique — PERF-V1B.
 * REALTIME principal : SSE /api/messagerie/live (+ broadcast Supabase si dispo)
 * FALLBACK : poll 90 s
 */

import { createBrowserClient } from "@/lib/supabase";
import type { MessagerieRealtimePayload } from "@/lib/messagerie/broadcast";
import type { RealtimeChannel } from "@supabase/supabase-js";

type UnreadListener = (total: number) => void;
type EventListener = (ev: MessagerieRealtimePayload) => void;

let lastTotal = 0;
let lastFetchAt = 0;
let inflight: Promise<number> | null = null;
const unreadListeners = new Set<UnreadListener>();
const eventListeners = new Set<EventListener>();

let sse: EventSource | null = null;
let pollTimer: number | null = null;
let supabaseChannel: RealtimeChannel | null = null;
let subscribedUserId: string | null = null;

const FALLBACK_POLL_MS = 90_000;
const STALE_MS = 5_000;

async function fetchUnread(): Promise<number> {
  const res = await fetch("/api/messagerie/unread-count", { cache: "no-store" });
  if (!res.ok) return lastTotal;
  const data = (await res.json()) as { total?: number };
  return typeof data.total === "number" ? data.total : 0;
}

function emitUnread(total: number) {
  lastTotal = total;
  lastFetchAt = Date.now();
  for (const l of unreadListeners) l(total);
}

function emitEvent(ev: MessagerieRealtimePayload) {
  for (const l of eventListeners) l(ev);
  void getMessagerieUnread(true);
}

export async function getMessagerieUnread(force = false): Promise<number> {
  const now = Date.now();
  if (!force && now - lastFetchAt < STALE_MS && lastFetchAt > 0) {
    return lastTotal;
  }
  if (inflight) return inflight;

  inflight = fetchUnread()
    .then((total) => {
      emitUnread(total);
      return total;
    })
    .catch(() => lastTotal)
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

function ensureTransport() {
  if (typeof window === "undefined") return;

  if (!sse || sse.readyState === EventSource.CLOSED) {
    try {
      sse = new EventSource("/api/messagerie/live");
      sse.onmessage = (msg) => {
        try {
          const data = JSON.parse(msg.data) as { type?: string; total?: number };
          if (data.type === "unread" && typeof data.total === "number") {
            emitUnread(data.total);
          }
        } catch {
          // ignore
        }
      };
      sse.onerror = () => {
        // filet poll si SSE coupe
        if (pollTimer == null) {
          pollTimer = window.setInterval(() => void getMessagerieUnread(true), FALLBACK_POLL_MS);
        }
      };
    } catch {
      if (pollTimer == null) {
        pollTimer = window.setInterval(() => void getMessagerieUnread(true), FALLBACK_POLL_MS);
      }
    }
  }

  if (pollTimer == null) {
    // resync rare même si SSE OK (reconnexion / dérive)
    pollTimer = window.setInterval(() => void getMessagerieUnread(true), FALLBACK_POLL_MS);
  }
}

/** Abonnement broadcast Supabase (optionnel) — une seule channel / user. */
export function attachMessagerieRealtime(userId: string) {
  if (typeof window === "undefined" || !userId) return;
  if (subscribedUserId === userId && supabaseChannel) return;

  const sb = createBrowserClient();
  if (!sb) return;

  if (supabaseChannel) {
    void sb.removeChannel(supabaseChannel);
    supabaseChannel = null;
  }

  subscribedUserId = userId;
  const ch = sb.channel(`messagerie-user-${userId}`);
  ch.on("broadcast", { event: "new_message" }, ({ payload }) => {
    const p = payload as MessagerieRealtimePayload;
    if (p?.receiverId === userId) emitEvent(p);
  });
  ch.subscribe();
  supabaseChannel = ch;
}

export function subscribeMessagerieUnread(listener: UnreadListener): () => void {
  unreadListeners.add(listener);
  listener(lastTotal);
  ensureTransport();
  void getMessagerieUnread(true);

  return () => {
    unreadListeners.delete(listener);
    if (unreadListeners.size === 0 && eventListeners.size === 0) {
      teardown();
    }
  };
}

export function subscribeMessagerieEvents(listener: EventListener): () => void {
  eventListeners.add(listener);
  ensureTransport();
  return () => {
    eventListeners.delete(listener);
    if (unreadListeners.size === 0 && eventListeners.size === 0) {
      teardown();
    }
  };
}

function teardown() {
  if (sse) {
    sse.close();
    sse = null;
  }
  if (pollTimer != null) {
    window.clearInterval(pollTimer);
    pollTimer = null;
  }
  if (supabaseChannel) {
    const sb = createBrowserClient();
    if (sb) void sb.removeChannel(supabaseChannel);
    supabaseChannel = null;
    subscribedUserId = null;
  }
}

export function useMessagerieUnreadTotal(): number {
  return lastTotal;
}
