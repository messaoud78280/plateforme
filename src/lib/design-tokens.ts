/**
 * BeWork Command Center — miroir TS des design tokens CSS.
 * Source de vérité visuelle : src/app/globals.css (:root --cc-*).
 */
export const BEWORK_CC = {
  navy: "#1e3a5f",
  navyDeep: "#162d4a",
  navySoft: "#eef2f7",
  ink: "#0f172a",
  muted: "#475569",
  surface: "#ffffff",
  surfaceMuted: "#f4f6f9",
  chrome: "#f7f8fb",
  accent: "#1d4ed8",
  cyan: "#0891b2",
  intel: "#6d28d9",
  ok: "#059669",
  watch: "#d97706",
  critical: "#dc2626",
} as const;

export type StatusTone = "neutral" | "info" | "ok" | "watch" | "critical" | "intel";

export function statusToneFromLabel(label: string): StatusTone {
  const s = label.toLowerCase();
  if (/(critique|retard|bloqu|refus|erreur|danger)/.test(s)) return "critical";
  if (/(vigilance|attente|à vérifier|surveill|échéance|orange)/.test(s)) return "watch";
  if (/(valid|conforme|termin|ok|reçu|payé|levé)/.test(s)) return "ok";
  if (/(analyse|ia|modèle|extraction|intel)/.test(s)) return "intel";
  if (/(cours|envoi|prépar|progress)/.test(s)) return "info";
  return "neutral";
}
