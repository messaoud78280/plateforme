"use client";

import { useEffect, useState } from "react";
import {
  applyUiPreferencesToDom,
  DEFAULT_UI_PREFERENCES,
  readUiPreferences,
  writeUiPreferences,
  type UiDensity,
  type UiListView,
  type UiPreferences,
} from "@/lib/ui-preferences";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { Button } from "@/components/ui/Button";

export function UiPreferencesProvider({
  userId,
  children,
}: {
  userId: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!isFeatureEnabled("uiPreferences")) return;
    applyUiPreferencesToDom(readUiPreferences(userId));
  }, [userId]);

  return <>{children}</>;
}

export function UiPreferencesPanel({ userId }: { userId: string }) {
  const [prefs, setPrefs] = useState<UiPreferences>(DEFAULT_UI_PREFERENCES);
  const enabled = isFeatureEnabled("uiPreferences");

  useEffect(() => {
    setPrefs(readUiPreferences(userId));
  }, [userId]);

  if (!enabled) {
    return <p className="text-sm text-bework-muted">Préférences d’affichage désactivées (feature flag).</p>;
  }

  function update(partial: Partial<UiPreferences>) {
    const next = { ...prefs, ...partial };
    setPrefs(next);
    writeUiPreferences(userId, next);
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-bework-muted">Densité</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {(["comfortable", "compact"] as UiDensity[]).map((d) => (
            <Button
              key={d}
              type="button"
              size="sm"
              variant={prefs.density === d ? "primary" : "secondary"}
              onClick={() => update({ density: d })}
            >
              {d === "comfortable" ? "Confortable" : "Compacte"}
            </Button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-bework-muted">Vue listes</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {(["table", "cards"] as UiListView[]).map((v) => (
            <Button
              key={v}
              type="button"
              size="sm"
              variant={prefs.listView === v ? "primary" : "secondary"}
              onClick={() => update({ listView: v })}
            >
              {v === "table" ? "Tableau" : "Cartes"}
            </Button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-xs font-bold uppercase tracking-wide text-bework-muted">
          Page de démarrage
          <input
            className="mt-1 w-full rounded-[var(--cc-radius)] border border-[color:var(--cc-chrome-border)] px-3 py-2 text-sm font-normal"
            value={prefs.startPage}
            onChange={(e) => update({ startPage: e.target.value })}
            placeholder="/dashboard"
          />
        </label>
        <p className="mt-1 text-[11px] text-bework-muted">
          Enregistré uniquement pour votre compte sur cet appareil. Colonnes / filtres par surface : à brancher
          progressivement sur chaque liste.
        </p>
      </div>
    </div>
  );
}
