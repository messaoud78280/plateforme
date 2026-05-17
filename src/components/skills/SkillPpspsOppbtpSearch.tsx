"use client";

import { BookOpen, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { OppbtpKnowledgeEntry } from "@/content/ppsps-oppbtp-knowledge";

type Props = {
  query: string;
  taskIds: string[];
  onQueryChange: (q: string) => void;
  enabled: boolean;
  onEnabledChange: (v: boolean) => void;
};

type SearchHit = OppbtpKnowledgeEntry & { relevance: number };

export function SkillPpspsOppbtpSearch({ query, taskIds, onQueryChange, enabled, onEnabledChange }: Props) {
  const [results, setResults] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async () => {
    if (!enabled) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      if (taskIds.length) params.set("tasks", taskIds.join(","));
      const res = await fetch(`/api/skills/ppsps/oppbtp?${params.toString()}`);
      if (!res.ok) return;
      const data = (await res.json()) as { results: SearchHit[] };
      setResults(data.results ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query, taskIds, enabled]);

  useEffect(() => {
    const t = setTimeout(() => void search(), 350);
    return () => clearTimeout(t);
  }, [search]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="flex items-center gap-2 font-heading text-base font-bold text-slate-900">
        <BookOpen className="size-4 text-[#2563eb]" aria-hidden />
        Base prévention OPPBTP
      </h2>
      <label className="mt-3 flex cursor-pointer items-start gap-3 rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-3">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onEnabledChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#1e3a5f]"
        />
        <span className="text-sm text-slate-700">
          Intégrer les repères OPPBTP / INRS à la génération (recherche + tâches cochées).
        </span>
      </label>
      {enabled ? (
        <>
          <div className="relative mt-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm shadow-sm focus:border-[#2563eb]/50 focus:outline-none focus:ring-2 focus:ring-[#2563eb]/15"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Rechercher : échafaudage, fouille, DICT, EPI…"
            />
          </div>
          <div className="mt-3 max-h-48 space-y-2 overflow-y-auto">
            {loading ? (
              <p className="text-xs text-slate-500">Recherche…</p>
            ) : results.length ? (
              results.map((r) => (
                <div key={r.id} className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2 text-xs">
                  <p className="font-bold text-slate-800">{r.title}</p>
                  <p className="mt-0.5 text-slate-600 line-clamp-2">{r.content}</p>
                  <p className="mt-1 text-[10px] text-slate-400">{r.sourceLabel}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500">Aucun repère — cochez des tâches ou élargissez la recherche.</p>
            )}
          </div>
        </>
      ) : null}
    </section>
  );
}
