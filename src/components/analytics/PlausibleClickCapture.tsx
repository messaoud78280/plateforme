"use client";

import { useEffect } from "react";
import {
  PLAUSIBLE_DATA_EVENT,
  PLAUSIBLE_DATA_LOCATION,
  isPlausibleEnabled,
  trackPlausible,
  type PlausibleEventName,
} from "@/lib/plausible";

/** Capture les clics sur les éléments `data-plausible-event` (y compris liens rendus côté serveur). */
export function PlausibleClickCapture() {
  useEffect(() => {
    if (!isPlausibleEnabled()) return;

    const onClick = (e: MouseEvent) => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      const el = target.closest(`[${PLAUSIBLE_DATA_EVENT}]`);
      if (!(el instanceof HTMLElement)) return;
      const event = el.getAttribute(PLAUSIBLE_DATA_EVENT) as PlausibleEventName | null;
      if (!event) return;
      const location = el.getAttribute(PLAUSIBLE_DATA_LOCATION) || undefined;
      trackPlausible(event, location ? { location } : undefined);
    };

    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  return null;
}
