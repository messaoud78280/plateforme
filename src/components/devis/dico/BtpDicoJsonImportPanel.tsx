"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { importBtpDicoJson, previewBtpDicoImport } from "@/app/dashboard/devis/dico-btp-actions";
import type { BtpDicoDuplicateMode, BtpDicoPreviewResult } from "@/lib/btp-dico/json-io";

const SAMPLE = `[
  {
    "terme": "ETEL",
    "acronyme": "Espace Technique Électrique du Logement",
    "lot": "09 - Électricité CFO CFA",
    "famille": "Distribution électrique",
    "definition_courte": "Volume réservé aux équipements électriques et de communication dans un logement.",
    "explication_pedagogique": "L'ETEL regroupe la GTL, le tableau électrique et les arrivées de communication.",
    "exemple_utilisation": "Dans un CCTP, on peut demander un ETEL conforme à la NF C 15-100.",
    "mots_cles": ["électricité", "GTL", "NF C 15-100"],
    "synonymes": ["espace technique"],
    "points_vigilance": ["Respecter les dimensions minimales"],
    "documents_lies": ["CCTP", "DPGF", "NF C 15-100"],
    "niveau": "débutant",
    "source": "CCTP / expérience terrain"
  }
]`;

export function BtpDicoJsonImportPanel() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [preview, setPreview] = useState<BtpDicoPreviewResult | null>(null);
  const [duplicateMode, setDuplicateMode] = useState<BtpDicoDuplicateMode>("ignore");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const clear = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  const runPreview = useCallback(() => {
    clear();
    startTransition(async () => {
      const res = await previewBtpDicoImport(text);
      if (res.ok) {
        setPreview(res.preview);
        if (res.preview.structureErrors.length) setError(res.preview.structureErrors.join(" · "));
      } else {
        setPreview(null);
        setError(res.error);
      }
    });
  }, [text, clear]);

  const runImport = useCallback(() => {
    clear();
    startTransition(async () => {
      const res = await importBtpDicoJson(text, duplicateMode);
      if (res.ok) {
        setSuccess(
          `${res.imported} terme(s) importé(s)${res.skipped ? `, ${res.skipped} ignoré(s)` : ""}${res.replaced ? `, ${res.replaced} remplacé(s)` : ""}.`,
        );
        setPreview(null);
        setText("");
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }, [text, duplicateMode, clear, router]);

  const hasDbDuplicates = (preview?.existsInDbCount ?? 0) > 0;

  return (
    <section className="rounded-2xl border border-dashed border-[#1e3a5f]/40 bg-[#f8fafc] p-5 shadow-sm">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#1e3a5f]">Import structuré</p>
      <h2 className="font-heading mt-1 text-lg font-bold text-slate-900">Importer des termes en JSON</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        Collez un tableau JSON de termes. Formats de clés acceptés&nbsp;: <code className="rounded bg-slate-200/80 px-1 text-xs">terme</code>,{" "}
        <code className="rounded bg-slate-200/80 px-1 text-xs">definition_courte</code>,{" "}
        <code className="rounded bg-slate-200/80 px-1 text-xs">lot</code>,{" "}
        <code className="rounded bg-slate-200/80 px-1 text-xs">mots_cles</code>… Les doublons sont détectés sur{" "}
        <strong className="font-semibold text-slate-800">terme + lot</strong>.
      </p>

      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          if (preview) setPreview(null);
          clear();
        }}
        rows={12}
        placeholder={SAMPLE}
        className="mt-4 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-xs leading-relaxed text-slate-800"
      />

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={runPreview}
          disabled={pending || !text.trim()}
          className="rounded-xl border border-[#1e3a5f]/30 bg-white px-4 py-2 text-sm font-semibold text-[#1e3a5f] hover:bg-[#eff6ff] disabled:opacity-50"
        >
          {pending && !preview ? "Analyse…" : "Analyser le JSON"}
        </button>
        <button
          type="button"
          onClick={runImport}
          disabled={pending || !preview?.canImport}
          className="rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#162d4a] disabled:opacity-50"
        >
          Importer les termes
        </button>
        <button
          type="button"
          onClick={() => setText(SAMPLE)}
          disabled={pending}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Insérer un exemple
        </button>
        <button
          type="button"
          onClick={() => {
            setText("");
            setPreview(null);
            clear();
          }}
          disabled={pending}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Vider
        </button>
      </div>

      {error ? (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      ) : null}
      {success ? (
        <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          {success}
        </p>
      ) : null}

      {preview && preview.rows.length > 0 ? (
        <div className="mt-5 space-y-4">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Termes détectés" value={String(preview.total)} />
            <Stat label="Valides" value={String(preview.validCount)} accent="emerald" />
            <Stat label="Invalides" value={String(preview.invalidCount)} accent={preview.invalidCount ? "red" : undefined} />
            <Stat label="Déjà en base" value={String(preview.existsInDbCount)} accent={preview.existsInDbCount ? "amber" : undefined} />
          </div>

          {hasDbDuplicates ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
              <p className="font-semibold">Termes déjà présents (terme + lot)</p>
              <div className="mt-2 flex flex-wrap gap-4">
                <label className="flex cursor-pointer items-center gap-2">
                  <input type="radio" checked={duplicateMode === "ignore"} onChange={() => setDuplicateMode("ignore")} />
                  <span>Ignorer les existants (défaut)</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input type="radio" checked={duplicateMode === "replace"} onChange={() => setDuplicateMode("replace")} />
                  <span>Remplacer les existants</span>
                </label>
              </div>
            </div>
          ) : null}

          {!preview.canImport ? (
            <p className="text-sm font-medium text-amber-900">
              Import bloqué : corrigez les entrées invalides ou en doublon dans le fichier.
            </p>
          ) : (
            <p className="text-sm font-medium text-emerald-800">JSON prêt à importer.</p>
          )}

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="min-w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">Terme</th>
                  <th className="px-3 py-2">Lot</th>
                  <th className="px-3 py-2">État</th>
                  <th className="px-3 py-2">Erreurs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {preview.rows.map((row) => (
                  <tr key={row.index} className={row.valid ? "" : "bg-red-50/40"}>
                    <td className="px-3 py-2">{row.index}</td>
                    <td className="px-3 py-2 font-semibold text-slate-800">
                      {row.term}
                      {row.existsInDb ? <span className="ml-1 text-amber-700">(existe)</span> : null}
                    </td>
                    <td className="px-3 py-2">{row.lotCode ?? "—"}</td>
                    <td className="px-3 py-2">{row.valid ? "OK" : "Invalide"}</td>
                    <td className="max-w-xs px-3 py-2 text-red-700">{row.errors.length ? row.errors.join(" · ") : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: "emerald" | "amber" | "red" }) {
  const cls =
    accent === "emerald"
      ? "text-emerald-900"
      : accent === "amber"
        ? "text-amber-900"
        : accent === "red"
          ? "text-red-800"
          : "text-slate-900";
  return (
    <div className="rounded-lg bg-white px-3 py-2 ring-1 ring-slate-200">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-0.5 text-sm font-semibold ${cls}`}>{value}</p>
    </div>
  );
}
