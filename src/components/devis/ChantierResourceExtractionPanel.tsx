"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import {
  approveAllHighScorePendingProposals,
  approveAllMergeAliasProposals,
  approveGroupingProposal,
  approveGroupingProposals,
  createExtractionPreview,
  rejectGroupingProposal,
  rejectGroupingProposals,
} from "@/app/dashboard/devis/ressources-chantier-actions";
import { GROUPING_PROPOSAL_TYPE_LABELS } from "@/lib/chantier-resources/labels";

const PAGE_SIZE = 50;

type ProposalType = keyof typeof GROUPING_PROPOSAL_TYPE_LABELS;

type ProposalRow = {
  id: string;
  proposalType: ProposalType;
  similarityScore: number;
  sourceLabel: string;
  sourceSnippet: string | null;
  targetSiteResource: { id: string; shortName: string } | null;
  sourceWorkItem: { id: string; code: string; title: string } | null;
  extractionRun?: { id: string; label: string | null; createdAt: Date } | null;
};

type ActionFilter = "all" | "merge_as_alias" | "new_resource" | "create_variant" | "keep_separate";
type ScoreFilter = "all" | "high" | "medium" | "low";

type Feedback = { kind: "success" | "error" | "info"; message: string };

type Props = {
  proposals: ProposalRow[];
  pendingTotal: number;
  runId: string | null;
  runLabel?: string | null;
};

function formatValidated(count: number) {
  return count === 1 ? "1 proposition validée" : `${count} propositions validées`;
}

function scoreInBand(score: number, band: ScoreFilter) {
  if (band === "all") return true;
  if (band === "high") return score >= 90;
  if (band === "medium") return score >= 70 && score < 90;
  return score < 70;
}

export function ChantierResourceExtractionPanel({ proposals: initialProposals, pendingTotal, runId, runLabel }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [rows, setRows] = useState(initialProposals);
  const [localPendingTotal, setLocalPendingTotal] = useState(pendingTotal);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [limit, setLimit] = useState(150);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [actionFilter, setActionFilter] = useState<ActionFilter>("all");
  const [scoreFilter, setScoreFilter] = useState<ScoreFilter>("all");
  const [lotFilter, setLotFilter] = useState<"all" | "run">(runId ? "run" : "all");
  const [page, setPage] = useState(0);

  useEffect(() => {
    setRows(initialProposals);
    setLocalPendingTotal(pendingTotal);
  }, [initialProposals, pendingTotal]);

  const removeRows = useCallback((ids: string[]) => {
    const idSet = new Set(ids);
    setRows((prev) => prev.filter((r) => !idSet.has(r.id)));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const id of ids) next.delete(id);
      return next;
    });
    setLocalPendingTotal((n) => Math.max(0, n - ids.length));
  }, []);

  const showFeedback = useCallback((kind: Feedback["kind"], message: string) => {
    setFeedback({ kind, message });
    setError(kind === "error" ? message : null);
  }, []);

  const filtered = useMemo(() => {
    return rows.filter((p) => {
      if (lotFilter === "run" && runId && p.extractionRun?.id !== runId) return false;
      if (actionFilter !== "all" && p.proposalType !== actionFilter) return false;
      if (!scoreInBand(p.similarityScore, scoreFilter)) return false;
      return true;
    });
  }, [rows, lotFilter, runId, actionFilter, scoreFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const paginated = useMemo(() => {
    const start = safePage * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, safePage]);

  const pageIds = useMemo(() => paginated.map((p) => p.id), [paginated]);
  const selectedOnPage = pageIds.filter((id) => selectedIds.has(id)).length;
  const allPageSelected = paginated.length > 0 && selectedOnPage === paginated.length;
  const somePageSelected = selectedOnPage > 0 && !allPageSelected;
  const selectedCount = selectedIds.size;

  const toggleOne = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAllOnPage = useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const id of pageIds) next.add(id);
      return next;
    });
  }, [pageIds]);

  const togglePageAll = useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        for (const id of pageIds) next.delete(id);
      } else {
        for (const id of pageIds) next.add(id);
      }
      return next;
    });
  }, [allPageSelected, pageIds]);

  const refreshServer = useCallback(() => {
    router.refresh();
  }, [router]);

  function onPreview() {
    setError(null);
    setFeedback(null);
    setSelectedIds(new Set());
    startTransition(async () => {
      try {
        const res = await createExtractionPreview({ workItemLimit: limit });
        showFeedback("info", `Analyse terminée : ${res.proposalCount} nouvelle${res.proposalCount !== 1 ? "s" : ""} proposition${res.proposalCount !== 1 ? "s" : ""}.`);
        router.push(`/dashboard/devis/ressources-chantier/extraction?run=${res.runId}`);
        router.refresh();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Erreur extraction";
        setError(msg);
        showFeedback("error", msg);
      }
    });
  }

  function handleBulkResult(
    res: { ok: number; failed: number; total?: number; empty?: boolean; errors?: string[] },
    emptyMsg: string,
  ) {
    if (res.empty) {
      showFeedback("info", emptyMsg);
      return;
    }
    if (res.ok > 0) showFeedback("success", formatValidated(res.ok));
    if (res.failed > 0) {
      const detail = res.errors?.length ? ` ${res.errors[0]}` : "";
      showFeedback("error", `${res.failed} échec(s) sur ${res.total ?? res.ok + res.failed}.${detail}`);
    }
    refreshServer();
  }

  function onApproveAllAlias() {
    setFeedback(null);
    startTransition(async () => {
      try {
        const scope = lotFilter === "run" && runId ? { runId } : {};
        const res = await approveAllMergeAliasProposals(scope);
        if (res.empty) {
          showFeedback("info", "Aucune proposition éligible trouvée (alias ≥ 90 %).");
          return;
        }
        if (res.failed === 0) {
          const aliasIds = rows
            .filter(
              (r) =>
                r.proposalType === "merge_as_alias" &&
                r.similarityScore >= 90 &&
                (lotFilter !== "run" || !runId || r.extractionRun?.id === runId),
            )
            .map((r) => r.id);
          removeRows(aliasIds);
        }
        handleBulkResult(res, "Aucune proposition éligible trouvée (alias ≥ 90 %).");
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Erreur lors de la validation en lot.";
        showFeedback("error", msg);
      }
    });
  }

  function onApproveAllReliable() {
    setFeedback(null);
    startTransition(async () => {
      try {
        const scope = lotFilter === "run" && runId ? { runId } : {};
        const res = await approveAllHighScorePendingProposals({ ...scope, minScore: 90 });
        if (res.empty) {
          showFeedback("info", "Aucune proposition éligible trouvée (score ≥ 90 %).");
          return;
        }
        if (res.failed === 0) {
          const reliableIds = rows
            .filter(
              (r) =>
                r.similarityScore >= 90 && (lotFilter !== "run" || !runId || r.extractionRun?.id === runId),
            )
            .map((r) => r.id);
          removeRows(reliableIds);
        }
        handleBulkResult(res, "Aucune proposition éligible trouvée (score ≥ 90 %).");
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Erreur lors de la validation en lot.";
        showFeedback("error", msg);
      }
    });
  }

  function onApproveSelected() {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    setFeedback(null);
    startTransition(async () => {
      try {
        const res = await approveGroupingProposals(ids);
        if (res.ok > 0) {
          if (res.failed === 0) removeRows(ids);
          showFeedback("success", formatValidated(res.ok));
        }
        if (res.failed > 0) {
          const detail = res.errors?.length ? ` ${res.errors[0]}` : "";
          showFeedback("error", `${res.failed} échec(s).${detail}`);
        }
        refreshServer();
      } catch (e) {
        showFeedback("error", e instanceof Error ? e.message : "Erreur de validation.");
      }
    });
  }

  function onRejectSelected() {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    setFeedback(null);
    startTransition(async () => {
      try {
        const res = await rejectGroupingProposals(ids);
        if (res.ok > 0) {
          removeRows(ids.slice(0, res.ok));
          showFeedback(
            "success",
            res.ok === 1 ? "Proposition ignorée" : `${res.ok} propositions ignorées`,
          );
        }
        if (res.failed > 0) showFeedback("error", `${res.failed} échec(s) lors de l'ignorance.`);
        refreshServer();
      } catch (e) {
        showFeedback("error", e instanceof Error ? e.message : "Erreur lors de l'ignorance.");
      }
    });
  }

  function onApproveOne(id: string) {
    setFeedback(null);
    startTransition(async () => {
      try {
        const res = await approveGroupingProposal(id);
        if (res.ok) {
          removeRows([id]);
          showFeedback("success", "1 proposition validée");
          refreshServer();
        } else {
          showFeedback("error", res.error ?? "Impossible de valider cette proposition.");
        }
      } catch (e) {
        showFeedback("error", e instanceof Error ? e.message : "Erreur de validation.");
      }
    });
  }

  function onRejectOne(id: string) {
    setFeedback(null);
    startTransition(async () => {
      try {
        const res = await rejectGroupingProposal(id);
        if (res.ok) {
          removeRows([id]);
          showFeedback("success", "Proposition ignorée");
          refreshServer();
        } else {
          showFeedback("error", res.error ?? "Impossible d'ignorer cette proposition.");
        }
      } catch (e) {
        showFeedback("error", e instanceof Error ? e.message : "Erreur lors de l'ignorance.");
      }
    });
  }

  const truncated = rows.length >= 500;

  return (
    <div className="space-y-6">
      {feedback ? (
        <div
          role="status"
          className={`rounded-xl border px-4 py-3 text-sm font-medium ${
            feedback.kind === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : feedback.kind === "error"
                ? "border-red-200 bg-red-50 text-red-800"
                : "border-sky-200 bg-sky-50 text-sky-900"
          }`}
        >
          {feedback.message}
          <button
            type="button"
            className="ml-3 text-xs underline opacity-70"
            onClick={() => setFeedback(null)}
          >
            Fermer
          </button>
        </div>
      ) : null}

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-heading text-lg font-bold text-slate-900">Prévisualisation extraction</h2>
        <p className="mt-2 text-sm text-slate-600">
          Validez les regroupements proposés (alias, variantes, nouvelles fiches). Les actions sont enregistrées
          immédiatement en base.
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="font-medium text-slate-700">Nombre d&apos;ouvrages</span>
            <input
              type="number"
              min={10}
              max={500}
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="mt-1 block w-28 rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
          <button
            type="button"
            disabled={pending}
            onClick={onPreview}
            className="rounded-xl bg-[#1d4ed8] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {pending ? "Analyse…" : "Lancer l’analyse"}
          </button>
        </div>
        {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
      </div>

      <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 px-4 py-3 text-sm text-amber-950">
        <p className="font-semibold">
          {localPendingTotal} proposition{localPendingTotal !== 1 ? "s" : ""} en attente
          {filtered.length !== rows.length ? ` · ${filtered.length} affichée(s) après filtres` : null}
        </p>
        {runId ? (
          <p className="mt-1 text-amber-900/90">
            Dernier lot analysé{runLabel ? ` : ${runLabel}` : ""}.{" "}
            <button
              type="button"
              className="font-semibold underline"
              onClick={() => {
                setLotFilter("all");
                setPage(0);
              }}
            >
              Voir toutes les propositions ({localPendingTotal})
            </button>
            {" · "}
            <button
              type="button"
              className="font-semibold underline"
              onClick={() => {
                setLotFilter("run");
                setPage(0);
              }}
            >
              Ce lot uniquement
            </button>
          </p>
        ) : null}
        {truncated ? (
          <p className="mt-1 text-xs text-amber-800">
            Affichage limité aux 500 premières propositions par score. Validez par lots pour traiter le reste.
          </p>
        ) : null}
      </div>

      {rows.length > 0 ? (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value as ActionFilter);
                setPage(0);
              }}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              aria-label="Filtrer par action"
            >
              <option value="all">Toutes les actions</option>
              <option value="merge_as_alias">Regrouper alias</option>
              <option value="new_resource">Créer nouvelle fiche</option>
              <option value="create_variant">Créer variante</option>
              <option value="keep_separate">À vérifier</option>
            </select>
            <select
              value={scoreFilter}
              onChange={(e) => {
                setScoreFilter(e.target.value as ScoreFilter);
                setPage(0);
              }}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              aria-label="Filtrer par score"
            >
              <option value="all">Tous les scores</option>
              <option value="high">90 à 100 %</option>
              <option value="medium">70 à 89 %</option>
              <option value="low">Moins de 70 %</option>
            </select>
            {runId ? (
              <select
                value={lotFilter}
                onChange={(e) => {
                  setLotFilter(e.target.value as "all" | "run");
                  setPage(0);
                }}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                aria-label="Filtrer par lot"
              >
                <option value="all">Tous les lots</option>
                <option value="run">Lot en cours</option>
              </select>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <span className="text-sm text-slate-600">
              {selectedCount === 0
                ? "Cochez une ou plusieurs lignes, ou validez ligne par ligne."
                : `${selectedCount} sélectionnée${selectedCount > 1 ? "s" : ""}`}
            </span>
            <button
              type="button"
              disabled={pending}
              onClick={selectAllOnPage}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
            >
              Tout sélectionner sur cette page
            </button>
            <button
              type="button"
              disabled={pending || selectedCount === 0}
              onClick={onApproveSelected}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
              title={selectedCount === 0 ? "Sélectionnez au moins une ligne" : undefined}
            >
              {pending ? "Traitement…" : `Valider la sélection (${selectedCount})`}
            </button>
            <button
              type="button"
              disabled={pending || selectedCount === 0}
              onClick={onRejectSelected}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Ignorer la sélection
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={onApproveAllAlias}
              className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-900 disabled:opacity-60"
            >
              Valider tous les alias ≥ 90 %
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={onApproveAllReliable}
              className="rounded-lg border border-emerald-400 bg-white px-3 py-2 text-sm font-semibold text-emerald-800 disabled:opacity-60"
            >
              Valider toutes les propositions fiables
            </button>
            {selectedCount > 0 ? (
              <button
                type="button"
                disabled={pending}
                onClick={() => setSelectedIds(new Set())}
                className="text-sm font-medium text-slate-500 hover:text-slate-800"
              >
                Tout décocher
              </button>
            ) : null}
          </div>

          {filtered.length === 0 ? (
            <p className="text-sm text-slate-500">Aucune proposition ne correspond aux filtres choisis.</p>
          ) : (
            <>
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase text-slate-600">
                    <tr>
                      <th className="w-10 px-3 py-2">
                        <input
                          type="checkbox"
                          aria-label="Tout sélectionner sur cette page"
                          checked={allPageSelected}
                          ref={(el) => {
                            if (el) el.indeterminate = somePageSelected;
                          }}
                          disabled={pending || paginated.length === 0}
                          onChange={togglePageAll}
                          className="h-4 w-4 rounded border-slate-300"
                        />
                      </th>
                      <th className="px-3 py-2">Score</th>
                      <th className="px-3 py-2">Action</th>
                      <th className="px-3 py-2">Libellé détecté</th>
                      <th className="px-3 py-2">Fiche cible</th>
                      <th className="px-3 py-2">Ouvrage</th>
                      <th className="px-3 py-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginated.map((p) => {
                      const checked = selectedIds.has(p.id);
                      return (
                        <tr key={p.id} className={checked ? "bg-emerald-50/40" : undefined}>
                          <td className="px-3 py-2">
                            <input
                              type="checkbox"
                              aria-label={`Sélectionner ${p.sourceLabel}`}
                              checked={checked}
                              disabled={pending}
                              onChange={() => toggleOne(p.id)}
                              className="h-4 w-4 rounded border-slate-300"
                            />
                          </td>
                          <td className="px-3 py-2 tabular-nums font-semibold">{p.similarityScore}</td>
                          <td className="px-3 py-2">{GROUPING_PROPOSAL_TYPE_LABELS[p.proposalType]}</td>
                          <td className="max-w-xs px-3 py-2">
                            <span className="font-medium">{p.sourceLabel}</span>
                            {p.sourceSnippet ? (
                              <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{p.sourceSnippet}</p>
                            ) : null}
                          </td>
                          <td className="px-3 py-2">{p.targetSiteResource?.shortName ?? "—"}</td>
                          <td className="px-3 py-2 text-xs text-slate-600">
                            {p.sourceWorkItem ? `${p.sourceWorkItem.code} — ${p.sourceWorkItem.title}` : "—"}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2">
                            <button
                              type="button"
                              disabled={pending}
                              className="mr-2 text-xs font-semibold text-emerald-700 hover:underline disabled:opacity-50"
                              onClick={() => onApproveOne(p.id)}
                            >
                              {pending ? "…" : "Valider"}
                            </button>
                            <button
                              type="button"
                              disabled={pending}
                              className="text-xs font-semibold text-slate-500 hover:underline disabled:opacity-50"
                              onClick={() => onRejectOne(p.id)}
                            >
                              Ignorer
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {pageCount > 1 ? (
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600">
                  <span>
                    Page {safePage + 1} / {pageCount} · {filtered.length} ligne{filtered.length > 1 ? "s" : ""}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={safePage === 0 || pending}
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      className="rounded-lg border border-slate-200 px-3 py-1 disabled:opacity-40"
                    >
                      Précédent
                    </button>
                    <button
                      type="button"
                      disabled={safePage >= pageCount - 1 || pending}
                      onClick={() => setPage((p) => p + 1)}
                      className="rounded-lg border border-slate-200 px-3 py-1 disabled:opacity-40"
                    >
                      Suivant
                    </button>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      ) : (
        <p className="text-sm text-slate-500">
          Aucune proposition en attente.{" "}
          <Link href="/dashboard/devis/ressources-chantier" className="font-semibold text-[#1d4ed8] hover:underline">
            Retour aux ressources
          </Link>
        </p>
      )}
    </div>
  );
}
