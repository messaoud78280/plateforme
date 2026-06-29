"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useTransition } from "react";
import { duplicateDpgfAnalysisSheet } from "@/app/dashboard/devis/analyse-dpgf-actions";
import { DpgfAnalysisDeleteButton } from "@/components/devis/DpgfAnalysisDeleteButton";
import {
  DPGF_ANALYSIS_LEVEL_LABELS,
  DPGF_ANALYSIS_STATUS_LABELS,
} from "@/lib/dpgf-analysis/labels";
import { readIntervenantConcerneRaw } from "@/lib/dpgf-analysis/intervenant-concerne";
import { groupDpgfAnalysisListRows } from "@/lib/dpgf-analysis/list-order";
import type { DpgfAnalysisListRow } from "@/lib/dpgf-analysis/types";

type Props = { rows: DpgfAnalysisListRow[]; lotLabels?: Record<string, string> };

export function DpgfAnalysisListTable({ rows, lotLabels = {} }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const groups = useMemo(() => groupDpgfAnalysisListRows(rows, lotLabels), [rows, lotLabels]);

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-600">
        Aucune fiche d&apos;analyse DPGF pour ces filtres. Créez une fiche manuellement ou analysez une ligne DPGF avec
        l&apos;IA.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500">
        {rows.length} fiche{rows.length > 1 ? "s" : ""} · classées par lot, puis par famille d&apos;ouvrage, puis par
        code fiche.
      </p>

      {groups.map((group) => (
        <section
          key={`${group.lot}-${group.familyName}-${group.familyCode ?? "na"}`}
          className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm"
        >
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-[#f8fafc] to-[#eff6ff]/40 px-4 py-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#1e3a5f]/70">
                {group.lotLabel}
                {group.familyCode ? ` · ${group.familyCode}` : ""}
              </p>
              <h3 className="font-heading mt-0.5 text-base font-bold leading-snug text-slate-900">{group.familyName}</h3>
            </div>
            <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
              {group.rows.length} fiche{group.rows.length > 1 ? "s" : ""}
            </span>
          </header>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-2.5">Code</th>
                  <th className="px-4 py-2.5">Désignation</th>
                  <th className="px-4 py-2.5">Intervenant</th>
                  <th className="px-4 py-2.5">Unité</th>
                  <th className="px-4 py-2.5">Niveau</th>
                  <th className="px-4 py-2.5">Statut</th>
                  <th className="px-4 py-2.5">Modifié</th>
                  <th className="px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {group.rows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-[#1e3a5f]">{row.codeSheet}</td>
                    <td className="max-w-sm px-4 py-3">
                      <p className="font-medium text-slate-900">{row.simplifiedDesignation || "—"}</p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{row.originalDesignation}</p>
                    </td>
                    <td className="max-w-xs px-4 py-3 text-slate-700">
                      <p className="line-clamp-2 text-sm">
                        {readIntervenantConcerneRaw(row.intervenantConcerne) || "À définir selon le marché"}
                      </p>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{row.unit}</td>
                    <td className="px-4 py-3">{DPGF_ANALYSIS_LEVEL_LABELS[row.comprehensionLevel]}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {row.updatedAt.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3">
                      <RowActions row={row} pending={pending} onDuplicate={(id) => {
                        startTransition(async () => {
                          const res = await duplicateDpgfAnalysisSheet(id);
                          if (res.ok) router.push(`/dashboard/devis/analyse-dpgf/${res.id}/modifier`);
                          else alert(res.error);
                        });
                      }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}

function RowActions({
  row,
  pending,
  onDuplicate,
}: {
  row: DpgfAnalysisListRow;
  pending: boolean;
  onDuplicate: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap justify-end gap-1.5">
      <Link
        href={`/dashboard/devis/analyse-dpgf/${row.id}`}
        className="rounded-lg bg-[#1e3a5f] px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-[#162d4a]"
      >
        Voir
      </Link>
      <Link
        href={`/dashboard/devis/analyse-dpgf/${row.id}/modifier`}
        className="rounded-lg border border-[#1e3a5f]/20 bg-white px-2.5 py-1.5 text-xs font-semibold text-[#1e3a5f] hover:bg-[#1e3a5f]/5"
      >
        Modifier
      </Link>
      <button
        type="button"
        disabled={pending}
        onClick={() => onDuplicate(row.id)}
        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
      >
        Dupliquer
      </button>
      <DpgfAnalysisDeleteButton id={row.id} codeSheet={row.codeSheet} compact />
    </div>
  );
}

function StatusBadge({ status }: { status: DpgfAnalysisListRow["status"] }) {
  const label = DPGF_ANALYSIS_STATUS_LABELS[status];
  const cls =
    status === "valide"
      ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
      : status === "a_verifier"
        ? "bg-amber-50 text-amber-900 ring-amber-200"
        : status === "a_completer"
          ? "bg-orange-50 text-orange-900 ring-orange-200"
          : "bg-slate-100 text-slate-700 ring-slate-200";
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${cls}`}>{label}</span>;
}
