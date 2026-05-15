"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { checkWorkItemCodesExist, importWorkItemsBulk } from "@/app/dashboard/devis/actions";
import { WORK_ITEM_STATUS_LABELS } from "@/lib/be-work-devis-labels";
import {
  parseStructuredPasteBlock,
  parseStructuredWorkItemPaste,
  type ParsedPasteBulkRow,
  type StructuredPasteFormValues,
} from "@/lib/be-work-devis-structured-paste";

type Props = {
  onApplyValues: (values: StructuredPasteFormValues) => void;
  onClearForm: () => void;
};

type PreviewRow = ParsedPasteBulkRow & {
  duplicateDb: boolean;
  duplicateBatch: boolean;
};

function displayStatusLabel(statusRaw: string): string {
  const s = statusRaw.trim();
  if (!s) return "—";
  if (s in WORK_ITEM_STATUS_LABELS) return WORK_ITEM_STATUS_LABELS[s as keyof typeof WORK_ITEM_STATUS_LABELS];
  return s;
}

export function WorkItemStructuredPastePanel({ onApplyValues, onClearForm }: Props) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [bulkRows, setBulkRows] = useState<PreviewRow[] | null>(null);
  const [confirmSkipDuplicates, setConfirmSkipDuplicates] = useState(false);
  const [isPending, startTransition] = useTransition();

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
    setWarnings([]);
  }, []);

  const buildPreviewRows = useCallback(async (rows: ParsedPasteBulkRow[]) => {
    const codes = rows.map((r) => r.values.code.trim()).filter(Boolean);
    const existing = await checkWorkItemCodesExist(codes);
    const existingSet = new Set(existing);
    const seenInFile = new Set<string>();
    const enriched: PreviewRow[] = rows.map((row) => {
      const code = row.values.code.trim();
      const duplicateDb = Boolean(code && existingSet.has(code));
      const duplicateBatch = Boolean(code && seenInFile.has(code));
      if (code) seenInFile.add(code);
      return { ...row, duplicateDb, duplicateBatch };
    });
    setBulkRows(enriched);
    setConfirmSkipDuplicates(false);
  }, []);

  /** Objet unique → formulaire ; tableau → prévisualisation. */
  const handleAnalyzeOrPrefill = useCallback(async () => {
    clearMessages();
    setBulkRows(null);
    const parsed = parseStructuredPasteBlock(text);
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }
    if (parsed.result.mode === "single") {
      onApplyValues(parsed.result.values);
      setWarnings(parsed.result.warnings);
      setSuccess("Formulaire prérempli. Relisez les champs puis enregistrez avec « Créer l’ouvrage ».");
      return;
    }
    setWarnings(parsed.result.rows.flatMap((r) => r.warnings.map((w) => `Ligne ${r.index + 1} : ${w}`)));
    await buildPreviewRows(parsed.result.rows);
    setSuccess(
      `${parsed.result.rows.length} ouvrage(s) détecté(s). Vérifiez la liste puis cliquez sur « Importer les ouvrages » (aucun enregistrement avant validation).`,
    );
  }, [text, onApplyValues, clearMessages, buildPreviewRows]);

  /** Uniquement un objet JSON (erreur explicite si tableau). */
  const handlePrefillFormOnly = useCallback(() => {
    clearMessages();
    setBulkRows(null);
    const result = parseStructuredWorkItemPaste(text);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onApplyValues(result.values);
    setWarnings(result.warnings);
    setSuccess("Formulaire prérempli. Relisez les champs puis enregistrez avec « Créer l’ouvrage ».");
  }, [text, onApplyValues, clearMessages]);

  const duplicateCount = bulkRows?.filter((r) => r.duplicateDb || r.duplicateBatch).length ?? 0;
  const importableCount =
    bulkRows?.filter((r) => r.values.code.trim() && !r.duplicateDb && !r.duplicateBatch).length ?? 0;

  const canImportBulk =
    bulkRows &&
    bulkRows.length > 0 &&
    importableCount > 0 &&
    (duplicateCount === 0 || confirmSkipDuplicates);

  const handleImportBulk = useCallback(() => {
    if (!bulkRows) return;
    clearMessages();
    const payload = bulkRows
      .filter((r) => r.values.code.trim() && !r.duplicateDb && !r.duplicateBatch)
      .map((r) => r.values);

    startTransition(async () => {
      const res = await importWorkItemsBulk(payload);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setBulkRows(null);
      setText("");
      setConfirmSkipDuplicates(false);
      if (res.errors.length > 0) {
        setWarnings(res.errors);
      }
      router.push(`/dashboard/devis/bibliotheque?imported=${res.created}`);
      router.refresh();
    });
  }, [bulkRows, clearMessages, router]);

  const handleClear = useCallback(() => {
    setText("");
    setBulkRows(null);
    setConfirmSkipDuplicates(false);
    clearMessages();
    onClearForm();
  }, [onClearForm, clearMessages]);

  return (
    <section className="rounded-2xl border border-dashed border-[#1e3a5f]/35 bg-[#f8fafc] p-5 shadow-sm">
      <h2 className="font-heading text-base font-bold text-slate-900">Ajout rapide depuis données structurées</h2>
      <p className="mt-2 text-sm text-slate-600">
        Collez un <strong>objet JSON</strong> pour préremplir le formulaire manuel ci-dessous, ou un <strong>tableau JSON</strong> pour
        prévisualiser et importer plusieurs ouvrages d’un coup (devis, BPU…). Aucun enregistrement automatique : vous validez à la fin.
      </p>
      <details className="mt-3 text-sm text-slate-600">
        <summary className="cursor-pointer font-semibold text-[#1e3a5f] hover:underline">Voir des exemples</summary>
        <div className="mt-2 space-y-3">
          <p className="font-medium text-slate-700">Un seul ouvrage (objet)</p>
          <pre className="max-h-40 overflow-auto rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-800">
{`{
  "code": "BW-CAR-001",
  "lot": "Carrelage",
  "title": "Carrelage grès cérame 60×60",
  "unit": "m²",
  "fullDescription": "…"
}`}
          </pre>
          <p className="font-medium text-slate-700">Plusieurs ouvrages (tableau)</p>
          <pre className="max-h-40 overflow-auto rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-800">
{`[
  { "code": "BW-A", "lot": "Lot 1", "title": "…", "unit": "m²", "fullDescription": "…" },
  { "code": "BW-B", "lot": "Lot 2", "title": "…", "unit": "m²", "fullDescription": "…" }
]`}
          </pre>
        </div>
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
        placeholder={'{ "code": "…" }  ou  [ { "code": "…" }, … ]'}
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
        <ul className="mt-3 max-h-40 list-inside list-disc overflow-auto rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          {warnings.map((w, i) => (
            <li key={`${i}-${w.slice(0, 48)}`}>{w}</li>
          ))}
        </ul>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void handleAnalyzeOrPrefill()}
          className="rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#152a45]"
        >
          Analyser le collage
        </button>
        <button
          type="button"
          onClick={handlePrefillFormOnly}
          className="rounded-lg border border-[#1e3a5f]/40 bg-white px-4 py-2 text-sm font-semibold text-[#1e3a5f] hover:bg-slate-50"
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
      <p className="mt-2 text-xs text-slate-500">
        « Analyser le collage » : objet → préremplissage du formulaire ; tableau → prévisualisation + import groupé. « Préremplir le
        formulaire » : réservé à un <strong>seul</strong> objet JSON.
      </p>

      {bulkRows && bulkRows.length > 0 ? (
        <div className="mt-6 space-y-4 border-t border-slate-200 pt-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="font-heading text-sm font-bold text-slate-900">
              Prévisualisation — {bulkRows.length} ouvrage(s) détecté(s)
            </h3>
            <span className="text-xs text-slate-600">
              Importables : <strong>{importableCount}</strong>
              {duplicateCount > 0 ? (
                <>
                  {" "}
                  · <strong className="text-amber-800">{duplicateCount}</strong> avec doublon
                </>
              ) : null}
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-[720px] w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-xs font-bold uppercase text-slate-600">
                <tr>
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">Code</th>
                  <th className="px-3 py-2">Lot</th>
                  <th className="px-3 py-2">Titre</th>
                  <th className="px-3 py-2">Unité</th>
                  <th className="px-3 py-2">Statut</th>
                  <th className="px-3 py-2">Doublon</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bulkRows.map((row) => {
                  const dup = row.duplicateDb || row.duplicateBatch;
                  return (
                    <tr key={row.index} className={dup ? "bg-amber-50/60" : undefined}>
                      <td className="whitespace-nowrap px-3 py-2 text-slate-500">{row.index + 1}</td>
                      <td className="px-3 py-2 font-mono text-xs font-semibold text-[#1e3a5f]">
                        {row.values.code.trim() || "—"}
                      </td>
                      <td className="max-w-[140px] truncate px-3 py-2" title={row.values.lot}>
                        {row.values.lot.trim() || "—"}
                      </td>
                      <td className="max-w-[220px] truncate px-3 py-2 font-medium text-slate-900" title={row.values.title}>
                        {row.values.title.trim() || "—"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2">{row.values.unit.trim() || "—"}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-slate-700">{displayStatusLabel(row.values.status)}</td>
                      <td className="px-3 py-2">
                        {dup ? (
                          <span className="rounded-full bg-amber-200 px-2 py-0.5 text-xs font-bold text-amber-950">
                            Doublon détecté
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {duplicateCount > 0 ? (
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-amber-200 bg-amber-50/80 p-3 text-sm text-amber-950">
              <input
                type="checkbox"
                className="mt-1"
                checked={confirmSkipDuplicates}
                onChange={(e) => setConfirmSkipDuplicates(e.target.checked)}
              />
              <span>
                Je confirme d’importer uniquement les <strong>{importableCount}</strong> ouvrage(s) sans doublon, et d’ignorer les{" "}
                <strong>{duplicateCount}</strong> ligne(s) marquées « Doublon détecté » (code déjà en bibliothèque ou répété dans le
                collage).
              </span>
            </label>
          ) : null}

          <button
            type="button"
            disabled={!canImportBulk || isPending}
            onClick={handleImportBulk}
            className="rounded-lg bg-[#0f766e] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#0d5c56] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "Import en cours…" : "Importer les ouvrages"}
          </button>
          {bulkRows.length > 0 && importableCount === 0 ? (
            <p className="text-sm text-amber-900">Aucune ligne importable : corrigez les codes en doublon ou videz le collage.</p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
