"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  applyWorkItemCodificationBatch,
  revertWorkItemCodification,
  validateWorkItemCodification,
  type CodificationListRow,
} from "@/app/dashboard/devis/codification-actions";
import type { CodificationBeforeAfterReport } from "@/lib/bework-work-item-codification";
import { CODIFICATION_STATUS_LABELS } from "@/lib/bework-work-item-codification";
import { BEWORK_LOT_LEXICON, BEWORK_CODIFICATION_FAMILIES } from "@/lib/bework-work-item-codification/lexicon";
import { formatEurFrBpu } from "@/lib/be-work-devis-format";

type Props = {
  initialRows: CodificationListRow[];
  report: CodificationBeforeAfterReport;
  initialFilters: {
    lotCode?: string;
    familleCode?: string;
    sousFamilleCode?: string;
    codificationStatus?: string;
    onlyNeedsReview?: boolean;
    q?: string;
  };
};

export function WorkItemCodificationAdmin({ initialRows, report, initialFilters }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [lastReport, setLastReport] = useState<CodificationBeforeAfterReport | null>(null);

  const [lotCode, setLotCode] = useState(initialFilters.lotCode ?? "");
  const [familleCode, setFamilleCode] = useState(initialFilters.familleCode ?? "");
  const [sousFamilleCode, setSousFamilleCode] = useState(initialFilters.sousFamilleCode ?? "");
  const [codificationStatus, setCodificationStatus] = useState(initialFilters.codificationStatus ?? "");
  const [onlyNeedsReview, setOnlyNeedsReview] = useState(initialFilters.onlyNeedsReview ?? false);
  const [q, setQ] = useState(initialFilters.q ?? "");

  const visible = useMemo(() => {
    return initialRows.filter((r) => {
      if (onlyNeedsReview && r.proposedStatus !== "a_verifier" && r.codificationStatus !== "a_verifier") return false;
      return true;
    });
  }, [initialRows, onlyNeedsReview]);

  function applyFilters() {
    const p = new URLSearchParams(searchParams.toString());
    if (lotCode) p.set("lotCode", lotCode);
    else p.delete("lotCode");
    if (familleCode) p.set("familleCode", familleCode);
    else p.delete("familleCode");
    if (sousFamilleCode) p.set("sousFamilleCode", sousFamilleCode);
    else p.delete("sousFamilleCode");
    if (codificationStatus) p.set("codificationStatus", codificationStatus);
    else p.delete("codificationStatus");
    if (onlyNeedsReview) p.set("onlyNeedsReview", "1");
    else p.delete("onlyNeedsReview");
    if (q.trim()) p.set("q", q.trim());
    else p.delete("q");
    router.push(`/dashboard/devis/bibliotheque/codification?${p.toString()}`);
  }

  function onRecodifyAuto(dryRun: boolean) {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await applyWorkItemCodificationBatch({ dryRun, onlyAuto: !dryRun });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setLastReport(res.report);
      setSuccess(
        dryRun
          ? `Simulation : ${res.applied} ouvrage(s) seraient recodifiés (${res.skipped} ignorés).`
          : `Recodification appliquée : ${res.applied} ouvrage(s). Les prix n’ont pas été modifiés.`,
      );
      router.refresh();
    });
  }

  function onValidate(id: string) {
    setError(null);
    startTransition(async () => {
      const res = await validateWorkItemCodification(id);
      if (!res.ok) setError(res.error);
      else router.refresh();
    });
  }

  function onRevert(id: string) {
    setError(null);
    startTransition(async () => {
      const res = await revertWorkItemCodification(id);
      if (!res.ok) setError(res.error);
      else router.refresh();
    });
  }

  const displayReport = lastReport ?? report;

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900" role="alert">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900" role="status">
          {success}
        </div>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-heading text-lg font-bold text-slate-900">Rapport avant / après</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg bg-slate-50 px-3 py-2">
            <dt className="text-[11px] font-bold uppercase text-slate-500">Total ouvrages</dt>
            <dd className="text-xl font-bold text-slate-900">{displayReport.total}</dd>
          </div>
          <div className="rounded-lg bg-slate-50 px-3 py-2">
            <dt className="text-[11px] font-bold uppercase text-slate-500">Déjà BW structurés</dt>
            <dd className="text-xl font-bold text-[#1e3a5f]">{displayReport.alreadyStructured}</dd>
          </div>
          <div className="rounded-lg bg-slate-50 px-3 py-2">
            <dt className="text-[11px] font-bold uppercase text-slate-500">Propositions auto</dt>
            <dd className="text-xl font-bold text-emerald-700">{displayReport.proposedAuto}</dd>
          </div>
          <div className="rounded-lg bg-amber-50 px-3 py-2">
            <dt className="text-[11px] font-bold uppercase text-amber-800">À vérifier</dt>
            <dd className="text-xl font-bold text-amber-900">{displayReport.proposedReview}</dd>
          </div>
        </dl>
        {displayReport.sampleChanges.length > 0 ? (
          <div className="mt-4 overflow-x-auto">
            <p className="mb-2 text-xs font-semibold text-slate-600">Échantillon de transformations</p>
            <table className="w-full min-w-[640px] text-left text-xs">
              <thead className="text-[10px] uppercase text-slate-500">
                <tr>
                  <th className="py-1 pr-2">Source</th>
                  <th className="py-1 pr-2">Avant</th>
                  <th className="py-1 pr-2">Après</th>
                  <th className="py-1 pr-2">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayReport.sampleChanges.slice(0, 12).map((s, i) => (
                  <tr key={`${s.codeSource}-${i}`}>
                    <td className="py-1.5 font-mono text-slate-700">{s.codeSource}</td>
                    <td className="py-1.5 font-mono text-slate-500">{s.before ?? "—"}</td>
                    <td className="py-1.5 font-mono font-semibold text-[#1e3a5f]">{s.after}</td>
                    <td className="py-1.5">{CODIFICATION_STATUS_LABELS[s.status] ?? s.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-heading text-lg font-bold text-slate-900">Filtres</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block text-sm">
            <span className="font-semibold text-slate-700">Lot</span>
            <select
              value={lotCode}
              onChange={(e) => setLotCode(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="">Tous</option>
              {BEWORK_LOT_LEXICON.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.code} — {l.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="font-semibold text-slate-700">Famille</span>
            <select
              value={familleCode}
              onChange={(e) => setFamilleCode(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="">Toutes</option>
              {BEWORK_CODIFICATION_FAMILIES.map((f) => (
                <option key={f.code} value={f.code}>
                  {f.code} — {f.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="font-semibold text-slate-700">Sous-famille (code)</span>
            <input
              value={sousFamilleCode}
              onChange={(e) => setSousFamilleCode(e.target.value.toUpperCase())}
              placeholder="ex. CLO"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="font-semibold text-slate-700">Statut codification</span>
            <select
              value={codificationStatus}
              onChange={(e) => setCodificationStatus(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="">Tous</option>
              {Object.entries(CODIFICATION_STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="font-semibold text-slate-700">Recherche</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Code, désignation…"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="flex items-center gap-2 text-sm sm:col-span-3">
            <input
              type="checkbox"
              checked={onlyNeedsReview}
              onChange={(e) => setOnlyNeedsReview(e.target.checked)}
              className="rounded border-slate-300"
            />
            <span className="font-semibold text-slate-700">Uniquement à vérifier</span>
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={applyFilters}
            className="rounded-xl bg-[#1e3a5f] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#162d4a]"
          >
            Appliquer les filtres
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => onRecodifyAuto(true)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
          >
            Simuler recodification auto
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => onRecodifyAuto(false)}
            className="rounded-xl border border-[#1e3a5f] bg-[#1e3a5f]/5 px-4 py-2.5 text-sm font-semibold text-[#1e3a5f] hover:bg-[#1e3a5f]/10 disabled:opacity-50"
          >
            Recodifier automatiquement (confiance auto)
          </button>
        </div>
        <p className="mt-3 text-xs text-slate-600">
          Format cible : <span className="font-mono font-semibold">BW-[LOT]-[FAMILLE]-[OUVRAGE]-[VARIANTE]</span>.
          Les prix et les ouvrages ne sont jamais supprimés ; <span className="font-mono">sourceCode</span> est
          préservé.
        </p>
      </section>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-[1400px] w-full border-collapse text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2">code_source</th>
              <th className="px-3 py-2">code_bework</th>
              <th className="px-3 py-2">Lot</th>
              <th className="px-3 py-2">Famille</th>
              <th className="px-3 py-2">Sous-fam.</th>
              <th className="px-3 py-2">Ouvrage</th>
              <th className="px-3 py-2">Désignation</th>
              <th className="px-3 py-2">Unité</th>
              <th className="px-3 py-2 text-right">Prix moy. HT</th>
              <th className="px-3 py-2 text-right">Nb prix</th>
              <th className="px-3 py-2">Statut</th>
              <th className="px-3 py-2">Confiance</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visible.length === 0 ? (
              <tr>
                <td colSpan={13} className="px-4 py-10 text-center text-slate-500">
                  Aucun ouvrage pour ces filtres.
                </td>
              </tr>
            ) : (
              visible.map((r) => (
                <tr key={r.id} className={r.proposedStatus === "a_verifier" ? "bg-amber-50/40" : undefined}>
                  <td className="px-3 py-2 font-mono text-xs text-slate-700">{r.codeSource}</td>
                  <td className="px-3 py-2 font-mono text-xs font-semibold text-[#1e3a5f]">
                    {r.proposedCodeBework}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{r.lotCode || "—"}</td>
                  <td className="px-3 py-2 text-xs">
                    <span className="font-mono font-bold">{r.familleCode}</span>
                    {r.familleNom ? <span className="ml-1 text-slate-600">{r.familleNom}</span> : null}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{r.sousFamilleCode ?? "—"}</td>
                  <td className="px-3 py-2 font-mono text-xs">{r.ouvrageCode || "—"}</td>
                  <td className="max-w-[280px] truncate px-3 py-2 text-xs text-slate-800" title={r.designationSource}>
                    {r.designationSource}
                  </td>
                  <td className="px-3 py-2 text-xs">{r.unite}</td>
                  <td className="px-3 py-2 text-right text-xs tabular-nums">
                    {r.avgHt != null ? formatEurFrBpu(r.avgHt) : "—"}
                  </td>
                  <td className="px-3 py-2 text-right text-xs tabular-nums">{r.priceSourceCount}</td>
                  <td className="px-3 py-2 text-xs">
                    <span
                      className={
                        r.proposedStatus === "a_verifier"
                          ? "rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-900"
                          : r.codificationStatus === "valide"
                            ? "rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-900"
                            : "rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-700"
                      }
                    >
                      {CODIFICATION_STATUS_LABELS[r.codificationStatus] ?? r.proposedStatus}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-600">{r.confidence}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => onValidate(r.id)}
                        className="rounded-lg border border-emerald-200 px-2 py-1 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-50 disabled:opacity-50"
                      >
                        Valider
                      </button>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => onRevert(r.id)}
                        className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                      >
                        Annuler
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
