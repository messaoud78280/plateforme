"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition, useRef, useEffect } from "react";
import { duplicateDpgfAnalysisSheet } from "@/app/dashboard/devis/analyse-dpgf-actions";
import { DpgfAnalysisDeleteButton } from "@/components/devis/DpgfAnalysisDeleteButton";
import { DPGF_ANALYSIS_LEVEL_LABELS } from "@/lib/dpgf-analysis/labels";
import {
  groupDpgfAnalysisListRows,
  sortDpgfAnalysisListRowsByDpgfNumber,
  type DpgfAnalysisViewMode,
} from "@/lib/dpgf-analysis/list-order";
import type { DpgfAnalysisListRow } from "@/lib/dpgf-analysis/types";
import type { WorkItemStatus } from "@prisma/client";

type Props = {
  rows: DpgfAnalysisListRow[];
  lotLabels?: Record<string, string>;
  viewMode?: DpgfAnalysisViewMode;
};

const STATUS_DISPLAY: Record<WorkItemStatus, string> = {
  brouillon: "À analyser",
  a_verifier: "À vérifier",
  a_completer: "À clarifier",
  valide: "Validée",
  archive: "Archivée",
};

export function DpgfAnalysisListTable({ rows, lotLabels = {}, viewMode = "families" }: Props) {
  const groups = useMemo(() => groupDpgfAnalysisListRows(rows, lotLabels), [rows, lotLabels]);
  const flatByDpgf = useMemo(() => sortDpgfAnalysisListRowsByDpgfNumber(rows), [rows]);

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
        <p className="font-heading text-base font-semibold text-slate-800">Aucune fiche ne correspond à ces filtres.</p>
        <p className="mt-2 text-sm text-slate-500">
          Modifiez vos critères ou réinitialisez pour retrouver l&apos;ensemble des fiches.
        </p>
        <Link
          href="/dashboard/devis/analyse-dpgf"
          className="mt-5 inline-flex rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#162d4a]"
        >
          Réinitialiser les filtres
        </Link>
      </div>
    );
  }

  if (viewMode === "table") {
    return (
      <ListShell count={rows.length} subtitle="Tableau complet — toutes les fiches filtrées">
        <SheetTable rows={flatByDpgf} />
      </ListShell>
    );
  }

  if (viewMode === "dpgf") {
    return (
      <ListShell count={rows.length} subtitle="Ordre numérique DPGF (101, 102, 400-A…)">
        <SheetTable rows={flatByDpgf} />
      </ListShell>
    );
  }

  return (
    <ListShell count={rows.length} subtitle="Regroupées par lot et famille d'ouvrage">
      <div className="space-y-3">
        {groups.map((group) => (
          <FamilyGroupSection key={`${group.lot}-${group.familyName}-${group.familyCode ?? "na"}`} group={group} />
        ))}
      </div>
    </ListShell>
  );
}

function ListShell({ count, subtitle, children }: { count: number; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">
        {count} fiche{count > 1 ? "s" : ""} · {subtitle}
      </p>
      {children}
    </div>
  );
}

function FamilyGroupSection({
  group,
}: {
  group: ReturnType<typeof groupDpgfAnalysisListRows>[number];
}) {
  const [open, setOpen] = useState(true);
  const subtitle = [
    `${group.rows.length} fiche${group.rows.length > 1 ? "s" : ""}`,
    group.dpgfRange ? `DPGF ${group.dpgfRange}` : null,
    group.toVerifyCount > 0 ? `${group.toVerifyCount} à vérifier` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-[#eff6ff]/30 px-4 py-3 text-left hover:from-slate-100/80"
      >
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#1e3a5f]/70">
            {group.lotLabel}
            {group.familyCode ? ` · ${group.familyCode}` : ""}
          </p>
          <h3 className="font-heading mt-0.5 text-base font-bold leading-snug text-slate-900">{group.familyName}</h3>
          <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
          {group.hasGaps ? (
            <p className="mt-1.5 inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-900">
              Attention : numéros DPGF manquants ({group.missingDpgfNumbers.slice(0, 5).join(", ")}
              {group.missingDpgfNumbers.length > 5 ? "…" : ""})
            </p>
          ) : null}
        </div>
        <span className="mt-1 shrink-0 text-slate-400">{open ? "▾" : "▸"}</span>
      </button>
      {open ? <SheetTable rows={group.rows} embedded /> : null}
    </section>
  );
}

function SheetTable({ rows, embedded }: { rows: DpgfAnalysisListRow[]; embedded?: boolean }) {
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50/80 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-2.5">N° DPGF</th>
              <th className="px-4 py-2.5">Code fiche</th>
              <th className="px-4 py-2.5">Désignation</th>
              <th className="px-4 py-2.5">Famille</th>
              <th className="px-4 py-2.5">Unité</th>
              <th className="px-4 py-2.5">Niveau</th>
              <th className="px-4 py-2.5">Statut</th>
              <th className="px-4 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <SheetTableRow key={row.id} row={row} />
            ))}
          </tbody>
        </table>
      </div>

      <div className={`space-y-2 p-3 md:hidden ${embedded ? "" : ""}`}>
        {rows.map((row) => (
          <SheetMobileCard key={row.id} row={row} />
        ))}
      </div>
    </>
  );
}

function SheetTableRow({ row }: { row: DpgfAnalysisListRow }) {
  return (
    <tr className="transition hover:bg-slate-50/70">
      <td className="px-4 py-3">
        <DpgfNumberCell value={row.numeroDpgf} />
      </td>
      <td className="px-4 py-3 font-mono text-xs font-semibold text-[#1e3a5f]">{row.codeSheet}</td>
      <td className="max-w-xs px-4 py-3">
        <p className="font-medium leading-snug text-slate-900">{row.simplifiedDesignation || "—"}</p>
        <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{row.originalDesignation}</p>
      </td>
      <td className="px-4 py-3 text-sm text-slate-700">{row.familyName ?? "—"}</td>
      <td className="px-4 py-3 font-mono text-xs text-slate-600">{row.unit}</td>
      <td className="px-4 py-3 text-xs text-slate-600">{DPGF_ANALYSIS_LEVEL_LABELS[row.comprehensionLevel]}</td>
      <td className="px-4 py-3">
        <StatusBadge status={row.status} />
      </td>
      <td className="px-4 py-3 text-right">
        <RowActionsMenu row={row} />
      </td>
    </tr>
  );
}

function SheetMobileCard({ row }: { row: DpgfAnalysisListRow }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <DpgfNumberCell value={row.numeroDpgf} />
          <p className="mt-1 font-mono text-[11px] font-semibold text-[#1e3a5f]">{row.codeSheet}</p>
        </div>
        <StatusBadge status={row.status} />
      </div>
      <p className="mt-2 font-medium text-slate-900">{row.simplifiedDesignation || row.originalDesignation}</p>
      <p className="mt-1 text-xs text-slate-500">{row.familyName ?? "—"} · {row.unit}</p>
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-[11px] text-slate-500">{DPGF_ANALYSIS_LEVEL_LABELS[row.comprehensionLevel]}</span>
        <RowActionsMenu row={row} />
      </div>
    </article>
  );
}

function DpgfNumberCell({ value }: { value: string | null }) {
  if (!value) {
    return (
      <span className="inline-flex rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-800">
        À renseigner
      </span>
    );
  }
  return <span className="font-mono text-sm font-semibold tabular-nums text-slate-800">{value}</span>;
}

function RowActionsMenu({ row }: { row: DpgfAnalysisListRow }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div className="relative inline-flex items-center gap-1.5" ref={ref}>
      <Link
        href={`/dashboard/devis/analyse-dpgf/${row.id}`}
        className="rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#162d4a]"
      >
        Voir
      </Link>
      <button
        type="button"
        aria-label="Actions"
        onClick={() => setOpen((v) => !v)}
        className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm font-bold text-slate-600 hover:bg-slate-50"
      >
        ···
      </button>
      {open ? (
        <div className="absolute right-0 top-full z-20 mt-1 min-w-[10rem] overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
          <MenuLink href={`/dashboard/devis/analyse-dpgf/${row.id}/modifier`} onClick={() => setOpen(false)}>
            Modifier
          </MenuLink>
          <button
            type="button"
            disabled={pending}
            className="block w-full px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            onClick={() => {
              setOpen(false);
              startTransition(async () => {
                const res = await duplicateDpgfAnalysisSheet(row.id);
                if (res.ok) router.push(`/dashboard/devis/analyse-dpgf/${res.id}/modifier`);
                else alert(res.error);
              });
            }}
          >
            {pending ? "Duplication…" : "Dupliquer"}
          </button>
          <div className="border-t border-slate-100 px-1 py-1">
            <DpgfAnalysisDeleteButton
              id={row.id}
              codeSheet={row.codeSheet}
              label="Supprimer"
              compact
              className="w-full rounded-lg px-3 py-2 text-left text-xs font-medium text-red-700 hover:bg-red-50"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MenuLink({
  href,
  children,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
    >
      {children}
    </Link>
  );
}

function StatusBadge({ status }: { status: DpgfAnalysisListRow["status"] }) {
  const label = STATUS_DISPLAY[status];
  const cls =
    status === "valide"
      ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
      : status === "a_verifier"
        ? "bg-amber-50 text-amber-900 ring-amber-200"
        : status === "a_completer"
          ? "bg-orange-50 text-orange-900 ring-orange-200"
          : status === "brouillon"
            ? "bg-sky-50 text-sky-800 ring-sky-200"
            : "bg-slate-100 text-slate-700 ring-slate-200";
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${cls}`}>
      {label}
    </span>
  );
}
