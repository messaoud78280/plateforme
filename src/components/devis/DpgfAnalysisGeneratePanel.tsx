"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { generateDpgfAnalysisSheetWithAi } from "@/app/dashboard/devis/analyse-dpgf-actions";
import { DPGF_ANALYSIS_SOURCE_LABELS } from "@/lib/dpgf-analysis/labels";

type Props = { aiAvailable?: boolean; embedded?: boolean };

export function DpgfAnalysisGeneratePanel({ aiAvailable = false, embedded = false }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <section
      className={
        embedded
          ? ""
          : "rounded-2xl border border-[#1e3a5f]/15 bg-gradient-to-br from-[#eff6ff]/50 to-white p-6 shadow-sm"
      }
    >
      {!embedded ? (
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#1e3a5f]">Analyse pédagogique IA</p>
      ) : null}
      <h2 className={`font-heading text-lg font-bold text-slate-900 ${embedded ? "" : "mt-1"}`}>
        Analyser une ligne DPGF
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        Collez une désignation DPGF pour générer une fiche de compréhension — sans prix, sans chiffrage. La fiche est
        créée en statut <strong>À vérifier</strong>.
      </p>

      {!aiAvailable ? (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          Génération IA indisponible : configurez <code className="text-xs">OPENAI_API_KEY</code> sur le serveur.
        </p>
      ) : null}

      <form
        className="mt-4 space-y-4"
        action={(fd) => {
          setError(null);
          startTransition(async () => {
            const res = await generateDpgfAnalysisSheetWithAi(fd);
            if (res.ok) router.push(`/dashboard/devis/analyse-dpgf/${res.id}/modifier`);
            else setError(res.error);
          });
        }}
      >
        <div>
          <label htmlFor="originalDesignation" className="text-xs font-semibold text-slate-700">
            Désignation DPGF d&apos;origine *
          </label>
          <textarea
            id="originalDesignation"
            name="originalDesignation"
            required
            rows={3}
            placeholder="Ex. Cloison distributive 72/48 mm, parement BA13 des deux côtés, ossature métallique…"
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Lot" name="lot" placeholder="Ex. Cloisons / doublages" />
          <Field label="Unité" name="unit" placeholder="m², ml, u…" defaultValue="m²" />
          <div>
            <label htmlFor="source" className="text-xs font-semibold text-slate-700">
              Source
            </label>
            <select id="source" name="source" defaultValue="dpgf" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
              {Object.entries(DPGF_ANALYSIS_SOURCE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="context" className="text-xs font-semibold text-slate-700">
            Contexte marché (optionnel)
          </label>
          <textarea
            id="context"
            name="context"
            rows={2}
            placeholder="Type de marché, lot concerné, contraintes site, pièces DCE disponibles…"
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Réf. CCTP (lien)" name="linkCctp" placeholder="Article CCTP si connu" />
          <Field label="Réf. plan (lien)" name="linkPlan" placeholder="Plan / détail si connu" />
        </div>

        {error ? <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p> : null}

        <button
          type="submit"
          disabled={pending || !aiAvailable}
          className="rounded-xl bg-[#1e3a5f] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#162d4a] disabled:opacity-50"
        >
          {pending ? "Analyse en cours…" : "Générer la fiche pédagogique"}
        </button>
      </form>
    </section>
  );
}

function Field({
  label,
  name,
  placeholder,
  defaultValue,
}: {
  label: string;
  name: string;
  placeholder?: string;
  defaultValue?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="text-xs font-semibold text-slate-700">
        {label}
      </label>
      <input
        id={name}
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
      />
    </div>
  );
}
