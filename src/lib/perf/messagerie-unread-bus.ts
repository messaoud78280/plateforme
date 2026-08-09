"use client";

/**
 * Bus Messagerie unique — contrôle post-V1B.
 *
 * PRINCIPAL : Supabase Broadcast (immédiat) quand disponible
 * SECOURS   : SSE /api/messagerie/live (resync ~2,5 s) si Broadcast indisponible
 * FILET     : poll 90 s
 *
 * Une seule subscription logique / user. Déduplication des événements.
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
/** Broadcast connecté → SSE ne doit pas être le chemin principal. */
let broadcastReady = false;

const seenEventKeys = new Set<string>();
const FALLBACK_POLL_MS = 90_000;
const SSE_INTERVAL_HINT_MS = 2_500;
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

function eventKey(ev: MessagerieRealtimePayload) {
  return `${ev.conversationKey}:${ev.at}:${ev.senderId}`;
}

function emitEvent(ev: MessagerieRealtimePayload) {
  const key = eventKey(ev);
  if (seenEventKeys.has(key)) return;
  seenEventKeys.add(key);
  if (seenEventKeys.size > 80) {
    const first = seenEventKeys.values().next().value;
    if (first) seenEventKeys.delete(first);
  }
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

function stopSse() {
  if (sse) {
    sse.close();
    sse = null;
  }
}

function startSse() {
  if (typeof window === "undefined") return;
  if (sse && sse.readyState !== EventSource.CLOSED) return;
  try {
    sse = new EventSource("/api/messagerie/live");
    sse.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data) as { type?: string; total?: number };
        // SSE = resync compteur uniquement (pas de toast / pas d’event métier)
        if (data.type === "unread" && typeof data.total === "number") {
          emitUnread(data.total);
        }
      } catch {
        // ignore
      }
    };
    sse.onerror = () => {
      ensurePollFallback();
    };
  } catch {
    ensurePollFallback();
  }
}

function ensurePollFallback() {
  if (typeof window === "undefined") return;
  if (pollTimer == null) {
    pollTimer = window.setInterval(() => void getMessagerieUnread(true), FALLBACK_POLL_MS);
  }
}

/**
 * Transport :
 * - Broadcast prêt → pas de SSE agressif (poll 90 s seulement)
 * - sinon → SSE secours
 */
function ensureTransport() {
  if (typeof window === "undefined") return;

  if (broadcastReady) {
    stopSse();
    ensurePollFallback();
    return;
  }

  startSse();
  ensurePollFallback();
}

/** Abonnement Broadcast — chemin principal immédiat. */
export function attachMessagerieRealtime(userId: string) {
  if (typeof window === "undefined" || !userId) return;
  // Une seule subscription logique / user (même si Broadcast pas encore SUBSCRIBED)
  if (subscribedUserId === userId && supabaseChannel) return;

  const sb = createBrowserClient();
  if (!sb) {
    broadcastReady = false;
    ensureTransport();
    return;
  }

  if (supabaseChannel) {
    void sb.removeChannel(supabaseChannel);
    supabaseChannel = null;
  }

  subscribedUserId = userId;
  broadcastReady = false;
  const ch = sb.channel(`messagerie-user-${userId}`);
  ch.on("broadcast", { event: "new_message" }, ({ payload }) => {
    const p = payload as MessagerieRealtimePayload;
    if (p?.receiverId === userId) emitEvent(p);
  });
  ch.subscribe((status) => {
    if (status === "SUBSCRIBED") {
      broadcastReady = true;
      // Broadcast OK : SSE n’est plus le chemin principal
      stopSse();
      ensurePollFallback();
    }
    if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
      broadcastReady = false;
      ensureTransport();
    }
  });
  supabaseChannel = ch;

  // En attendant SUBSCRIBED, SSE peut resynchroniser le badge
  ensureTransport();
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
  stopSse();
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
  broadcastReady = false;
}

export function useMessagerieUnreadTotal(): number {
  return lastTotal;
}

/** Exposé pour tests / debug. */
export function __messagerieBusDebug() {
  return {
    broadcastReady,
    hasSse: Boolean(sse),
    sseIntervalHintMs: SSE_INTERVAL_HINT_MS,
    seenEvents: seenEventKeys.size,
  };
}
