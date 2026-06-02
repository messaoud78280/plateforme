"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  checkWorkItemCodesExist,
  checkWorkItemsSimilarTitles,
  importObservedPricesForWorkItems,
  importWorkItemsBulk,
  previewBulkImportWorkItems,
  previewObservedPricesPaste,
  type PreviewObservedPricePasteResultRow,
} from "@/app/dashboard/devis/actions";
import { HISTORIQUE_IMPORT_WARNING } from "@/lib/work-item-catalog-constants";
import { WORK_ITEM_STATUS_LABELS } from "@/lib/be-work-devis-labels";
import type { MotherVariantImportBundle } from "@/lib/be-work-devis-chatgpt-paste";
import {
  describeStructuredPasteKind,
  parseStructuredPasteBlock,
  STRUCTURED_PASTE_DETECTED_FORMAT_LABELS,
  type ParsedPasteBulkRow,
  type StructuredPasteFormValues,
} from "@/lib/be-work-devis-structured-paste";
import { buildFirstPriceEntryPreviewCells } from "@/lib/be-work-devis-price-entry-paste";
import type { PricePastePreviewCells } from "@/app/dashboard/devis/actions";

type Props = {
  onApplyValues: (values: StructuredPasteFormValues) => void;
  onClearForm: () => void;
  catalogIsHistorique?: boolean;
  catalogName?: string;
};

type WorkItemPreviewRow = ParsedPasteBulkRow & {
  pastedCode: string;
  resolvedCode: string;
  sourceCode: string;
  duplicateDb: boolean;
  duplicateBatch: boolean;
  previewError?: string;
};

type MotherPreviewRow = MotherVariantImportBundle & {
  duplicateDb: boolean;
  duplicateBatch: boolean;
  similarTitleDb: boolean;
  similarTitleCode: string | null;
};

type PricePastePreviewRow = ParsedPasteBulkRow & PreviewObservedPricePasteResultRow;

type BulkPasteKind = "workItems" | "pricesOnly" | "motherWithVariants" | null;

function displayStatusLabel(statusRaw: string): string {
  const s = statusRaw.trim();
  if (!s) return "—";
  if (s in WORK_ITEM_STATUS_LABELS) return WORK_ITEM_STATUS_LABELS[s as keyof typeof WORK_ITEM_STATUS_LABELS];
  return s;
}

export function WorkItemStructuredPastePanel({
  onApplyValues,
  onClearForm,
  catalogIsHistorique = false,
  catalogName,
}: Props) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [bulkPasteKind, setBulkPasteKind] = useState<BulkPasteKind>(null);
  const [workItemBulkRows, setWorkItemBulkRows] = useState<WorkItemPreviewRow[] | null>(null);
  const [motherBulkRows, setMotherBulkRows] = useState<MotherPreviewRow[] | null>(null);
  const [motherStats, setMotherStats] = useState<{ totalVariants: number; famille: string | null } | null>(null);
  const [priceBulkRows, setPriceBulkRows] = useState<PricePastePreviewRow[] | null>(null);
  const [pasteKindLabel, setPasteKindLabel] = useState<string | null>(null);
  const [confirmSkipDuplicates, setConfirmSkipDuplicates] = useState(false);
  const [confirmMergeDuplicates, setConfirmMergeDuplicates] = useState(false);
  const [confirmHistoriqueImport, setConfirmHistoriqueImport] = useState(false);
  const [isPending, startTransition] = useTransition();

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
    setWarnings([]);
  }, []);

  const buildMotherPreviewRows = useCallback(async (mothers: MotherVariantImportBundle[]) => {
    const codes = mothers.map((m) => m.values.code.trim()).filter(Boolean);
    const existing = await checkWorkItemCodesExist(codes);
    const existingSet = new Set(existing);
    const similarMatches = await checkWorkItemsSimilarTitles(
      mothers.map((m) => ({ title: m.ficheMere, lot: m.values.lot })),
    );
    const similarByTitle = new Map(similarMatches.map((m) => [m.inputTitle, m]));
    const seenInFile = new Set<string>();
    const enriched: MotherPreviewRow[] = mothers.map((mother) => {
      const code = mother.values.code.trim();
      const duplicateDb = Boolean(code && existingSet.has(code));
      const duplicateBatch = Boolean(code && seenInFile.has(code));
      const similar = similarByTitle.get(mother.ficheMere);
      const similarTitleDb = Boolean(similar && !duplicateDb);
      if (code) seenInFile.add(code);
      const values =
        similarTitleDb && similar?.existingCode
          ? { ...mother.values, code: similar.existingCode }
          : mother.values;

      return {
        ...mother,
        values,
        duplicateDb: duplicateDb || similarTitleDb,
        duplicateBatch,
        similarTitleDb,
        similarTitleCode: similar?.existingCode ?? null,
      };
    });
    setMotherBulkRows(enriched);
    setConfirmSkipDuplicates(false);
    setConfirmMergeDuplicates(false);
  }, []);

  const buildWorkItemPreviewRows = useCallback(async (rows: ParsedPasteBulkRow[]) => {
    const payload = rows.map((r) => ({
      values: r.values,
      priceEntries: r.priceEntries,
      pasteSource: r.pasteSource,
    }));
    const preview = await previewBulkImportWorkItems(payload);
    if (!preview.ok) {
      setError(preview.error);
      setWorkItemBulkRows(null);
      return;
    }
    const byIndex = new Map(preview.rows.map((p) => [p.index, p]));
    const enriched: WorkItemPreviewRow[] = rows.map((row) => {
      const p = byIndex.get(row.index);
      const pastedCode = row.values.code.trim();
      const resolvedCode = p?.resolvedCode ?? pastedCode;
      return {
        ...row,
        pastedCode,
        resolvedCode,
        sourceCode: p?.sourceCode ?? pastedCode,
        duplicateDb: p?.duplicateDb ?? false,
        duplicateBatch: p?.duplicateBatch ?? false,
        previewError: p?.error,
      };
    });
    setWorkItemBulkRows(enriched);
    setMotherBulkRows(null);
    setConfirmSkipDuplicates(false);
    setConfirmMergeDuplicates(false);
    setConfirmHistoriqueImport(false);
  }, []);

  /** Tableau / fiches mères+variantes / prix seuls / objet simple. */
  const handleAnalyzeOrPrefill = useCallback(async () => {
    clearMessages();
    setBulkPasteKind(null);
    setWorkItemBulkRows(null);
    setMotherBulkRows(null);
    setMotherStats(null);
    setPriceBulkRows(null);
    setPasteKindLabel(null);
    const parsed = parseStructuredPasteBlock(text);
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }

    const kind = describeStructuredPasteKind(parsed.result);
    if (parsed.result.mode === "motherVariants") {
      setPasteKindLabel(parsed.result.pasteTypeLabel);
    } else {
      const kindLabels: Record<typeof kind, string> = {
        single: STRUCTURED_PASTE_DETECTED_FORMAT_LABELS.objet_ouvrage_simple,
        workItemsList: STRUCTURED_PASTE_DETECTED_FORMAT_LABELS.tableau_ouvrages,
        pricesOnly: "Prix sur ouvrages existants",
        motherWithVariants: STRUCTURED_PASTE_DETECTED_FORMAT_LABELS.export_fiches_meres_variantes,
      };
      setPasteKindLabel(kindLabels[kind]);
    }

    if (parsed.result.mode === "single") {
      onApplyValues(parsed.result.values);
      setWarnings(parsed.result.warnings);
      setSuccess("Formulaire prérempli. Relisez les champs puis enregistrez avec « Créer l’ouvrage ».");
      return;
    }

    if (parsed.result.mode === "motherVariants") {
      const mv = parsed.result;
      setBulkPasteKind("motherWithVariants");
      setWarnings(
        mv.mothers.flatMap((m) =>
          m.warnings.map((w) => `Fiche ${m.motherIndex + 1} (${m.ficheMere}) : ${w}`),
        ),
      );
      setMotherStats({ totalVariants: mv.totalVariantCount, famille: mv.famille });
      await buildMotherPreviewRows(mv.mothers);
      setSuccess(
        mv.mothers.length === 1
          ? `1 fiche mère détectée avec ${mv.totalVariantCount} variante(s). Vérifiez puis importez.`
          : `${mv.mothers.length} fiches mères détectées avec ${mv.totalVariantCount} variantes au total. Vérifiez puis importez.`,
      );
      return;
    }

    const bulk = parsed.result;
    setBulkPasteKind(bulk.bulkKind);
    setWarnings(bulk.rows.flatMap((r) => r.warnings.map((w) => `Ligne ${r.index + 1} : ${w}`)));

    if (bulk.bulkKind === "pricesOnly") {
      setWorkItemBulkRows(null);
      const input = bulk.rows.map((r) => ({
        index: r.index,
        workItemCode: r.workItemCode ?? "",
        priceEntries: r.priceEntries,
      }));
      const prev = await previewObservedPricesPaste(input);
      if (!prev.ok) {
        setError(prev.error);
        setBulkPasteKind(null);
        setPriceBulkRows(null);
        return;
      }
      const byIndex = new Map(prev.rows.map((p) => [p.index, p]));
      const merged: PricePastePreviewRow[] = bulk.rows.map((r) => {
        const s = byIndex.get(r.index);
        if (!s) {
          const preview = buildFirstPriceEntryPreviewCells(r);
          return {
            ...r,
            workItemCode: r.workItemCode ?? "—",
            title: null,
            found: false,
            statutLabel: "code ouvrage introuvable",
            pricesTotal: r.priceEntries.length,
            importablePriceCount: 0,
            duplicatePriceCount: 0,
            invalidPriceCount: r.priceEntries.length,
            preview,
          };
        }
        return { ...r, ...s };
      });
      setPriceBulkRows(merged);
      setSuccess(
        `${merged.length} bloc(s) de prix détecté(s) pour des codes ouvrage. Vérifiez la liste puis cliquez sur « Importer les prix observés » (aucun enregistrement avant validation).`,
      );
      return;
    }

    setPriceBulkRows(null);
    await buildWorkItemPreviewRows(bulk.rows);
    setSuccess(
      `${bulk.rows.length} ouvrage(s) détecté(s). Vérifiez la liste puis cliquez sur « Importer les ouvrages » (aucun enregistrement avant validation).`,
    );
  }, [text, onApplyValues, clearMessages, buildWorkItemPreviewRows]);

  /** Objet unique → formulaire ; liste détectée → même flux que « Analyser » (import bibliothèque). */
  const handlePrefillFormOnly = useCallback(() => {
    clearMessages();
    const block = parseStructuredPasteBlock(text);
    if (!block.ok) {
      setError(block.error);
      return;
    }
    if (block.result.mode === "bulk" || block.result.mode === "motherVariants") {
      void handleAnalyzeOrPrefill();
      return;
    }
    setBulkPasteKind(null);
    setWorkItemBulkRows(null);
    setMotherBulkRows(null);
    setPriceBulkRows(null);
    onApplyValues(block.result.values);
    setWarnings(block.result.warnings);
    setSuccess("Formulaire prérempli. Relisez les champs puis enregistrez avec « Créer l’ouvrage ».");
  }, [text, onApplyValues, clearMessages, handleAnalyzeOrPrefill]);

  const duplicateCount = workItemBulkRows?.filter((r) => r.duplicateDb || r.duplicateBatch).length ?? 0;
  const importableCount =
    workItemBulkRows?.filter(
      (r) => r.resolvedCode.trim() && !r.duplicateDb && !r.duplicateBatch && !r.previewError,
    ).length ?? 0;

  const historiqueOk = !catalogIsHistorique || confirmHistoriqueImport;

  const motherDuplicateCount = motherBulkRows?.filter((r) => r.duplicateDb || r.duplicateBatch).length ?? 0;
  const motherDbDuplicateCount = motherBulkRows?.filter((r) => r.duplicateDb).length ?? 0;
  const motherImportableCount =
    motherBulkRows?.filter((r) => r.values.code.trim() && !r.duplicateBatch).length ?? 0;
  const motherNewCount =
    motherBulkRows?.filter((r) => r.values.code.trim() && !r.duplicateDb && !r.duplicateBatch).length ?? 0;

  const canImportBulk =
    workItemBulkRows &&
    workItemBulkRows.length > 0 &&
    importableCount > 0 &&
    historiqueOk &&
    (duplicateCount === 0 || confirmSkipDuplicates);

  const motherPayloadCount =
    motherBulkRows?.filter((r) => {
      if (!r.values.code.trim() || r.duplicateBatch) return false;
      if (r.duplicateDb) return confirmMergeDuplicates;
      return true;
    }).length ?? 0;

  const canImportMothers =
    Boolean(motherBulkRows?.length) &&
    motherPayloadCount > 0 &&
    (motherDuplicateCount === 0 || confirmSkipDuplicates || confirmMergeDuplicates);

  const totalImportablePrices =
    priceBulkRows?.reduce((sum, r) => sum + r.importablePriceCount, 0) ?? 0;
  const canImportPrices = Boolean(priceBulkRows?.length && totalImportablePrices > 0);

  const handleImportBulk = useCallback(() => {
    const rows = motherBulkRows ?? workItemBulkRows;
    if (!rows) return;
    clearMessages();

    const payload =
      motherBulkRows != null
        ? motherBulkRows
            .filter((r) => {
              if (!r.values.code.trim() || r.duplicateBatch) return false;
              if (r.duplicateDb) return confirmMergeDuplicates;
              return true;
            })
            .map((r) => ({
              values: r.values,
              priceEntries: r.priceEntries,
              pasteSource: r.pasteSource,
            }))
        : workItemBulkRows!
            .filter(
              (r) => r.resolvedCode.trim() && !r.duplicateDb && !r.duplicateBatch && !r.previewError,
            )
            .map((r) => ({
              values: r.values,
              priceEntries: r.priceEntries,
              pasteSource: r.pasteSource,
            }));

    startTransition(async () => {
      const res = await importWorkItemsBulk(payload, {
        mergeDuplicates: confirmMergeDuplicates,
        confirmHistoriqueImport: catalogIsHistorique && confirmHistoriqueImport,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setWorkItemBulkRows(null);
      setMotherBulkRows(null);
      setMotherStats(null);
      setBulkPasteKind(null);
      setText("");
      setConfirmSkipDuplicates(false);
      setConfirmMergeDuplicates(false);
      if (res.errors.length > 0) {
        setWarnings(res.errors);
      }
      const q = new URLSearchParams();
      q.set("imported", String(res.created));
      q.set("pricesImported", String(res.pricesCreated));
      if (res.mergedDuplicates > 0) q.set("merged", String(res.mergedDuplicates));
      router.push(`/dashboard/devis/bibliotheque?${q.toString()}`);
      router.refresh();
    });
  }, [
    workItemBulkRows,
    motherBulkRows,
    motherDuplicateCount,
    confirmSkipDuplicates,
    confirmMergeDuplicates,
    catalogIsHistorique,
    confirmHistoriqueImport,
    clearMessages,
    router,
  ]);

  const handleImportPricesOnly = useCallback(() => {
    if (!priceBulkRows) return;
    clearMessages();
    const payload = priceBulkRows.map((r) => ({
      workItemCode: r.workItemCode ?? "",
      priceEntries: r.priceEntries,
    }));

    startTransition(async () => {
      const res = await importObservedPricesForWorkItems(payload);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setPriceBulkRows(null);
      setBulkPasteKind(null);
      setText("");
      if (res.errors.length > 0) {
        setWarnings(res.errors);
      }
      const q = new URLSearchParams();
      q.set("pricePaste", "1");
      q.set("pricePasteAdded", String(res.added));
      q.set("pricePasteIgnored", String(res.ignored));
      router.push(`/dashboard/devis/bibliotheque?${q.toString()}`);
      router.refresh();
    });
  }, [priceBulkRows, clearMessages, router]);

  const handleClear = useCallback(() => {
    setText("");
    setBulkPasteKind(null);
    setWorkItemBulkRows(null);
    setMotherBulkRows(null);
    setMotherStats(null);
    setPriceBulkRows(null);
    setPasteKindLabel(null);
    setConfirmSkipDuplicates(false);
    setConfirmMergeDuplicates(false);
    clearMessages();
    onClearForm();
  }, [onClearForm, clearMessages]);

  return (
    <section className="rounded-2xl border border-dashed border-[#1e3a5f]/35 bg-[#f8fafc] p-5 shadow-sm">
      <h2 className="font-heading text-base font-bold text-slate-900">Ajout rapide depuis données structurées</h2>
      <p className="mt-2 text-sm text-slate-600">
        Collez un JSON complet (ChatGPT ou autre) : export <code className="rounded bg-slate-200 px-1">{`{ "famille", "ouvrages": [{ "fiche_mere", "variantes" }] }`}</code>, tableau
        d’ouvrages, ou objet simple. <strong>« Analyser le collage »</strong> détecte le format ; les codes Artiprix (ex. 1.11.1) sont convertis en codes BeWork{" "}
        <span className="font-mono text-xs">BW-[LOT]-[FAMILLE]-[SOUS-FAMILLE]-[N°]</span> dans le catalogue actif
        {catalogName ? (
          <>
            {" "}
            (<strong>{catalogName}</strong>)
          </>
        ) : null}
        .
      </p>
      {catalogIsHistorique ? (
        <p className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950" role="status">
          {HISTORIQUE_IMPORT_WARNING}
        </p>
      ) : null}
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
          <p className="font-medium text-slate-700">Plusieurs ouvrages (avec prix optionnels)</p>
          <pre className="max-h-48 overflow-auto rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-800">
{`[
  {
    "code": "BW-A",
    "lot": "Lot 1",
    "title": "…",
    "unit": "m²",
    "fullDescription": "…",
    "priceEntries": [
      {
        "sourceName": "Devis Martin",
        "sourceType": "devis",
        "unitPriceHT": 120,
        "vatRate": 0.2,
        "unitPriceTTC": 144,
        "quantity": 10,
        "totalHT": 1200,
        "totalTTC": 1440
      }
    ]
  }
]`}
          </pre>
          <p className="font-medium text-slate-700">Prix seuls sur ouvrage existant (code déjà en base)</p>
          <pre className="max-h-48 overflow-auto rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-800">
{`[
  {
    "workItemCode": "BW-MARTIN-02-1",
    "priceEntries": [
      {
        "sourceName": "Devis CCMI Martin corrigé BeWork",
        "sourceType": "devis",
        "unitPriceHT": 8.5,
        "vatRate": 0.2,
        "unitPriceTTC": 10.2,
        "quantity": 180,
        "totalHT": 1530,
        "totalTTC": 1836
      }
    ]
  }
]`}
          </pre>
          <p className="font-medium text-slate-700">Export fiche mère + variantes (objet fiche_mere)</p>
          <pre className="max-h-48 overflow-auto rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-800">
{`{
  "famille": "Assainissement",
  "ouvrages": [
    {
      "fiche_mere": {
        "designation": "Fosses toutes eaux en polyéthylène sans préfiltre",
        "description": "…",
        "unite": "U",
        "sous_famille": "Fosses toutes eaux",
        "materiaux": "polyéthylène, PVC"
      },
      "variantes": [
        {
          "code": "4.2.59",
          "designation": "Fosse 1000 L sans préfiltre",
          "volume_litres": 1000,
          "prix": { "fourniture_pose_41h": 1147.47 }
        }
      ]
    }
  ]
}`}
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
        rows={18}
        spellCheck={false}
        placeholder={'{ "famille": "…", "ouvrages": [{ "fiche_mere": "…", "variantes": [ … ] }] }'}
        className="mt-1 min-h-[280px] w-full rounded-xl border border-slate-300 bg-white px-3 py-3 font-mono text-sm leading-relaxed text-slate-900 shadow-inner focus:border-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20"
      />
      {text.length > 0 ? (
        <p className="mt-1 text-xs text-slate-500">{text.length.toLocaleString("fr-FR")} caractères collés (aucune troncature).</p>
      ) : null}

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
        Formats reconnus : objet simple · tableau d’ouvrages · fiche mère + variantes · prix sur code existant.
        {pasteKindLabel ? (
          <>
            {" "}
            Dernier collage : <strong>{pasteKindLabel}</strong>.
          </>
        ) : null}
      </p>

      {motherBulkRows && bulkPasteKind === "motherWithVariants" && motherBulkRows.length > 0 ? (
        <div className="mt-6 space-y-4 border-t border-slate-200 pt-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="font-heading text-sm font-bold text-slate-900">
              Prévisualisation —{" "}
              {motherBulkRows.length === 1
                ? "1 fiche mère détectée"
                : `${motherBulkRows.length} fiches mères détectées`}
            </h3>
            <span className="text-xs text-slate-600">
              <strong>{motherStats?.totalVariants ?? 0}</strong> variante(s) au total
              {motherDuplicateCount > 0 ? (
                <>
                  {" "}
                  · <strong className="text-amber-800">{motherDuplicateCount}</strong> doublon(s)
                </>
              ) : null}
            </span>
          </div>

          {motherStats?.famille ? (
            <p className="text-sm text-slate-600">
              Famille : <strong>{motherStats.famille}</strong>
            </p>
          ) : null}

          <ul className="space-y-2 rounded-xl border border-[#1e3a5f]/15 bg-[#f8fafc] p-4 text-sm text-slate-800">
            {motherBulkRows.map((row, i) => (
              <li key={`summary-${row.motherIndex}`}>
                <span className="font-semibold text-[#1e3a5f]">
                  {motherBulkRows.length > 1 ? `${i + 1}. ` : "Fiche mère : "}
                  {row.ficheMere}
                </span>
                {" — "}
                <span className="tabular-nums">
                  {row.variantCount} variante{row.variantCount > 1 ? "s" : ""}
                </span>
                {row.variantCodes.length > 0 ? (
                  <span className="mt-1 block text-xs text-slate-600">
                    Codes variantes : {row.variantCodes.slice(0, 10).join(", ")}
                    {row.variantCodes.length > 10 ? "…" : ""}
                  </span>
                ) : null}
                {row.similarTitleDb && row.similarTitleCode ? (
                  <span className="mt-1 block text-xs font-medium text-amber-800">
                    Fiche similaire en bibliothèque ({row.similarTitleCode})
                  </span>
                ) : null}
              </li>
            ))}
          </ul>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-[900px] w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-xs font-bold uppercase text-slate-600">
                <tr>
                  <th className="px-2 py-2">#</th>
                  <th className="px-2 py-2">Code</th>
                  <th className="px-2 py-2">Fiche mère</th>
                  <th className="px-2 py-2">Lot</th>
                  <th className="px-2 py-2">Unité</th>
                  <th className="px-2 py-2">Variantes</th>
                  <th className="px-2 py-2">Prix importés</th>
                  <th className="px-2 py-2">Doublon</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {motherBulkRows.map((row) => {
                  const dup = row.duplicateDb || row.duplicateBatch;
                  return (
                    <tr key={row.motherIndex} className={dup ? "bg-amber-50/60" : undefined}>
                      <td className="px-2 py-2 text-slate-500">{row.motherIndex + 1}</td>
                      <td className="px-2 py-2 font-mono text-xs font-semibold text-[#1e3a5f]">{row.values.code}</td>
                      <td className="max-w-[240px] truncate px-2 py-2 font-medium" title={row.ficheMere}>
                        {row.ficheMere}
                      </td>
                      <td className="px-2 py-2">{row.values.lot || "—"}</td>
                      <td className="px-2 py-2">{row.values.unit || "—"}</td>
                      <td className="px-2 py-2 tabular-nums">{row.variantCount}</td>
                      <td className="px-2 py-2 tabular-nums">{row.priceEntries.length}</td>
                      <td className="px-2 py-2">
                        {dup ? (
                          <span className="rounded-full bg-amber-200 px-2 py-0.5 text-xs font-bold text-amber-950">
                            {row.duplicateBatch
                              ? "Répété dans le collage"
                              : row.similarTitleDb
                                ? "Titre similaire"
                                : "Déjà en base"}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {motherDbDuplicateCount > 0 ? (
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-blue-200 bg-blue-50/80 p-3 text-sm text-blue-950">
              <input
                type="checkbox"
                className="mt-1"
                checked={confirmMergeDuplicates}
                onChange={(e) => setConfirmMergeDuplicates(e.target.checked)}
              />
              <span>
                Fusionner les variantes dans les <strong>{motherDbDuplicateCount}</strong> fiche(s) déjà en bibliothèque (ajout des prix
                observés, sans créer de doublon).
              </span>
            </label>
          ) : null}

          {motherDuplicateCount > 0 ? (
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-amber-200 bg-amber-50/80 p-3 text-sm text-amber-950">
              <input
                type="checkbox"
                className="mt-1"
                checked={confirmSkipDuplicates}
                onChange={(e) => setConfirmSkipDuplicates(e.target.checked)}
              />
              <span>
                Ignorer les doublons et n’importer que les <strong>{motherNewCount}</strong> nouvelle(s) fiche(s) (
                <strong>{motherPayloadCount}</strong> au total avec fusion éventuelle).
              </span>
            </label>
          ) : null}

          <button
            type="button"
            disabled={!canImportMothers || isPending}
            onClick={handleImportBulk}
            className="rounded-lg bg-[#0f766e] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#0d5c56] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending
              ? "Import en cours…"
              : `Importer ${motherPayloadCount} fiche(s) et ${motherStats?.totalVariants ?? 0} variante(s)`}
          </button>
        </div>
      ) : null}

      {workItemBulkRows && bulkPasteKind === "workItems" && workItemBulkRows.length > 0 ? (
        <div className="mt-6 space-y-4 border-t border-slate-200 pt-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="font-heading text-sm font-bold text-slate-900">
              Prévisualisation — {workItemBulkRows.length} ouvrage(s) détecté(s)
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
            <table className="min-w-[1400px] w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-xs font-bold uppercase text-slate-600">
                <tr>
                  <th className="px-2 py-2">#</th>
                  <th className="px-2 py-2">Code collé</th>
                  <th className="px-2 py-2">Code BeWork</th>
                  <th className="px-2 py-2">Source Artiprix</th>
                  <th className="px-2 py-2">Lot</th>
                  <th className="px-2 py-2">Titre</th>
                  <th className="px-2 py-2">Unité</th>
                  <th className="px-2 py-2">Statut</th>
                  <th className="px-2 py-2">Qté</th>
                  <th className="px-2 py-2">PU HT</th>
                  <th className="px-2 py-2">Total HT</th>
                  <th className="px-2 py-2">TVA</th>
                  <th className="px-2 py-2">Total TTC</th>
                  <th className="px-2 py-2">Source prix</th>
                  <th className="px-2 py-2">Doublon</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {workItemBulkRows.map((row) => {
                  const dup = row.duplicateDb || row.duplicateBatch;
                  const px = buildFirstPriceEntryPreviewCells(row);
                  return (
                    <tr key={row.index} className={dup ? "bg-amber-50/60" : undefined}>
                      <td className="whitespace-nowrap px-2 py-2 text-slate-500">{row.index + 1}</td>
                      <td className="px-2 py-2 font-mono text-xs text-slate-600">{row.pastedCode || "—"}</td>
                      <td className="px-2 py-2 font-mono text-xs font-semibold text-[#1e3a5f]">
                        {row.resolvedCode || "—"}
                      </td>
                      <td className="px-2 py-2 font-mono text-xs text-slate-700">{row.sourceCode || "—"}</td>
                      <td className="max-w-[120px] truncate px-2 py-2" title={row.values.lot}>
                        {row.values.lot.trim() || "—"}
                      </td>
                      <td className="max-w-[180px] truncate px-2 py-2 font-medium text-slate-900" title={row.values.title}>
                        {row.values.title.trim() || "—"}
                      </td>
                      <td className="whitespace-nowrap px-2 py-2">{row.values.unit.trim() || "—"}</td>
                      <td className="whitespace-nowrap px-2 py-2 text-slate-700">{displayStatusLabel(row.values.status)}</td>
                      <td className="whitespace-nowrap px-2 py-2 font-mono text-xs">{px.qty}</td>
                      <td className="whitespace-nowrap px-2 py-2 font-mono text-xs">{px.puHt}</td>
                      <td className="whitespace-nowrap px-2 py-2 font-mono text-xs">{px.totalHt}</td>
                      <td className="whitespace-nowrap px-2 py-2 text-xs">{px.tva}</td>
                      <td className="whitespace-nowrap px-2 py-2 font-mono text-xs">{px.totalTtc}</td>
                      <td className="max-w-[200px] truncate px-2 py-2 text-xs" title={px.source}>
                        {px.source}
                      </td>
                      <td className="px-2 py-2">
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

          {catalogIsHistorique ? (
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-red-200 bg-red-50/80 p-3 text-sm text-red-950">
              <input
                type="checkbox"
                className="mt-1"
                checked={confirmHistoriqueImport}
                onChange={(e) => setConfirmHistoriqueImport(e.target.checked)}
              />
              <span>{HISTORIQUE_IMPORT_WARNING}</span>
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
          {workItemBulkRows.length > 0 && importableCount === 0 ? (
            <p className="text-sm text-amber-900">Aucune ligne importable : corrigez les codes en doublon ou videz le collage.</p>
          ) : null}
        </div>
      ) : null}

      {priceBulkRows && bulkPasteKind === "pricesOnly" && priceBulkRows.length > 0 ? (
        <div className="mt-6 space-y-4 border-t border-slate-200 pt-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="font-heading text-sm font-bold text-slate-900">
              Prévisualisation — prix pour ouvrages existants ({priceBulkRows.length} bloc(s))
            </h3>
            <span className="text-xs text-slate-600">
              Prix importables : <strong>{totalImportablePrices}</strong>
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-[1100px] w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-xs font-bold uppercase text-slate-600">
                <tr>
                  <th className="px-2 py-2">#</th>
                  <th className="px-2 py-2">Code ouvrage</th>
                  <th className="px-2 py-2">Titre ouvrage</th>
                  <th className="px-2 py-2">Qté</th>
                  <th className="px-2 py-2">PU HT</th>
                  <th className="px-2 py-2">Total HT</th>
                  <th className="px-2 py-2">TVA</th>
                  <th className="px-2 py-2">Total TTC</th>
                  <th className="px-2 py-2">Source</th>
                  <th className="px-2 py-2">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {priceBulkRows.map((row) => {
                  const px: PricePastePreviewCells =
                    row.preview ?? buildFirstPriceEntryPreviewCells(row);
                  const title = row.found ? row.title ?? "—" : "—";
                  const warnRow = !row.found || row.importablePriceCount === 0;
                  return (
                    <tr key={row.index} className={warnRow ? "bg-amber-50/40" : undefined}>
                      <td className="whitespace-nowrap px-2 py-2 text-slate-500">{row.index + 1}</td>
                      <td className="px-2 py-2 font-mono text-xs font-semibold text-[#1e3a5f]">{row.workItemCode || "—"}</td>
                      <td className="max-w-[220px] truncate px-2 py-2 font-medium text-slate-900" title={title}>
                        {title}
                      </td>
                      <td className="whitespace-nowrap px-2 py-2 font-mono text-xs">{px.qty}</td>
                      <td className="whitespace-nowrap px-2 py-2 font-mono text-xs">{px.puHt}</td>
                      <td className="whitespace-nowrap px-2 py-2 font-mono text-xs">{px.totalHt}</td>
                      <td className="whitespace-nowrap px-2 py-2 text-xs">{px.tva}</td>
                      <td className="whitespace-nowrap px-2 py-2 font-mono text-xs">{px.totalTtc}</td>
                      <td className="max-w-[200px] truncate px-2 py-2 text-xs" title={px.source}>
                        {px.source}
                      </td>
                      <td className="max-w-[220px] px-2 py-2 text-xs font-medium text-slate-800">{row.statutLabel}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            disabled={!canImportPrices || isPending}
            onClick={handleImportPricesOnly}
            className="rounded-lg bg-[#0f766e] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#0d5c56] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "Import en cours…" : "Importer les prix observés"}
          </button>
          {priceBulkRows.length > 0 && !canImportPrices ? (
            <p className="text-sm text-amber-900">Aucun prix importable : vérifiez les codes ouvrage et les doublons.</p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
