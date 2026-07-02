"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";

const LIST_PATH = "/dashboard/devis/dico-btp";

export function BtpDicoSearchBar() {
  const router = useRouter();
  const sp = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(sp.get("q") ?? "");

  useEffect(() => {
    setQ(sp.get("q") ?? "");
  }, [sp]);

  const applyQuery = useCallback(
    (value: string) => {
      const params = new URLSearchParams(sp.toString());
      const v = value.trim();
      if (v) params.set("q", v);
      else params.delete("q");
      params.delete("letter");
      const qs = params.toString();
      startTransition(() => router.push(qs ? `${LIST_PATH}?${qs}` : LIST_PATH));
    },
    [router, sp],
  );

  const submit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      applyQuery(q);
    },
    [applyQuery, q],
  );

  return (
    <form onSubmit={submit} className="flex gap-2">
      <div className="relative flex-1">
        <svg
          aria-hidden
          viewBox="0 0 20 20"
          fill="none"
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          style={{ height: 18, width: 18 }}
        >
          <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.8" />
          <path d="m14 14 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher un terme, un acronyme, une définition, un mot-clé…"
          className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-11 text-sm text-slate-800 shadow-sm outline-none transition focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/15"
        />
        {q ? (
          <button
            type="button"
            onClick={() => {
              setQ("");
              applyQuery("");
            }}
            aria-label="Effacer la recherche"
            className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        ) : null}
      </div>
      <button
        type="submit"
        disabled={pending}
        className="h-12 shrink-0 rounded-2xl bg-[#1e3a5f] px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-[#162d4a] disabled:opacity-50"
      >
        Rechercher
      </button>
    </form>
  );
}
