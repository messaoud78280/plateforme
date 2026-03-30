"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const DEFAULT_SUGGESTIONS: { label: string; estimatedMinutes: number }[] = [
  { label: "Relancer factures impayées", estimatedMinutes: 30 },
  { label: "Préparer devis clients", estimatedMinutes: 45 },
  { label: "Rechercher fournisseurs", estimatedMinutes: 30 },
];

export function CopiloteAdmin() {
  const router = useRouter();
  const [delegating, setDelegating] = useState<string | null>(null);
  const [showIa, setShowIa] = useState(false);
  const [situation, setSituation] = useState("");
  const [iaLoading, setIaLoading] = useState(false);
  const [iaSuggestions, setIaSuggestions] = useState<{ label: string; estimatedMinutes: number }[] | null>(null);
  const [iaError, setIaError] = useState("");

  const handleDeleguer = async (label: string) => {
    setDelegating(label);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: label }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDelegating(null);
        return;
      }
      setDelegating(null);
      router.refresh();
      if (data?.id) router.push(`/dashboard/taches/${data.id}`);
    } catch {
      setDelegating(null);
    }
  };

  const handleAskIa = async () => {
    const text = situation.trim();
    if (!text) {
      setIaError("Décrivez brièvement votre situation.");
      return;
    }
    setIaError("");
    setIaLoading(true);
    setIaSuggestions(null);
    try {
      const res = await fetch("/api/copilot/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ situation: text }),
      });
      const data = await res.json();
      if (!res.ok) {
        setIaError(data?.error ?? "Erreur lors de la recherche de suggestions.");
        setIaLoading(false);
        return;
      }
      setIaSuggestions(data.suggestions ?? []);
    } catch {
      setIaError("Erreur de connexion.");
    }
    setIaLoading(false);
  };

  return (
    <section className="rounded-2xl surface-metallic-light p-6">
      <h2 className="text-lg font-semibold text-slate-800">Copilote administratif</h2>
      <p className="mt-0.5 text-sm text-slate-500">
        Identifiez les dossiers à prioriser et à déléguer dans le cadre du forfait.
      </p>

      <ul className="mt-4 space-y-3">
        {DEFAULT_SUGGESTIONS.map((item) => (
          <li
            key={item.label}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50/50 px-4 py-3 sm:flex-nowrap"
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium text-slate-800">{item.label}</p>
              <p className="mt-0.5 text-xs text-slate-500">
                ≈ {item.estimatedMinutes} minutes économisées
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleDeleguer(item.label)}
              disabled={delegating !== null}
              className="shrink-0 rounded-lg bg-[#1d4ed8] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#1e40af] disabled:opacity-60"
            >
              {delegating === item.label ? "Envoi…" : "Déléguer en 1 clic"}
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-6 border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={() => setShowIa((v) => !v)}
          className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          {showIa ? "Masquer" : "Demander à l'IA quoi déléguer"}
        </button>

        {showIa && (
          <div className="mt-4 space-y-3">
            <textarea
              value={situation}
              onChange={(e) => setSituation(e.target.value)}
              placeholder="Ex : J'ai beaucoup de factures en retard à relancer et des devis à préparer pour la fin du mois..."
              rows={3}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:border-[#1d4ed8] focus:outline-none focus:ring-1 focus:ring-[#1d4ed8]"
            />
            <button
              type="button"
              onClick={handleAskIa}
              disabled={iaLoading}
              className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
            >
              {iaLoading ? "Recherche…" : "Obtenir des suggestions"}
            </button>
            {iaError && <p className="text-sm text-red-600">{iaError}</p>}
            {iaSuggestions && iaSuggestions.length > 0 && (
              <ul className="mt-3 space-y-2">
                {iaSuggestions.map((s) => (
                  <li
                    key={s.label}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 bg-white px-3 py-2 sm:flex-nowrap"
                  >
                    <div>
                      <p className="font-medium text-slate-800">{s.label}</p>
                      <p className="text-xs text-slate-500">≈ {s.estimatedMinutes} min économisées</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleguer(s.label)}
                      disabled={delegating !== null}
                      className="shrink-0 rounded bg-[#1d4ed8] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1e40af] disabled:opacity-60"
                    >
                      {delegating === s.label ? "Envoi…" : "Déléguer en 1 clic"}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
