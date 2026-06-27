"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import {
  importDpgfAnalysisJson,
  previewDpgfAnalysisJsonImport,
} from "@/app/dashboard/devis/analyse-dpgf-actions";
import type { DpgfJsonDuplicateMode, DpgfJsonPreviewResult } from "@/lib/dpgf-analysis/json-import";

type Props = { embedded?: boolean };

export function DpgfAnalysisJsonImportPanel({ embedded = false }: Props) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [preview, setPreview] = useState<DpgfJsonPreviewResult | null>(null);
  const [duplicateMode, setDuplicateMode] = useState<DpgfJsonDuplicateMode>("ignore");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  const runAnalyze = useCallback(() => {
    clearMessages();
    startTransition(async () => {
      const res = await previewDpgfAnalysisJsonImport(text);
      if (res.ok) {
        setPreview(res.preview);
        if (!res.preview.canImport && res.preview.structureErrors.length === 0) {
          setError("Certaines fiches sont incomplètes ou en doublon dans le fichier — corrigez le JSON avant import.");
        }
      } else {
        setPreview(null);
        setError(res.error);
      }
    });
  }, [text, clearMessages]);

  const runImport = useCallback(() => {
    clearMessages();
    startTransition(async () => {
      const res = await importDpgfAnalysisJson(text, duplicateMode);
      if (res.ok) {
        setSuccess(
          `${res.imported} fiche(s) importée(s)${res.skipped ? `, ${res.skipped} ignorée(s) (doublon)` : ""}${res.replaced ? `, ${res.replaced} remplacée(s)` : ""}.`,
        );
        setPreview(null);
        setText("");
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }, [text, duplicateMode, clearMessages, router]);

  const hasDbDuplicates = preview?.rows.some((r) => r.existsInDb) ?? false;
  const showPreviewTable = preview && preview.rows.length > 0;

  const wrapperClass = embedded
    ? ""
    : "rounded-2xl border border-[#1e3a5f]/15 bg-gradient-to-br from-[#eff6ff]/50 to-white p-6 shadow-sm";

  return (
    <div className={wrapperClass}>
      {!embedded ? (
        <>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#1e3a5f]">Import structuré</p>
          <h2 className="font-heading mt-1 text-lg font-bold text-slate-900">Ajout rapide depuis JSON</h2>
        </>
      ) : (
        <h2 className="font-heading text-lg font-bold text-slate-900">Ajout rapide depuis JSON</h2>
      )}
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        Collez un JSON structuré pour importer plusieurs fiches d&apos;analyse DPGF. Ce module crée des fiches de
        compréhension&nbsp;: <strong className="font-semibold text-slate-800">sans prix, sans chiffrage</strong>.
      </p>

      <div className="mt-4 space-y-3">
        <label htmlFor="dpgf-json-import" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Données JSON
        </label>
        <textarea
          id="dpgf-json-import"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (preview) setPreview(null);
            clearMessages();
          }}
          rows={14}
          placeholder='{ "famille": "…", "lot": "07", "fiches_analyse_dpgf": [ { "fiche_mere": { … }, "comprehension": { … } } ] }'
          className="w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-xs leading-relaxed text-slate-800"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <ActionButton onClick={runAnalyze} disabled={pending || !text.trim()} variant="primary">
          {pending && !preview ? "Analyse…" : "Analyser le JSON"}
        </ActionButton>
        <ActionButton onClick={runAnalyze} disabled={pending || !text.trim()} variant="secondary">
          Prévisualiser les fiches
        </ActionButton>
        <ActionButton
          onClick={runImport}
          disabled={pending || !text.trim() || !preview?.canImport}
          variant="primary"
        >
          Importer les fiches
        </ActionButton>
        <ActionButton
          onClick={() => {
            setText("");
            setPreview(null);
            clearMessages();
          }}
          disabled={pending}
          variant="ghost"
        >
          Vider
        </ActionButton>
      </div>

      {error ? (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      ) : null}
      {success ? (
        <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          {success}
        </p>
      ) : null}

      {preview ? (
        <div className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
          <h3 className="text-sm font-bold text-slate-900">Résultat de l&apos;analyse</h3>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Fiches détectées" value={String(preview.totalFiches)} />
            <Stat label="Fiches valides" value={String(preview.validCount)} accent="emerald" />
            <Stat label="Fiches incomplètes" value={String(preview.incompleteCount)} accent="amber" />
            <Stat label="Lots" value={preview.lots.join(", ") || "—"} />
            <Stat label="Familles" value={preview.families.join(", ") || "—"} />
            <Stat
              label="Doublons de codes (fichier)"
              value={String(preview.duplicateCodesInFile.length)}
              accent={preview.duplicateCodesInFile.length ? "amber" : undefined}
            />
          </div>

          {preview.structureErrors.length > 0 ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              <p className="font-semibold">Erreurs de structure</p>
              <ul className="mt-1 list-disc pl-5">
                {preview.structureErrors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {preview.priceFieldsRejected.length > 0 ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              Champs prix/chiffrage refusés&nbsp;: {preview.priceFieldsRejected.join(", ")}
            </div>
          ) : null}

          {hasDbDuplicates ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
              <p className="font-semibold">Codes déjà présents en base</p>
              <p className="mt-1">Choisissez le comportement pour les doublons avant import.</p>
              <div className="mt-3 flex flex-wrap gap-4">
                <DuplicateOption
                  value="ignore"
                  checked={duplicateMode === "ignore"}
                  onChange={setDuplicateMode}
                  label="Ignorer les fiches existantes (défaut)"
                />
                <DuplicateOption
                  value="replace"
                  checked={duplicateMode === "replace"}
                  onChange={setDuplicateMode}
                  label="Remplacer les fiches existantes"
                />
                <DuplicateOption
                  value="new_version"
                  checked={duplicateMode === "new_version"}
                  onChange={setDuplicateMode}
                  label="Importer comme nouvelle version (-v2, -v3…)"
                />
              </div>
            </div>
          ) : null}

          {!preview.canImport ? (
            <p className="text-sm font-medium text-amber-900">
              Import bloqué tant que toutes les fiches ne sont pas valides et sans doublon dans le fichier.
            </p>
          ) : (
            <p className="text-sm font-medium text-emerald-800">JSON prêt à importer.</p>
          )}
        </div>
      ) : null}

      {showPreviewTable ? (
        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">Code</th>
                <th className="px-3 py-2">Désignation</th>
                <th className="px-3 py-2">Lot</th>
                <th className="px-3 py-2">Famille</th>
                <th className="px-3 py-2">Unité</th>
                <th className="px-3 py-2">Niveau</th>
                <th className="px-3 py-2">Statut</th>
                <th className="px-3 py-2">Erreurs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {preview!.rows.map((row) => (
                <tr key={row.index} className={row.valid ? "" : "bg-red-50/40"}>
                  <td className="px-3 py-2">{row.index}</td>
                  <td className="px-3 py-2 font-mono font-semibold text-[#1e3a5f]">
                    {row.code}
                    {row.existsInDb ? <span className="ml-1 text-amber-700">(existe)</span> : null}
                    {row.duplicateInFile ? <span className="ml-1 text-red-700">(doublon fichier)</span> : null}
                  </td>
                  <td className="max-w-xs px-3 py-2">
                    <p className="font-medium">{row.simplifiedDesignation || "—"}</p>
                    <p className="line-clamp-2 text-slate-500">{row.originalDesignation}</p>
                  </td>
                  <td className="px-3 py-2">{row.lot}</td>
                  <td className="px-3 py-2">{row.familyName}</td>
                  <td className="px-3 py-2">{row.unit}</td>
                  <td className="px-3 py-2">{row.level}</td>
                  <td className="px-3 py-2">{row.status}</td>
                  <td className="max-w-xs px-3 py-2 text-red-700">
                    {row.errors.length ? row.errors.join(" · ") : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  disabled,
  variant,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant: "primary" | "secondary" | "ghost";
}) {
  const cls =
    variant === "primary"
      ? "bg-[#1e3a5f] text-white hover:bg-[#162d4a]"
      : variant === "secondary"
        ? "border border-[#1e3a5f]/30 bg-white text-[#1e3a5f] hover:bg-[#eff6ff]"
        : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50 ${cls}`}
    >
      {children}
    </button>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "amber" | "emerald";
}) {
  const valueCls =
    accent === "amber" ? "text-amber-900" : accent === "emerald" ? "text-emerald-900" : "text-slate-900";
  return (
    <div className="rounded-lg bg-white px-3 py-2 ring-1 ring-slate-100">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-0.5 text-sm font-semibold ${valueCls}`}>{value}</p>
    </div>
  );
}

function DuplicateOption({
  value,
  checked,
  onChange,
  label,
}: {
  value: DpgfJsonDuplicateMode;
  checked: boolean;
  onChange: (v: DpgfJsonDuplicateMode) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2">
      <input type="radio" name="duplicateMode" checked={checked} onChange={() => onChange(value)} />
      <span>{label}</span>
    </label>
  );
}
