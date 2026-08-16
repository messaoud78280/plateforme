/**
 * BeWork UI-COLOR-2 — miroir TS des tokens CSS.
 * Source de vérité visuelle : src/app/globals.css (:root --cc-* / --bw-* / --primary*).
 *
 * Philosophie : identité avant-gardiste BTP — navy + accents maîtrisés, coloré sans flashy.
 */
export const BEWORK_CC = {
  navy: "#173b67",
  navyDeep: "#132f4c",
  navySoft: "#e4ecf6",
  ink: "#0f172a",
  muted: "#64748b",
  surface: "#ffffff",
  surfaceMuted: "#eef3f9",
  chrome: "#edf2f8",
  accent: "#2563eb",
  cyan: "#13a6c8",
  intel: "#7c5ce6",
  ok: "#059669",
  watch: "#d97706",
  critical: "#c2413a",
} as const;

/** Alias primary demandés UI-COLOR-2 */
export const BEWORK_PRIMARY = {
  primary: "#2563eb",
  soft: "#e8f0fe",
  muted: "#dbe7fb",
  foreground: "#ffffff",
} as const;

export const BEWORK_SOFT = {
  navy: "#e4ecf6",
  accent: "#e4eefd",
  cyan: "#dff4f9",
  ok: "#e6f9f1",
  watch: "#fff4e6",
  critical: "#fdeceb",
  violet: "#eee9ff",
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

export type StatusTone =
  | "neutral"
  | "info"
  | "ok"
  | "watch"
  | "critical"
  | "intel"
  | "cyan";

export function statusToneFromLabel(label: string): StatusTone {
  const s = label.toLowerCase();
  if (/(critique|retard|bloqu|refus|erreur|danger|impay|annul)/.test(s)) return "critical";
  if (
    /(vigilance|attente|à vérifier|surveill|échéance|orange|urgent|important|à traiter|partiel|à récupérer|à classer|brouillon)/.test(
      s,
    )
  ) {
    return "watch";
  }
  if (/(valid|conforme|termin|ok|reçu|payé|levé|accepté|réalis|actif|facturé)/.test(s)) return "ok";
  if (/(analyse|ia|modèle|extraction|intel|avenant|étude|favori)/.test(s)) return "intel";
  if (/(métré|document|info|cyan|émis|situation|archiv)/.test(s)) return "cyan";
  if (/(cours|envoi|prépar|progress|envoyé|confirmation)/.test(s)) return "info";
  return "neutral";
}

export const STATUS_TONE_BADGE: Record<StatusTone, string> = {
  neutral: "badge-cc badge-cc-neutral",
  info: "badge-cc badge-cc-info",
  ok: "badge-cc badge-cc-ok",
  watch: "badge-cc badge-cc-watch",
  critical: "badge-cc badge-cc-critical",
  intel: "badge-cc badge-cc-intel",
  cyan: "badge-cc badge-cc-cyan",
};
