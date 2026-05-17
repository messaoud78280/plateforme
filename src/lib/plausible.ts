/** Domaine du site (référence doc ; le script projet l’embarque déjà). */
export const PLAUSIBLE_DOMAIN =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN?.trim()) || "bework.fr";

/** Script projet fourni par Plausible (Settings → Installation). */
export const PLAUSIBLE_SCRIPT_SRC =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_PLAUSIBLE_SCRIPT_SRC?.trim()) ||
  "https://plausible.io/js/pa-bsL4Gruol1zvXstvoOrnQ.js";

export const PLAUSIBLE_INIT_INLINE = `window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)},plausible.init=plausible.init||function(i){plausible.o=i||{}};plausible.init()`;

export const PLAUSIBLE_DATA_EVENT = "data-plausible-event";
export const PLAUSIBLE_DATA_LOCATION = "data-plausible-location";

/** Noms d’événements personnalisés (à créer comme « Goals » dans Plausible si vous filtrez par objectif). */
export const PLAUSIBLE_EVENTS = {
  CTA_RENDEZ_VOUS: "CTA Rendez-vous",
  CTA_CONTACT: "CTA Contact",
  CTA_TARIFS: "CTA Tarifs",
  DOWNLOAD_GUIDE_PDF: "Download Guide PDF",
  CLICK_EMAIL: "Click Email",
  CLICK_TELEPHONE: "Click Téléphone",
} as const;

export type PlausibleEventName = (typeof PLAUSIBLE_EVENTS)[keyof typeof PLAUSIBLE_EVENTS];

export function isPlausibleEnabled(): boolean {
  const flag = process.env.NEXT_PUBLIC_PLAUSIBLE_ENABLED?.trim().toLowerCase();
  if (flag === "false" || flag === "0") return false;
  if (flag === "true" || flag === "1") return true;
  return process.env.NODE_ENV === "production";
}

export function plausibleTrackProps(
  event: PlausibleEventName,
  location: string,
): Record<string, string> {
  return {
    [PLAUSIBLE_DATA_EVENT]: event,
    [PLAUSIBLE_DATA_LOCATION]: location,
  };
}

export function trackPlausible(
  event: PlausibleEventName,
  props?: Record<string, string | number | boolean>,
): void {
  if (typeof window === "undefined" || !isPlausibleEnabled()) return;
  const plausible = window.plausible;
  if (typeof plausible !== "function") return;
  plausible(event, props ? { props } : undefined);
}

type PlausibleFn = ((
  event: string,
  options?: { props?: Record<string, string | number | boolean> },
) => void) & {
  q?: unknown[][];
  init?: (options?: Record<string, unknown>) => void;
  o?: Record<string, unknown>;
};

declare global {
  interface Window {
    plausible?: PlausibleFn;
  }
}
