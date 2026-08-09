"use client";

import { useEffect, useState } from "react";
import {
  getMessagerieUnread,
  subscribeMessagerieUnread,
} from "@/lib/perf/messagerie-unread-bus";

/** Hook badge / header — un seul poll partagé (PERF-V1A). */
export function useMessagerieUnread(): number {
  const [total, setTotal] = useState(0);

  useEffect(() => {
    return subscribeMessagerieUnread(setTotal);
  }, []);

  useEffect(() => {
    void getMessagerieUnread();
  }, []);

  return total;
}
