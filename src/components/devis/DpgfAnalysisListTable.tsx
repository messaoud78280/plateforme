"use client";

import Link from "next/link";
import { useTransition } from "react";
import { duplicateDpgfAnalysisSheet } from "@/app/dashboard/devis/analyse-dpgf-actions";
import {
  DPGF_ANALYSIS_LEVEL_LABELS,
  DPGF_ANALYSIS_STATUS_LABELS,
} from "@/lib/dpgf-analysis/labels";
import { getBeWorkFamilyLabel } from "@/lib/bework-devis-family-codes";
import type { DpgfAnalysisListRow } from "@/lib/dpgf-analysis/types";

type Props = { rows: DpgfAnalysisListRow[] };

export function DpgfAnalysisListTable({ rows }: Props) {
  const [pending, startTransition] = useTransition();

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-600">
        Aucune fiche d&apos;analyse DPGF pour ces filtres. Créez une fiche manuellement ou analysez une ligne DPGF avec
        l&apos;IA.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
          <tr>
            <th className="px-4 py-3">Code</th>
            <th className="px-4 py-3">Désignation</th>
            <th className="px-4 py-3">Lot</th>
            <th className="px-4 py-3">Corps de métier</th>
            <th className="px-4 py-3">Famille</th>
            <th className="px-4 py-3">Unité</th>
            <th className="px-4 py-3">Niveau</th>
            <th className="px-4 py-3">Statut</th>
            <th className="px-4 py-3">Modifié</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-slate-50/60">
              <td className="px-4 py-3 font-mono text-xs font-semibold text-[#1e3a5f]">{row.codeSheet}</td>
              <td className="max-w-xs px-4 py-3">
                <p className="font-medium text-slate-900">{row.simplifiedDesignation || "—"}</p>
                <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{row.originalDesignation}</p>
              </td>
              <td className="px-4 py-3 text-slate-700">{row.lot}</td>
              <td className="px-4 py-3 text-slate-700">
                {row.tradeCode ? getBeWorkFamilyLabel(row.tradeCode) ?? row.tradeCode : "—"}
              </td>
              <td className="px-4 py-3 text-slate-700">{row.familyName || "—"}</td>
              <td className="px-4 py-3 font-mono text-xs">{row.unit}</td>
              <td className="px-4 py-3">{DPGF_ANALYSIS_LEVEL_LABELS[row.comprehensionLevel]}</td>
              <td className="px-4 py-3">
                <StatusBadge status={row.status} />
              </td>
              <td className="px-4 py-3 text-xs text-slate-500">
                {row.updatedAt.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap justify-end gap-2">
                  <Link
                    href={`/dashboard/devis/analyse-dpgf/${row.id}`}
                    className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-200"
                  >
                    Voir
                  </Link>
                  <Link
                    href={`/dashboard/devis/analyse-dpgf/${row.id}/modifier`}
                    className="rounded-lg bg-[#1e3a5f]/10 px-2.5 py-1.5 text-xs font-semibold text-[#1e3a5f] hover:bg-[#1e3a5f]/15"
                  >
                    Modifier
                  </Link>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        const res = await duplicateDpgfAnalysisSheet(row.id);
                        if (res.ok) window.location.href = `/dashboard/devis/analyse-dpgf/${res.id}/modifier`;
                        else alert(res.error);
                      })
                    }
                    className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Dupliquer
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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
