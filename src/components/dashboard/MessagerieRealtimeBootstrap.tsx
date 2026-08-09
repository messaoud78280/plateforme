"use client";

import { useEffect } from "react";
import { attachMessagerieRealtime } from "@/lib/perf/messagerie-unread-bus";

/** Une seule subscription Supabase Broadcast / utilisateur (PERF-V1B). */
export function MessagerieRealtimeBootstrap({ userId }: { userId: string }) {
  useEffect(() => {
    attachMessagerieRealtime(userId);
  }, [userId]);
  return null;
}
