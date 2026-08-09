/**
 * BeWork DESIGN-SYSTEM-V3 — miroir TS des tokens CSS.
 * Source de vérité visuelle : src/app/globals.css (:root --cc-* / --bw-*).
 *
 * Philosophie : calme, premium, lisible — identité BeWork BTP (navy).
 * Pas d’imitation littérale Apple.
 */
export const BEWORK_CC = {
  navy: "#1e3a5f",
  navyDeep: "#162d4a",
  navySoft: "#eef2f7",
  ink: "#0f172a",
  muted: "#64748b",
  surface: "#ffffff",
  surfaceMuted: "#f5f7fa",
  chrome: "#f7f8fb",
  accent: "#2563eb",
  cyan: "#0891b2",
  /** Accent ponctuel uniquement — pas décoratif */
  intel: "#6d28d9",
  ok: "#059669",
  watch: "#d97706",
  critical: "#dc2626",
} as const;

/** Échelle radius V3 (px conceptuels → rem). */
export const BEWORK_RADIUS = {
  control: "0.625rem", // 10px — inputs, boutons
  card: "0.9375rem", // 15px
  panel: "1.125rem", // 18px — modales / drawers
} as const;

/** Transitions micro-interaction. */
export const BEWORK_MOTION = {
  fast: "160ms",
  base: "180ms",
  ease: "cubic-bezier(0.25, 0.1, 0.25, 1)",
} as const;

export const BEWORK_LAYOUT = {
  siteMaxWidth: "1280px",
  dashboardMaxWidth: "1520px",
  dashboardComfort: "1400px",
} as const;

export type StatusTone = "neutral" | "info" | "ok" | "watch" | "critical" | "intel";

export function statusToneFromLabel(label: string): StatusTone {
  const s = label.toLowerCase();
  if (/(critique|retard|bloqu|refus|erreur|danger)/.test(s)) return "critical";
  if (/(vigilance|attente|à vérifier|surveill|échéance|orange|urgent|à traiter)/.test(s)) {
    return "watch";
  }
  if (/(valid|conforme|termin|ok|reçu|payé|levé)/.test(s)) return "ok";
  if (/(analyse|ia|modèle|extraction|intel)/.test(s)) return "intel";
  if (/(cours|envoi|prépar|progress)/.test(s)) return "info";
  return "neutral";
}
