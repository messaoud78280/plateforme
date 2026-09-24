"use client";

import { useEffect, useState } from "react";
import {
  getATraiterCountSnapshot,
  subscribeATraiterCount,
} from "@/lib/perf/a-traiter-count-bus";

/** Badge « À traiter » — un seul poll partagé (sidebar / header). */
export function useATraiterCount() {
  const [state, setState] = useState(getATraiterCountSnapshot);

  useEffect(() => subscribeATraiterCount(setState), []);

  const { total, capped } = state;
  const visible = total > 0 || capped;
  const label =
    total <= 0 && !capped
      ? null
      : capped
        ? `${total <= 0 ? "200" : total > 99 ? "99" : total}+`
        : total > 99
          ? "99+"
          : String(total);

  return { total, capped, visible, label };
}
