"use client";

import { useMemo, useState } from "react";
import { Camera } from "lucide-react";
import { cn } from "@/lib/cn";
import { PHOTO_CATEGORIES } from "@/lib/site-visits/survey-types";
import {
  VisitSectionCard,
  visitFieldClass,
} from "@/components/site-visits/VisitSectionCard";

export type GalleryPhoto = {
  id: string;
  name: string;
  caption: string | null;
  category?: string | null;
  observation?: string | null;
  zone?: string | null;
  fileUrl: string | null;
  createdAt?: string | null;
  measurementId?: string | null;
};

type Props = {
  photos: GalleryPhoto[];
  zones: string[];
  caption: string;
  category: string;
  observation: string;
  zone: string;
  measurementId: string;
  measurements: Array<{ id: string; zone: string | null; label: string }>;
  onCaption: (v: string) => void;
  onCategory: (v: string) => void;
  onObservation: (v: string) => void;
  onZone: (v: string) => void;
  onMeasurementId: (v: string) => void;
  onCapture: () => void;
  busy?: boolean;
};

export function VisitPhotoGallery({
  photos,
  zones,
  caption,
  category,
  observation,
  zone,
  measurementId,
  measurements,
  onCaption,
  onCategory,
  onObservation,
  onZone,
  onMeasurementId,
  onCapture,
  busy,
}: Props) {
  const [filterZone, setFilterZone] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return photos.filter((p) => {
      if (filterZone && (p.zone || "") !== filterZone) return false;
      if (filterCat && (p.category || "") !== filterCat) return false;
      return true;
    });
  }, [photos, filterZone, filterCat]);

  const selected = photos.find((p) => p.id === selectedId) ?? null;
  const catLabel = (id: string | null | undefined) =>
    PHOTO_CATEGORIES.find((c) => c.id === id)?.label ?? id ?? "";

  return (
    <VisitSectionCard
      tone="navy"
      icon={Camera}
      title="Photos terrain"
      hint="Capture rapide · légende + catégorie avant prise = dossier exploitable pour le devis"
    >
      <div className="space-y-3">
        <label className="block text-[12px] font-medium text-slate-500">
          Légende / contexte
          <input
            value={caption}
            onChange={(e) => onCaption(e.target.value)}
            placeholder="Ex. Décollement membrane en pied d’acrotère"
            className={visitFieldClass}
          />
        </label>

        <div>
          <p className="text-[12px] font-medium text-slate-500">Catégorie</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {PHOTO_CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onCategory(category === c.id ? "" : c.id)}
                className={cn(
                  "rounded-lg px-2.5 py-1.5 text-[12px] font-medium",
                  category === c.id
                    ? "bg-[#1e3a5f] text-white"
                    : "bg-slate-100 text-slate-700",
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <label className="block text-[12px] font-medium text-slate-500">
          Observation factuelle
          <input
            value={observation}
            onChange={(e) => onObservation(e.target.value)}
            placeholder="Constat visible — pas d’hypothèse"
            className={visitFieldClass}
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          {zones.length > 0 ? (
            <label className="block text-[12px] font-medium text-slate-500">
              Zone
              <select
                value={zone}
                onChange={(e) => onZone(e.target.value)}
                className={visitFieldClass}
              >
                <option value="">Visite entière</option>
                {zones.map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label className="block text-[12px] font-medium text-slate-500">
            Lier à un relevé
            <select
              value={measurementId}
              onChange={(e) => onMeasurementId(e.target.value)}
              className={visitFieldClass}
            >
              <option value="">Photo générale</option>
              {measurements.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.zone ? `${m.zone} — ` : ""}
                  {m.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <button
          type="button"
          disabled={busy}
          onClick={onCapture}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#1e3a5f] text-[15px] font-semibold text-white disabled:opacity-60"
        >
          <Camera className="h-5 w-5" strokeWidth={1.75} />
          Prendre / ajouter une photo
        </button>

        {(zones.length > 0 || photos.some((p) => p.category)) && photos.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={() => {
                setFilterZone("");
                setFilterCat("");
              }}
              className={cn(
                "rounded-full px-2.5 py-1 text-[11px] font-medium",
                !filterZone && !filterCat
                  ? "bg-[#1e3a5f] text-white"
                  : "bg-slate-100 text-slate-600",
              )}
            >
              Toutes ({photos.length})
            </button>
            {zones.map((z) => {
              const n = photos.filter((p) => p.zone === z).length;
              if (!n) return null;
              return (
                <button
                  key={z}
                  type="button"
                  onClick={() => setFilterZone(filterZone === z ? "" : z)}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[11px] font-medium",
                    filterZone === z ? "bg-[#1e3a5f] text-white" : "bg-slate-100 text-slate-600",
                  )}
                >
                  {z} ({n})
                </button>
              );
            })}
            {PHOTO_CATEGORIES.map((c) => {
              const n = photos.filter((p) => p.category === c.id).length;
              if (!n) return null;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setFilterCat(filterCat === c.id ? "" : c.id)}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[11px] font-medium",
                    filterCat === c.id ? "bg-amber-800 text-white" : "bg-amber-50 text-amber-900",
                  )}
                >
                  {c.label} ({n})
                </button>
              );
            })}
          </div>
        ) : null}

        {filtered.length === 0 ? (
          <p className="py-6 text-center text-[13px] text-slate-500">
            Aucune photo{filterZone || filterCat ? " pour ce filtre" : " — capturez l’existant avant de quitter le site"}
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {filtered.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(p.id)}
                  className="w-full overflow-hidden rounded-xl border border-slate-100 bg-slate-50 text-left"
                >
                  {p.fileUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.fileUrl}
                      alt={p.caption || p.name}
                      className="aspect-square w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-square items-center justify-center text-[11px] text-slate-400">
                      Photo
                    </div>
                  )}
                  <div className="space-y-0.5 px-2 py-1.5">
                    <p className="truncate text-[11px] font-medium text-slate-700">
                      {p.caption || p.name}
                    </p>
                    <p className="truncate text-[10px] text-slate-500">
                      {[p.zone, catLabel(p.category)].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}

        {selected ? (
          <div className="rounded-xl border border-[#1e3a5f]/15 bg-[#1e3a5f]/5 p-3">
            <div className="flex gap-3">
              {selected.fileUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selected.fileUrl}
                  alt={selected.caption || selected.name}
                  className="h-24 w-24 shrink-0 rounded-lg object-cover"
                />
              ) : null}
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-[#1e3a5f]">
                  {selected.caption || selected.name}
                </p>
                {selected.observation ? (
                  <p className="mt-1 text-[12px] text-slate-700">{selected.observation}</p>
                ) : (
                  <p className="mt-1 text-[12px] text-amber-800">
                    Pas d’observation factuelle — à compléter au prochain passage si besoin
                  </p>
                )}
                <p className="mt-1 text-[11px] text-slate-500">
                  {[selected.zone, catLabel(selected.category)]
                    .filter(Boolean)
                    .join(" · ") || "Sans zone / catégorie"}
                  {selected.createdAt
                    ? ` · ${new Date(selected.createdAt).toLocaleString("fr-FR")}`
                    : ""}
                </p>
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  className="mt-2 text-[12px] font-medium text-[#1e3a5f] hover:underline"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </VisitSectionCard>
  );
}
