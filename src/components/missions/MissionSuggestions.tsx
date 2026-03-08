"use client";

import { useState, useEffect, useRef } from "react";

type Suggestion = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
};

type MissionSuggestionsProps = {
  onSelect: (title: string, description: string, category: string) => void;
  searchQuery?: string;
};

export function MissionSuggestions({ onSelect, searchQuery = "" }: MissionSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setLoading(true);
      const q = searchQuery.trim();
      const url = q ? `/api/missions/suggestions?q=${encodeURIComponent(q)}` : "/api/missions/suggestions";
      fetch(url)
        .then((res) => res.json())
        .then((data) => (Array.isArray(data) ? setSuggestions(data) : []))
        .catch(() => setSuggestions([]))
        .finally(() => setLoading(false));
    }, 400);
    return () => { if (timeoutRef.current != null) clearTimeout(timeoutRef.current); };
  }, [searchQuery]);

  if (suggestions.length === 0) return null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-base font-semibold text-slate-800 mb-2">
        Suggestions basées sur vos missions passées
      </h2>
      <p className="text-sm text-slate-500 mb-4">
        Cliquez sur une mission pour la pré-remplir automatiquement.
      </p>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() =>
              onSelect(
                s.title,
                s.description ?? "",
                s.category ?? ""
              )
            }
            className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 hover:border-[#1d4ed8] hover:bg-blue-50/50 hover:text-[#1d4ed8] transition"
          >
            {s.title}
          </button>
        ))}
      </div>
    </section>
  );
}
