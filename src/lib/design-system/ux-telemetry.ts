/**
 * Télémétrie UX minimale — désactivée par défaut (feature flag).
 * Aucune donnée métier sensible (noms clients, contenus documents…).
 */

import { isFeatureEnabled } from "@/lib/feature-flags";

export type UxTelemetryEvent =
  | { type: "search_empty"; surface: string }
  | { type: "form_abandon"; surface: string }
  | { type: "ui_error"; surface: string; code?: string }
  | { type: "page_open"; route: string; ms?: number };

export function trackUxEvent(event: UxTelemetryEvent): void {
  if (!isFeatureEnabled("uxTelemetry")) return;
  if (typeof window === "undefined") return;
  try {
    // Hook futur : Plausible custom events / endpoint interne agrégé
    const w = window as Window & { plausible?: (n: string, o?: { props?: Record<string, string> }) => void };
    w.plausible?.("ux", {
      props: {
        type: event.type,
        surface: "surface" in event ? event.surface : "route" in event ? event.route : "n/a",
      },
    });
  } catch {
    /* ignore */
  }
}
