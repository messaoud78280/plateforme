"use client";

import { useCallback, useState } from "react";
import {
  parseStructuredWorkItemPaste,
  type StructuredPasteFormValues,
} from "@/lib/be-work-devis-structured-paste";

type Props = {
  onApplyValues: (values: StructuredPasteFormValues) => void;
  onClearForm: () => void;
};

export function WorkItemStructuredPastePanel({ onApplyValues, onClearForm }: Props) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  const handlePrefill = useCallback(() => {
    setError(null);
    setSuccess(null);
    setWarnings([]);
    const result = parseStructuredWorkItemPaste(text);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onApplyValues(result.values);
    setWarnings(result.warnings);
    setSuccess("Formulaire prérempli. Relisez les champs puis enregistrez quand vous êtes prêt.");
  }, [text, onApplyValues]);

  const handleClear = useCallback(() => {
    setText("");
    setError(null);
    setSuccess(null);
    setWarnings([]);
    onClearForm();
  }, [onClearForm]);

  return (
    <section className="rounded-2xl border border-dashed border-[#1e3a5f]/35 bg-[#f8fafc] p-5 shadow-sm">
      <h2 className="font-heading text-base font-bold text-slate-900">Ajout rapide depuis données structurées</h2>
      <p className="mt-2 text-sm text-slate-600">
        Collez un objet JSON (comme celui fourni par ChatGPT). Les champs reconnus remplacent le contenu actuel du
        formulaire ci-dessous ; rien n’est enregistré tant que vous n’avez pas cliqué sur « Créer l’ouvrage ».
      </p>
      <details className="mt-3 text-sm text-slate-600">
        <summary className="cursor-pointer font-semibold text-[#1e3a5f] hover:underline">Voir un exemple de bloc</summary>
        <pre className="mt-2 max-h-48 overflow-auto rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-800">
{`{
  "code": "BW-CAR-001",
  "lot": "Carrelage",
  "title": "Carrelage grès cérame 60×60",
  "unit": "m²",
  "qualityLevel": "standard",
  "status": "a_verifier"
}`}
        </pre>
      </details>

      <label htmlFor="structured-paste-json" className="mt-4 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        Données collées
      </label>
      <textarea
        id="structured-paste-json"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={12}
        spellCheck={false}
        placeholder={'{\n  "code": "BW-…",\n  "lot": "…"\n}'}
        className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 font-mono text-sm leading-relaxed text-slate-900 shadow-inner focus:border-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20"
      />

      {error ? (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900" role="alert">
          {error}
        </p>
      ) : null}

      {success ? (
        <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{success}</p>
      ) : null}

      {warnings.length > 0 ? (
        <ul className="mt-3 list-inside list-disc rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          {warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handlePrefill}
          className="rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#152a45]"
        >
          Préremplir le formulaire
        </button>
        <button
          type="button"
          onClick={handleClear}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
        >
          Vider
        </button>
      </div>
    </section>
  );
}
