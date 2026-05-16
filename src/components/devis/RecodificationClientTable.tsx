"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { applyWorkItemRecodification } from "@/app/dashboard/devis/recodification-actions";
import type { RecodeProposalRow } from "@/lib/be-work-devis-recodification";
import { formatEurFrBpu } from "@/lib/be-work-devis-format";
import { WORK_ITEM_STATUS_LABELS } from "@/lib/be-work-devis-labels";

type Props = {
  initialRows: RecodeProposalRow[];
};

export function RecodificationClientTable({ initialRows }: Props) {
  const router = useRouter();
  const [ignored, setIgnored] = useState<Set<string>>(() => new Set());
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const visible = useMemo(() => initialRows.filter((r) => !ignored.has(r.id)), [initialRows, ignored]);

  function onIgnore(id: string) {
    setIgnored((prev) => new Set(prev).add(id));
  }

  function onApply(id: string) {
    setError(null);
    startTransition(async () => {
      const res = await applyWorkItemRecodification(id);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  if (initialRows.length === 0) {
    return (
      <p className="rounded-xl border border-slate-200 bg-white px-4 py-6 text-sm text-slate-600">
        Aucun ouvrage avec code <span className="font-mono font-semibold">BW-MARTIN-…</span> trouvé. Les ouvrages déjà
        recodifiés n&apos;apparaissent pas ici.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900" role="alert">
          {error}
        </div>
      ) : null}
      <p className="text-sm text-slate-600">
        Les propositions sont calculées à l&apos;affichage (famille déduite du lot, numéro libre par famille). Cliquez
        sur <strong>Appliquer</strong> pour valider ligne par ligne — rien n&apos;est modifié automatiquement.
      </p>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-[1200px] w-full border-collapse text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2">Ancien code</th>
              <th className="px-3 py-2">Nouveau code</th>
              <th className="px-3 py-2">sourceCode</th>
              <th className="px-3 py-2">sourceLine</th>
              <th className="px-3 py-2">Famille code</th>
              <th className="px-3 py-2">Lot</th>
              <th className="px-3 py-2">Famille</th>
              <th className="px-3 py-2">Titre</th>
              <th className="px-3 py-2 text-right">Prix moy. HT</th>
              <th className="px-3 py-2">Statut</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visible.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-4 py-8 text-center text-slate-500">
                  Toutes les lignes ont été traitées ou ignorées pour cette session. Rechargez la page pour revoir la
                  liste si de nouveaux imports Martin sont arrivés.
                </td>
              </tr>
            ) : (
              visible.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/70">
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-slate-800">{r.currentCode}</td>
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-xs font-bold text-[#1e3a5f]">{r.proposedNewCode}</td>
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-slate-600">{r.proposedSourceCode}</td>
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-slate-600">{r.proposedSourceLine ?? "—"}</td>
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-xs font-semibold text-slate-800">
                    {r.proposedFamilyCode}
                  </td>
                  <td className="max-w-[160px] px-3 py-2 text-xs break-words text-slate-800" title={r.lot}>
                    {r.lot}
                  </td>
                  <td className="max-w-[120px] px-3 py-2 text-xs text-slate-600" title={r.family ?? ""}>
                    {r.family?.trim() || "—"}
                  </td>
                  <td className="max-w-[220px] px-3 py-2 text-xs text-slate-900" title={r.title}>
                    {r.title}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-right font-mono text-xs">
                    {r.avgHt != null ? formatEurFrBpu(r.avgHt) : "—"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-xs">{WORK_ITEM_STATUS_LABELS[r.status]}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-right">
                    <div className="flex flex-wrap justify-end gap-1.5">
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => onApply(r.id)}
                        className="rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#152a45] disabled:opacity-50"
                      >
                        Appliquer
                      </button>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => onIgnore(r.id)}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                      >
                        Ignorer
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
