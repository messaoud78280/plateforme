"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { Package, Plus, Search } from "lucide-react";
import type { CatalogMaterialListItem } from "@/lib/catalog/types";

type Props = {
  initialItems: CatalogMaterialListItem[];
  initialTotal: number;
  initialFamilies: string[];
  initialQ: string;
  initialFamily: string;
  canWrite: boolean;
};

export function CatalogMateriauxClient({
  initialItems,
  initialTotal,
  initialFamilies,
  initialQ,
  initialFamily,
  canWrite,
}: Props) {
  const [items, setItems] = useState(initialItems);
  const [total, setTotal] = useState(initialTotal);
  const [families, setFamilies] = useState(initialFamilies);
  const [q, setQ] = useState(initialQ);
  const [family, setFamily] = useState(initialFamily);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [draftFamily, setDraftFamily] = useState("");
  const [draftDesignation, setDraftDesignation] = useState("");
  const [draftUnit, setDraftUnit] = useState("U");
  const [dupHint, setDupHint] = useState<string | null>(null);

  const load = useCallback(
    async (opts?: { q?: string; family?: string }) => {
      setBusy(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        const qq = opts?.q ?? q;
        const ff = opts?.family ?? family;
        if (qq.trim()) params.set("q", qq.trim());
        if (ff.trim()) params.set("family", ff.trim());
        const res = await fetch(`/api/catalogue-materiaux?${params}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erreur chargement");
        setItems(data.items ?? []);
        setTotal(data.total ?? 0);
        setFamilies(data.families ?? []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur");
      } finally {
        setBusy(false);
      }
    },
    [q, family],
  );

  const familyOptions = useMemo(() => {
    const set = new Set(families);
    if (family) set.add(family);
    return Array.from(set).sort((a, b) => a.localeCompare(b, "fr"));
  }, [families, family]);

  async function createMaterial(forceCreate = false) {
    setBusy(true);
    setError(null);
    setDupHint(null);
    try {
      const res = await fetch("/api/catalogue-materiaux", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          family: draftFamily.trim(),
          designation: draftDesignation.trim(),
          unit: draftUnit.trim() || "U",
          status: "ACTIVE",
          forceCreate,
        }),
      });
      const data = await res.json();
      if (res.status === 409 && data.code === "DUPLICATE") {
        setDupHint(
          "Une fiche similaire existe déjà. Ouvrez-la ou confirmez une création distincte.",
        );
        return;
      }
      if (!res.ok) throw new Error(data.error || "Création impossible");
      setCreateOpen(false);
      setDraftFamily("");
      setDraftDesignation("");
      setDraftUnit("U");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#1e3a5f] sm:text-2xl">
            Catalogue Matériaux
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Référentiel permanent de votre organisation — distinct de la
            bibliothèque d’ouvrages. Les prix et produits commerciaux seront
            enrichis depuis les Approvisionnements (phases suivantes).
          </p>
        </div>
        {canWrite ? (
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#1e3a5f] px-3 py-2 text-sm font-semibold text-white"
          >
            <Plus className="h-4 w-4" />
            Nouvelle fiche
          </button>
        ) : null}
      </header>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void load({ q });
            }}
            placeholder="Rechercher désignation, fabricant, référence…"
            className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm"
          />
        </div>
        <select
          value={family}
          onChange={(e) => {
            setFamily(e.target.value);
            void load({ family: e.target.value });
          }}
          className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
          aria-label="Filtrer par famille"
        >
          <option value="">Toutes les familles</option>
          {familyOptions.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={busy}
          onClick={() => void load()}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700"
        >
          Rechercher
        </button>
      </div>

      {error ? (
        <p className="mt-3 text-sm font-medium text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {busy ? "Chargement…" : `${total} fiche${total > 1 ? "s" : ""}`}
      </p>

      {!busy && items.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-14 text-center">
          <Package className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-semibold text-slate-800">
            Aucun matériau dans votre catalogue
          </p>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
            Créez une fiche générique (ex. « Bloc béton creux 20 cm ») ou
            capitalisez plus tard depuis une étude d’approvisionnement chantier.
          </p>
          {canWrite ? (
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="mt-4 rounded-xl bg-[#1e3a5f] px-3 py-2 text-sm font-semibold text-white"
            >
              Créer la première fiche
            </button>
          ) : null}
        </div>
      ) : (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((m) => (
            <li key={m.id}>
              <Link
                href={`/dashboard/catalogue-materiaux/${m.id}`}
                className="block h-full rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-[#1e3a5f]/30 hover:shadow-sm"
              >
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  {m.family}
                </p>
                <p className="mt-1 text-sm font-bold text-slate-900">
                  {m.designation}
                </p>
                <p className="mt-2 text-xs text-slate-600">
                  Unité {m.unit}
                  {" · "}
                  {m.productCount} produit{m.productCount > 1 ? "s" : ""}
                  {" · "}
                  {m.offerCount} offre{m.offerCount > 1 ? "s" : ""}
                </p>
                {m.description ? (
                  <p className="mt-2 line-clamp-2 text-xs text-slate-500">
                    {m.description}
                  </p>
                ) : (
                  <p className="mt-2 text-xs italic text-slate-400">
                    Sans description
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {createOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <h2 className="text-base font-bold text-slate-900">
              Nouvelle fiche matériau
            </h2>
            <p className="mt-1 text-[11px] text-slate-500">
              Fiche générique — pas de prix inventé. Les produits fournisseurs
              s’ajoutent ensuite.
            </p>
            <div className="mt-4 space-y-3">
              <label className="block space-y-1 text-sm">
                <span className="text-xs font-bold uppercase text-slate-500">
                  Famille *
                </span>
                <input
                  value={draftFamily}
                  onChange={(e) => setDraftFamily(e.target.value)}
                  placeholder="Ex. Maçonnerie"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2"
                  list="catalog-families"
                />
                <datalist id="catalog-families">
                  {familyOptions.map((f) => (
                    <option key={f} value={f} />
                  ))}
                </datalist>
              </label>
              <label className="block space-y-1 text-sm">
                <span className="text-xs font-bold uppercase text-slate-500">
                  Désignation *
                </span>
                <input
                  value={draftDesignation}
                  onChange={(e) => setDraftDesignation(e.target.value)}
                  placeholder="Ex. Bloc béton creux 20 cm"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2"
                />
              </label>
              <label className="block space-y-1 text-sm">
                <span className="text-xs font-bold uppercase text-slate-500">
                  Unité
                </span>
                <input
                  value={draftUnit}
                  onChange={(e) => setDraftUnit(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2"
                />
              </label>
            </div>
            {dupHint ? (
              <p className="mt-3 text-xs font-medium text-amber-800">{dupHint}</p>
            ) : null}
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setCreateOpen(false);
                  setDupHint(null);
                }}
                className="text-xs font-semibold text-slate-600"
              >
                Annuler
              </button>
              {dupHint ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void createMaterial(true)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-800"
                >
                  Créer quand même
                </button>
              ) : null}
              <button
                type="button"
                disabled={
                  busy || !draftFamily.trim() || !draftDesignation.trim()
                }
                onClick={() => void createMaterial(false)}
                className="rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
