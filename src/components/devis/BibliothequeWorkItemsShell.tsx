"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { WorkItemItemType, WorkItemStatus } from "@prisma/client";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { bulkDeleteWorkItems, bulkSetWorkItemsStatus } from "@/app/dashboard/devis/actions";
import { formatDateFr, formatEurFrBpu } from "@/lib/be-work-devis-format";
import { WORK_ITEM_ITEM_TYPE_LABELS, WORK_ITEM_STATUS_LABELS } from "@/lib/be-work-devis-labels";
import type { BibliothequeStats } from "@/lib/be-work-devis-search";

export type BibliothequeWorkItemRow = {
  id: string;
  code: string;
  familyCode: string | null;
  lot: string;
  family: string | null;
  title: string;
  unit: string;
  status: WorkItemStatus;
  itemType: WorkItemItemType;
  updatedAt: string;
  priceCount: number;
  avgHt: number | null;
  designation: string;
};

type ViewMode = "table" | "cards";

type Props = {
  rows: BibliothequeWorkItemRow[];
  stats: BibliothequeStats;
  view: ViewMode;
  groupLots: boolean;
};

function statusBadgeClass(status: WorkItemStatus): string {
  switch (status) {
    case "a_verifier":
      return "border border-amber-200/90 bg-amber-50/80 text-amber-900/90";
    case "valide":
      return "border border-emerald-200/80 bg-emerald-50/70 text-emerald-900";
    case "a_completer":
      return "border border-orange-200/80 bg-orange-50/70 text-orange-900";
    case "archive":
      return "border border-slate-200 bg-slate-100 text-slate-600";
    default:
      return "border border-slate-200 bg-white text-slate-600";
  }
}

function typeBadgeClass(t: WorkItemItemType): string {
  if (t === "ouvrage_technique") return "bg-[#1e3a5f]/10 text-[#0f2744] ring-1 ring-[#1e3a5f]/15";
  return "bg-slate-100 text-slate-700 ring-1 ring-slate-200/80";
}

function lotSectionStats(sub: BibliothequeWorkItemRow[]) {
  const n = sub.length;
  let w = 0;
  let s = 0;
  for (const r of sub) {
    if (r.avgHt != null && r.priceCount > 0) {
      s += r.avgHt * r.priceCount;
      w += r.priceCount;
    }
  }
  const avg = w > 0 ? s / w : null;
  return { n, avg };
}

export function BibliothequeWorkItemsShell({ rows, stats, view, groupLots }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [lotOpen, setLotOpen] = useState<Record<string, boolean>>({});

  const lotsOrdered = useMemo(
    () => [...new Set(rows.map((r) => r.lot))].sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" })),
    [rows],
  );

  useEffect(() => {
    setLotOpen((prev) => {
      const next = { ...prev };
      for (const l of lotsOrdered) {
        if (!(l in next)) next[l] = true;
      }
      return next;
    });
  }, [lotsOrdered]);

  const pushQuery = useCallback(
    (updates: Record<string, string | undefined>) => {
      const u = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
      for (const [k, v] of Object.entries(updates)) {
        if (v === undefined || v === "") u.delete(k);
        else u.set(k, v);
      }
      const q = u.toString();
      router.push(q ? `${pathname}?${q}` : pathname);
    },
    [router, pathname],
  );

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (selected.size === rows.length) setSelected(new Set());
    else setSelected(new Set(rows.map((r) => r.id)));
  }, [rows, selected.size]);

  const onBulkStatus = (status: WorkItemStatus) => {
    const ids = [...selected];
    if (!ids.length) return;
    setBulkError(null);
    startTransition(async () => {
      const res = await bulkSetWorkItemsStatus(ids, status);
      if (!res.ok) {
        setBulkError(res.error);
        return;
      }
      setSelected(new Set());
      router.refresh();
    });
  };

  const onBulkDelete = () => {
    const ids = [...selected];
    if (!ids.length) return;
    if (!window.confirm(`Supprimer définitivement ${ids.length} ouvrage(s) ? Cette action est irréversible.`)) return;
    setBulkError(null);
    startTransition(async () => {
      const res = await bulkDeleteWorkItems(ids);
      if (!res.ok) {
        setBulkError(res.error);
        return;
      }
      setSelected(new Set());
      router.refresh();
    });
  };

  const allSelected = rows.length > 0 && selected.size === rows.length;
  const someSelected = selected.size > 0;

  const renderRowCells = (row: BibliothequeWorkItemRow) => (
    <>
      <td className="px-2 py-2 align-middle">
        <input
          type="checkbox"
          className="rounded border-slate-300"
          checked={selected.has(row.id)}
          onChange={() => toggleSelect(row.id)}
          aria-label={`Sélectionner ${row.code}`}
        />
      </td>
      <td className="whitespace-nowrap px-2 py-2 font-mono text-xs font-semibold text-[#1e3a5f]">{row.code}</td>
      <td className="whitespace-nowrap px-2 py-2 font-mono text-[11px] text-slate-700">{row.familyCode?.trim() || "—"}</td>
      <td className="max-w-[200px] px-2 py-2 text-xs text-slate-800 break-words" title={row.lot}>
        {row.lot}
      </td>
      <td className="whitespace-nowrap px-2 py-2">
        <span className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold ${typeBadgeClass(row.itemType)}`}>
          {WORK_ITEM_ITEM_TYPE_LABELS[row.itemType]}
        </span>
      </td>
      <td className="max-w-[120px] truncate px-2 py-2 text-xs text-slate-600" title={row.family ?? ""}>
        {row.family?.trim() || "—"}
      </td>
      <td className="max-w-[min(28vw,320px)] px-2 py-2">
        <div className="text-xs font-semibold text-slate-900 line-clamp-1" title={row.title}>
          {row.title}
        </div>
        <div className="mt-0.5 text-[11px] leading-snug text-slate-500 line-clamp-2" title={row.designation}>
          {row.designation || "—"}
        </div>
      </td>
      <td className="whitespace-nowrap px-2 py-2 text-xs">{row.unit}</td>
      <td className="whitespace-nowrap px-2 py-2 text-right font-mono text-xs tabular-nums">
        {row.avgHt != null ? formatEurFrBpu(row.avgHt) : "—"}
      </td>
      <td className="whitespace-nowrap px-2 py-2 text-right tabular-nums text-xs">{row.priceCount}</td>
      <td className="whitespace-nowrap px-2 py-2">
        <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${statusBadgeClass(row.status)}`}>
          {WORK_ITEM_STATUS_LABELS[row.status]}
        </span>
      </td>
      <td className="whitespace-nowrap px-2 py-2 text-right text-xs">
        <div className="flex flex-wrap justify-end gap-1.5">
          <Link
            href={`/dashboard/devis/bibliotheque/${row.id}`}
            className="rounded-md border border-slate-200 bg-white px-2 py-1 font-semibold text-[#1e3a5f] hover:bg-slate-50"
          >
            Voir
          </Link>
          <Link
            href={`/dashboard/devis/bibliotheque/${row.id}/modifier`}
            className="rounded-md border border-[#1e3a5f]/25 bg-[#f4f7fb] px-2 py-1 font-semibold text-[#1e3a5f] hover:bg-[#e8eef6]"
          >
            Modifier
          </Link>
        </div>
      </td>
    </>
  );

  const tableBlock = (subset: BibliothequeWorkItemRow[]) => (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-[1280px] w-full text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50/90 text-[11px] font-bold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="w-10 px-2 py-2">
              <input
                type="checkbox"
                className="rounded border-slate-300"
                checked={allSelected}
                onChange={selectAll}
                aria-label="Tout sélectionner"
              />
            </th>
            <th className="px-2 py-2">Code BeWork</th>
            <th className="px-2 py-2">Famille code</th>
            <th className="px-2 py-2">Lot</th>
            <th className="px-2 py-2">Type</th>
            <th className="px-2 py-2">Famille</th>
            <th className="px-2 py-2">Désignation</th>
            <th className="px-2 py-2">Unité</th>
            <th className="px-2 py-2 text-right">Prix moy. HT</th>
            <th className="px-2 py-2 text-right">Nb prix</th>
            <th className="px-2 py-2">Statut</th>
            <th className="px-2 py-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {subset.map((row) => (
            <tr key={row.id} className="hover:bg-slate-50/60">
              {renderRowCells(row)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const cardsBlock = (subset: BibliothequeWorkItemRow[]) => (
    <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {subset.map((row) => (
        <li
          key={row.id}
          className="flex flex-col rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-[#1e3a5f]/20"
        >
          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              className="mt-1 rounded border-slate-300"
              checked={selected.has(row.id)}
              onChange={() => toggleSelect(row.id)}
              aria-label={`Sélectionner ${row.code}`}
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[11px] font-bold text-[#1e3a5f]" title="Code BeWork">
                  {row.code}
                </span>
                {row.familyCode ? (
                  <span className="font-mono text-[10px] font-semibold text-sky-900" title="Code famille">
                    {row.familyCode}
                  </span>
                ) : null}
                <span className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold ${typeBadgeClass(row.itemType)}`}>
                  {WORK_ITEM_ITEM_TYPE_LABELS[row.itemType]}
                </span>
                <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${statusBadgeClass(row.status)}`}>
                  {WORK_ITEM_STATUS_LABELS[row.status]}
                </span>
              </div>
              <p className="mt-1 text-xs font-semibold leading-snug text-slate-900">{row.title}</p>
              <p className="mt-1 break-words text-[11px] leading-snug text-slate-600" title={row.lot}>
                <span className="font-semibold text-slate-500">Lot · </span>
                {row.lot}
              </p>
              <dl className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-slate-600">
                <div>
                  <dt className="font-semibold text-slate-500">Famille code</dt>
                  <dd className="font-mono">{row.familyCode?.trim() || "—"}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-500">Unité</dt>
                  <dd>{row.unit}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-500">Prix moy. HT</dt>
                  <dd className="font-mono">{row.avgHt != null ? formatEurFrBpu(row.avgHt) : "—"}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-500">Nb prix</dt>
                  <dd>{row.priceCount}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-500">Mise à jour</dt>
                  <dd>{formatDateFr(row.updatedAt)}</dd>
                </div>
              </dl>
            </div>
          </div>
          <div className="mt-3 flex gap-2 border-t border-slate-100 pt-2">
            <Link
              href={`/dashboard/devis/bibliotheque/${row.id}`}
              className="inline-flex flex-1 items-center justify-center rounded-lg bg-[#1e3a5f] px-3 py-2 text-center text-xs font-semibold text-white hover:bg-[#152a45]"
            >
              Voir fiche
            </Link>
            <Link
              href={`/dashboard/devis/bibliotheque/${row.id}/modifier`}
              className="inline-flex flex-1 items-center justify-center rounded-lg border border-[#1e3a5f]/30 bg-white px-3 py-2 text-center text-xs font-semibold text-[#1e3a5f] hover:bg-slate-50"
            >
              Modifier
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Vue</span>
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
            <button
              type="button"
              disabled={isPending}
              onClick={() => pushQuery({ view: "table" })}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                view === "table" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Tableau
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => pushQuery({ view: "cards" })}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                view === "cards" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Cartes
            </button>
          </div>
          <label className="ml-0 flex cursor-pointer items-center gap-2 text-sm text-slate-700 lg:ml-4">
            <input
              type="checkbox"
              checked={groupLots}
              onChange={(e) => pushQuery({ groupLots: e.target.checked ? "1" : undefined })}
            />
            <span>Regrouper par lot</span>
          </label>
        </div>
        <p className="text-xs text-slate-500">
          {stats.totalRows} résultat(s) · tri et filtres via le formulaire ci-dessus
        </p>
      </div>

      {bulkError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900" role="alert">
          {bulkError}
        </p>
      ) : null}

      {someSelected ? (
        <div className="flex flex-col gap-3 rounded-xl border border-[#1e3a5f]/20 bg-[#f8fafc] px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center">
          <span className="text-sm font-semibold text-slate-800">
            {selected.size} ouvrage(s) sélectionné(s)
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={() => onBulkStatus("valide")}
              className="rounded-lg bg-emerald-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-900 disabled:opacity-50"
            >
              Passer en « Validé »
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => onBulkStatus("a_verifier")}
              className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-50 disabled:opacity-50"
            >
              Passer en « À vérifier »
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => onBulkStatus("archive")}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
            >
              Archiver
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={onBulkDelete}
              className="rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-900 hover:bg-red-100 disabled:opacity-50"
            >
              Supprimer…
            </button>
          </div>
        </div>
      ) : null}

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
          <p className="text-slate-600">Aucun ouvrage ne correspond aux filtres.</p>
        </div>
      ) : view === "table" ? (
        groupLots ? (
          <div className="space-y-4">
            {lotsOrdered.map((lot) => {
              const sub = rows.filter((r) => r.lot === lot);
              const { n, avg } = lotSectionStats(sub);
              const open = lotOpen[lot] !== false;
              return (
                <section key={lot} className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <button
                    type="button"
                    onClick={() => setLotOpen((p) => ({ ...p, [lot]: !open }))}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50/80"
                  >
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-slate-900 break-words">{lot}</h3>
                      <p className="mt-0.5 text-xs text-slate-600">
                        {n} ouvrage(s)
                        {avg != null ? (
                          <>
                            {" "}
                            · Prix moyen pondéré HT : <span className="font-mono font-semibold">{formatEurFrBpu(avg)}</span>
                          </>
                        ) : (
                          " · Pas de moyenne HT (prix absents)"
                        )}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs font-semibold text-[#1e3a5f]">{open ? "Réduire" : "Développer"}</span>
                  </button>
                  {open ? <div className="border-t border-slate-100 p-2">{tableBlock(sub)}</div> : null}
                </section>
              );
            })}
          </div>
        ) : (
          tableBlock(rows)
        )
      ) : groupLots ? (
        <div className="space-y-4">
          {lotsOrdered.map((lot) => {
            const sub = rows.filter((r) => r.lot === lot);
            const { n, avg } = lotSectionStats(sub);
            const open = lotOpen[lot] !== false;
            return (
              <section key={lot} className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <button
                  type="button"
                  onClick={() => setLotOpen((p) => ({ ...p, [lot]: !open }))}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50/80"
                >
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 break-words">{lot}</h3>
                    <p className="mt-0.5 text-xs text-slate-600">
                      {n} ouvrage(s)
                      {avg != null ? (
                        <>
                          {" "}
                          · Prix moyen pondéré HT : <span className="font-mono font-semibold">{formatEurFrBpu(avg)}</span>
                        </>
                      ) : null}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-[#1e3a5f]">{open ? "Réduire" : "Développer"}</span>
                </button>
                {open ? <div className="border-t border-slate-100 p-3">{cardsBlock(sub)}</div> : null}
              </section>
            );
          })}
        </div>
      ) : (
        cardsBlock(rows)
      )}
    </div>
  );
}
