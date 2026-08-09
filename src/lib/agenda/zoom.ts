/**
 * AGENDA-V2B.2 — Densité / zoom affichage (pas de transform:scale).
 * Persistance localStorage — aucune requête serveur.
 */

export const AGENDA_ZOOM_LEVELS = [80, 90, 100, 110, 120, 130] as const;
export type AgendaZoomLevel = (typeof AGENDA_ZOOM_LEVELS)[number];

export const DEFAULT_AGENDA_ZOOM: AgendaZoomLevel = 100;

const STORAGE_KEY = "bework-agenda-zoom-v1";

/** Hauteur d’une heure (Jour/Semaine) — base 64 px @ 100 %. */
export function agendaHourPx(zoom: AgendaZoomLevel): number {
  return Math.round(64 * (zoom / 100));
}

/** Nombre d’événements visibles en vue Mois desktop. */
export function agendaMonthMaxEvents(zoom: AgendaZoomLevel): number {
  return zoom >= 120 ? 3 : 2;
}

export function clampAgendaZoom(n: number): AgendaZoomLevel {
  let best: AgendaZoomLevel = DEFAULT_AGENDA_ZOOM;
  let bestDist = Infinity;
  for (const z of AGENDA_ZOOM_LEVELS) {
    const d = Math.abs(z - n);
    if (d < bestDist) {
      bestDist = d;
      best = z;
    }
  }
  return best;
}

export function readAgendaZoom(): AgendaZoomLevel {
  if (typeof window === "undefined") return DEFAULT_AGENDA_ZOOM;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_AGENDA_ZOOM;
    const n = Number(raw);
    if (!Number.isFinite(n)) return DEFAULT_AGENDA_ZOOM;
    return clampAgendaZoom(n);
  } catch {
    return DEFAULT_AGENDA_ZOOM;
  }
}

export function writeAgendaZoom(zoom: AgendaZoomLevel): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, String(zoom));
  } catch {
    /* ignore */
  }
}

export function nextAgendaZoom(current: AgendaZoomLevel): AgendaZoomLevel | null {
  const i = AGENDA_ZOOM_LEVELS.indexOf(current);
  if (i < 0 || i >= AGENDA_ZOOM_LEVELS.length - 1) return null;
  return AGENDA_ZOOM_LEVELS[i + 1]!;
}

export function prevAgendaZoom(current: AgendaZoomLevel): AgendaZoomLevel | null {
  const i = AGENDA_ZOOM_LEVELS.indexOf(current);
  if (i <= 0) return null;
  return AGENDA_ZOOM_LEVELS[i - 1]!;
}
