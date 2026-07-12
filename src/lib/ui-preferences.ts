/**
 * Préférences d’affichage par utilisateur (client-side, localStorage).
 * Ne modifient jamais l’affichage des autres utilisateurs.
 */

export type UiDensity = "comfortable" | "compact";
export type UiListView = "table" | "cards";

export type UiPreferences = {
  density: UiDensity;
  listView: UiListView;
  startPage: string;
  /** Réservé — colonnes / filtres par surface */
  surfaces: Record<
    string,
    {
      columns?: string[];
      columnOrder?: string[];
      savedFilters?: string;
      panelOpen?: boolean;
    }
  >;
};

export const DEFAULT_UI_PREFERENCES: UiPreferences = {
  density: "comfortable",
  listView: "table",
  startPage: "/dashboard",
  surfaces: {},
};

export function uiPreferencesStorageKey(userId: string): string {
  return `bework-ui-prefs-v1-${userId}`;
}

export function readUiPreferences(userId: string): UiPreferences {
  if (typeof window === "undefined") return DEFAULT_UI_PREFERENCES;
  try {
    const raw = localStorage.getItem(uiPreferencesStorageKey(userId));
    if (!raw) return DEFAULT_UI_PREFERENCES;
    return { ...DEFAULT_UI_PREFERENCES, ...(JSON.parse(raw) as Partial<UiPreferences>) };
  } catch {
    return DEFAULT_UI_PREFERENCES;
  }
}

export function writeUiPreferences(userId: string, prefs: UiPreferences): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(uiPreferencesStorageKey(userId), JSON.stringify(prefs));
    applyUiPreferencesToDom(prefs);
  } catch {
    /* ignore quota */
  }
}

export function applyUiPreferencesToDom(prefs: UiPreferences): void {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.density = prefs.density;
  document.documentElement.dataset.listView = prefs.listView;
}
