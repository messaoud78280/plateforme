"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState, useTransition } from "react";
import {
  approveAllMergeAliasProposals,
  approveGroupingProposal,
  approveGroupingProposals,
  createExtractionPreview,
  rejectGroupingProposal,
  rejectGroupingProposals,
} from "@/app/dashboard/devis/ressources-chantier-actions";
import { GROUPING_PROPOSAL_TYPE_LABELS } from "@/lib/chantier-resources/labels";

type ProposalRow = {
  id: string;
  proposalType: keyof typeof GROUPING_PROPOSAL_TYPE_LABELS;
  similarityScore: number;
  sourceLabel: string;
  sourceSnippet: string | null;
  targetSiteResource: { id: string; shortName: string } | null;
  sourceWorkItem: { id: string; code: string; title: string } | null;
};

type Props = {
  runId: string | null;
  proposals: ProposalRow[];
};

export function ChantierResourceExtractionPanel({ runId, proposals }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [limit, setLimit] = useState(150);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  const proposalIds = useMemo(() => proposals.map((p) => p.id), [proposals]);
  const selectedCount = selectedIds.size;
  const allSelected = proposals.length > 0 && selectedCount === proposals.length;
  const someSelected = selectedCount > 0 && !allSelected;

  const refresh = useCallback(() => {
    setSelectedIds(new Set());
    router.refresh();
  }, [router]);

  const toggleOne = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (prev.size === proposals.length) return new Set();
      return new Set(proposalIds);
    });
  }, [proposalIds, proposals.length]);

  function onPreview() {
    setError(null);
    setSelectedIds(new Set());
    startTransition(async () => {
      try {
        const res = await createExtractionPreview({ workItemLimit: limit });
        router.push(`/dashboard/devis/ressources-chantier/extraction?run=${res.runId}`);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur extraction");
      }
    });
  }

  function onApproveAllAlias() {
    if (!runId) return;
    startTransition(async () => {
      await approveAllMergeAliasProposals(runId);
      refresh();
    });
  }

  function onApproveSelected() {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    startTransition(async () => {
      await approveGroupingProposals(ids);
      refresh();
    });
  }

  function onRejectSelected() {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    startTransition(async () => {
      await rejectGroupingProposals(ids);
      refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-heading text-lg font-bold text-slate-900">Prévisualisation extraction</h2>
        <p className="mt-2 text-sm text-slate-600">
          Analyse les ouvrages de la bibliothèque, propose des regroupements (alias / variantes / nouvelles fiches).
          Rien n&apos;est enregistré sans votre validation. Cochez plusieurs lignes puis validez ou ignorez en lot.
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
          {runId ? (
            <button
              type="button"
              disabled={pending}
              onClick={onApproveAllAlias}
              className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-900 disabled:opacity-60"
            >
              Valider tous les alias ≥ 90 %
            </button>
          ) : null}
        </div>
        {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
      </div>

      {runId && proposals.length > 0 ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <span className="text-sm font-medium text-slate-700">
              {selectedCount === 0
                ? "Cochez les lignes à traiter en lot"
                : `${selectedCount} ligne${selectedCount > 1 ? "s" : ""} sélectionnée${selectedCount > 1 ? "s" : ""}`}
            </span>
            <button
              type="button"
              disabled={pending || selectedCount === 0}
              onClick={onApproveSelected}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {pending ? "Traitement…" : `Valider la sélection (${selectedCount})`}
            </button>
            <button
              type="button"
              disabled={pending || selectedCount === 0}
              onClick={onRejectSelected}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
            >
              Ignorer la sélection
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

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase text-slate-600">
                <tr>
                  <th className="w-10 px-3 py-2">
                    <input
                      type="checkbox"
                      aria-label="Tout sélectionner"
                      checked={allSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = someSelected;
                      }}
                      disabled={pending}
                      onChange={toggleAll}
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
                {proposals.map((p) => {
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
                      <td className="px-3 py-2 max-w-xs">
                        <span className="font-medium">{p.sourceLabel}</span>
                        {p.sourceSnippet ? (
                          <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">{p.sourceSnippet}</p>
                        ) : null}
                      </td>
                      <td className="px-3 py-2">{p.targetSiteResource?.shortName ?? "—"}</td>
                      <td className="px-3 py-2 text-xs text-slate-600">
                        {p.sourceWorkItem ? `${p.sourceWorkItem.code} — ${p.sourceWorkItem.title}` : "—"}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <button
                          type="button"
                          disabled={pending}
                          className="mr-2 text-xs font-semibold text-emerald-700 hover:underline"
                          onClick={() =>
                            startTransition(async () => {
                              await approveGroupingProposal(p.id);
                              refresh();
                            })
                          }
                        >
                          Valider
                        </button>
                        <button
                          type="button"
                          disabled={pending}
                          className="text-xs font-semibold text-slate-500 hover:underline"
                          onClick={() =>
                            startTransition(async () => {
                              await rejectGroupingProposal(p.id);
                              refresh();
                            })
                          }
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
        </div>
      ) : runId ? (
        <p className="text-sm text-slate-500">Aucune proposition en attente pour ce lot.</p>
      ) : null}
    </div>
  );
}
