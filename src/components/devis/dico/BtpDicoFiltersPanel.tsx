"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { BTP_DICO_CATEGORIES, BTP_DICO_CATEGORY_LABELS, BTP_DICO_LEVELS, BTP_DICO_STATUSES } from "@/lib/btp-dico/labels";
import { BTP_DICO_LOTS } from "@/lib/btp-dico/lots";

const LIST_PATH = "/dashboard/devis/dico-btp";

export function BtpDicoFiltersPanel() {
  const router = useRouter();
  const sp = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(sp.get("q") ?? "");

  useEffect(() => {
    setQ(sp.get("q") ?? "");
  }, [sp]);

  const currentLot = sp.get("lot") ?? "";
  const currentCategory = sp.get("category") ?? "";
  const currentLevel = sp.get("level") ?? "";
  const currentStatus = sp.get("status") ?? "";
  const onlyAcronyms = sp.get("acronyms") === "1";

  const pushParams = useCallback(
    (mutate: (p: URLSearchParams) => void) => {
      const params = new URLSearchParams(sp.toString());
      mutate(params);
      params.delete("letter");
      const qs = params.toString();
      startTransition(() => router.push(qs ? `${LIST_PATH}?${qs}` : LIST_PATH));
    },
    [router, sp],
  );

  const setParam = useCallback(
    (key: string, value: string) => {
      pushParams((p) => {
        if (value) p.set(key, value);
        else p.delete(key);
      });
    },
    [pushParams],
  );

  const submitSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setParam("q", q.trim());
    },
    [q, setParam],
  );

  const hasFilters = Boolean(
    sp.get("q") || currentLot || currentCategory || currentLevel || currentStatus || onlyAcronyms,
  );

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-heading text-sm font-bold text-slate-900">Rechercher et filtrer</h2>
        {hasFilters ? (
          <button
            type="button"
            onClick={() => startTransition(() => router.push(LIST_PATH))}
            className="text-xs font-semibold text-slate-500 hover:text-[#1e3a5f]"
          >
            Réinitialiser
          </button>
        ) : null}
      </div>

      <form onSubmit={submitSearch} className="mt-3">
        <div className="flex gap-2">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher un terme, un acronyme, une définition, un mot-clé…"
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none focus:border-[#1e3a5f] focus:bg-white focus:ring-2 focus:ring-[#1e3a5f]/15"
          />
          <button
            type="submit"
            disabled={pending}
            className="h-11 shrink-0 rounded-xl bg-[#1e3a5f] px-5 text-sm font-semibold text-white hover:bg-[#162d4a] disabled:opacity-50"
          >
            Rechercher
          </button>
        </div>
      </form>

      <div className="mt-4">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">Filtrer par lot</p>
        <div className="flex flex-wrap gap-1.5">
          <Pill active={!currentLot} onClick={() => setParam("lot", "")}>
            Tous les lots
          </Pill>
          {BTP_DICO_LOTS.map((lot) => (
            <Pill key={lot.code} active={currentLot === lot.code} onClick={() => setParam("lot", lot.code)}>
              <span className="font-mono">{lot.code}</span> {lot.name}
            </Pill>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">Catégorie</p>
        <div className="flex flex-wrap gap-1.5">
          <Pill active={!currentCategory && !onlyAcronyms} onClick={() => { setParam("category", ""); if (onlyAcronyms) setParam("acronyms", ""); }}>
            Toutes
          </Pill>
          <Pill active={onlyAcronyms} onClick={() => setParam("acronyms", onlyAcronyms ? "" : "1")}>
            Acronymes uniquement
          </Pill>
          {BTP_DICO_CATEGORIES.map((cat) => (
            <Pill key={cat} active={currentCategory === cat} onClick={() => setParam("category", currentCategory === cat ? "" : cat)}>
              {BTP_DICO_CATEGORY_LABELS[cat]}
            </Pill>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">Niveau</span>
          <select
            value={currentLevel}
            onChange={(e) => setParam("level", e.target.value)}
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-[#1e3a5f]"
          >
            <option value="">Tous niveaux</option>
            {BTP_DICO_LEVELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">Statut</span>
          <select
            value={currentStatus}
            onChange={(e) => setParam("status", e.target.value)}
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-[#1e3a5f]"
          >
            <option value="">Tous statuts</option>
            {BTP_DICO_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "rounded-full bg-[#1e3a5f] px-3 py-1.5 text-xs font-semibold text-white shadow-sm"
          : "rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
      }
    >
      {children}
    </button>
  );
}
