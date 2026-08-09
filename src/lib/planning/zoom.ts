/**
 * PLANNING-V2A — densités zoom (pas de transform:scale).
 */
export const PLANNING_ZOOM_LEVELS = [80, 90, 100, 110, 120, 130] as const;
export type PlanningZoomLevel = (typeof PLANNING_ZOOM_LEVELS)[number];

export const DEFAULT_PLANNING_ZOOM: PlanningZoomLevel = 100;
const STORAGE_KEY = "bework-planning-zoom-v1";
const WORKDAYS_KEY = "bework-planning-workdays-v1";

export function clampPlanningZoom(n: number): PlanningZoomLevel {
  let best: PlanningZoomLevel = DEFAULT_PLANNING_ZOOM;
  let bestDist = Infinity;
  for (const z of PLANNING_ZOOM_LEVELS) {
    const d = Math.abs(z - n);
    if (d < bestDist) {
      bestDist = d;
      best = z;
    }
  }
  return best;
}

export function readPlanningZoom(): PlanningZoomLevel {
  if (typeof window === "undefined") return DEFAULT_PLANNING_ZOOM;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PLANNING_ZOOM;
    return clampPlanningZoom(Number(raw));
  } catch {
    return DEFAULT_PLANNING_ZOOM;
  }
}

export function writePlanningZoom(zoom: PlanningZoomLevel): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, String(zoom));
  } catch {
    /* ignore */
  }
}

export function nextPlanningZoom(current: PlanningZoomLevel): PlanningZoomLevel | null {
  const i = PLANNING_ZOOM_LEVELS.indexOf(current);
  if (i < 0 || i >= PLANNING_ZOOM_LEVELS.length - 1) return null;
  return PLANNING_ZOOM_LEVELS[i + 1]!;
}

export function prevPlanningZoom(current: PlanningZoomLevel): PlanningZoomLevel | null {
  const i = PLANNING_ZOOM_LEVELS.indexOf(current);
  if (i <= 0) return null;
  return PLANNING_ZOOM_LEVELS[i - 1]!;
}

/** Hauteur min cellule (px) @ zoom. */
export function planningCellMinPx(zoom: PlanningZoomLevel): number {
  return Math.round(88 * (zoom / 100));
}

export function planningRowPadPx(zoom: PlanningZoomLevel): number {
  return Math.round(8 * (zoom / 100));
}

export function planningBlockTextPx(zoom: PlanningZoomLevel): { site: number; meta: number } {
  return {
    site: Math.round(11 * (zoom / 100)),
    meta: Math.round(10 * (zoom / 100)),
  };
}

export type PlanningWorkDays = 5 | 6 | 7;

export function readPlanningWorkDays(): PlanningWorkDays {
  if (typeof window === "undefined") return 5;
  try {
    const raw = localStorage.getItem(WORKDAYS_KEY);
    const n = Number(raw);
    if (n === 5 || n === 6 || n === 7) return n;
  } catch {
    /* ignore */
  }
  return 5;
}

export function writePlanningWorkDays(n: PlanningWorkDays): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(WORKDAYS_KEY, String(n));
  } catch {
    /* ignore */
  }
}
