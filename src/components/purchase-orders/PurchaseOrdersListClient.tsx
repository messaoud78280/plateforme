"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type {
  PurchaseOrderListRow,
  PurchaseOrderListSummary,
} from "@/lib/purchase-orders/list-view";
import { urgencyRank } from "@/lib/follow-up/urgency";
import { projectSupplierHref } from "@/lib/messagerie/resolve-conversation";
import { cn } from "@/lib/cn";

type SortId = "attention" | "delivery" | "recent" | "number";
type NavId = "treat" | "deliveries" | "all";
type FilterChip =
  | "all"
  | "a_confirmer"
  | "confirmee"
  | "partielle"
  | "recue"
  | "week";

type Props = {
  rows: PurchaseOrderListRow[];
  summary: PurchaseOrderListSummary;
  canCreate: boolean;
  canOpenSupplier: boolean;
};

function fmtDelivery(iso: string | null): { date: string; time: string } | null {
  if (!iso) return null;
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
    time: d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
  };
}

function receiptLabel(r: PurchaseOrderListRow): string {
  const o = Math.round(r.orderedQty);
  const rec = Math.round(r.receivedQty);
  if (r.fullyReceived && o > 0) return `${rec} / ${o} reçus ✓`;
  return `${rec} / ${o} reçus`;
}

function isDeliveryToday(iso: string | null): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function AttentionBadge({ row }: { row: PurchaseOrderListRow }) {
  if (!row.attentionShort && !row.attentionWhy) return null;
  const urgent =
    row.attentionUrgency === "URGENT" || row.attentionUrgency === "CRITIQUE";
  if (!row.attentionActive && !row.nextActionNeedsUser) return null;
  return (
    <div className="max-w-[11rem]">
      {row.attentionShort ? (
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold",
            urgent ? "bg-red-50 text-red-800" : "bg-amber-50 text-amber-900",
          )}
        >
          {urgent ? "URGENT" : row.attentionShort}
        </span>
      ) : null}
      {row.attentionWhy ? (
        <p className="mt-0.5 text-[10px] font-medium leading-snug text-slate-600">
          {row.attentionWhy}
        </p>
      ) : null}
    </div>
  );
}

function NextActionCell({
  row,
  canCreate,
}: {
  row: PurchaseOrderListRow;
  canCreate: boolean;
}) {
  if (!row.nextActionLabel || row.nextActionLabel === "—") {
    return <span className="text-slate-400">—</span>;
  }
  const clickable =
    canCreate &&
    row.nextActionHref &&
    row.nextActionNeedsUser &&
    (row.nextActionHref.includes("/reception") ? row.canReceive : true);
  if (clickable && row.nextActionHref) {
    return (
      <Link
        href={row.nextActionHref}
        onClick={(e) => e.stopPropagation()}
        className="text-[12px] font-bold text-[#1e3a5f] hover:underline"
      >
        {row.nextActionLabel}
      </Link>
    );
  }
  return (
    <span
      className={cn(
        "text-[12px] font-semibold",
        row.nextActionNeedsUser ? "text-slate-900" : "text-slate-500",
      )}
    >
      {row.nextActionLabel}
    </span>
  );
}

function RowMenu({
  row,
  canCreate,
}: {
  row: PurchaseOrderListRow;
  canCreate: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        className="rounded-md px-2 py-1 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-800"
        aria-label="Actions"
        onClick={() => setOpen((v) => !v)}
      >
        •••
      </button>
      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-10 cursor-default"
            aria-label="Fermer"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-20 mt-1 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
            <Link
              href={`/dashboard/commandes/${row.id}`}
              className="block px-3 py-2 text-sm text-slate-800 hover:bg-slate-50"
            >
              Voir la commande
            </Link>
            {row.canMessage && row.projectId ? (
              <Link
                href={projectSupplierHref(row.projectId, row.supplierId)}
                className="block px-3 py-2 text-sm text-slate-800 hover:bg-slate-50"
              >
                Message fournisseur
              </Link>
            ) : null}
            {row.agendaEventId ? (
              <Link
                href={`/dashboard/agenda?event=${row.agendaEventId}`}
                className="block px-3 py-2 text-sm text-slate-800 hover:bg-slate-50"
              >
                Voir dans Agenda
              </Link>
            ) : null}
            {canCreate && row.canReceive ? (
              <Link
                href={`/dashboard/commandes/${row.id}/reception`}
                className="block px-3 py-2 text-sm text-slate-800 hover:bg-slate-50"
              >
                Réceptionner
              </Link>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}

export function PurchaseOrdersListClient({
  rows,
  summary,
  canCreate,
  canOpenSupplier,
}: Props) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [nav, setNav] = useState<NavId>(summary.toTreat > 0 ? "treat" : "all");
  const [chip, setChip] = useState<FilterChip>("all");
  const [sort, setSort] = useState<SortId>("attention");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filtered = useMemo(() => {
    let list = [...rows];
    if (q.trim()) {
      const needle = q.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.number.toLowerCase().includes(needle) ||
          r.supplierName.toLowerCase().includes(needle) ||
          (r.projectTitle ?? "").toLowerCase().includes(needle) ||
          r.subjectShort.toLowerCase().includes(needle),
      );
    }
    if (nav === "treat") {
      list = list.filter((r) => r.nextActionNeedsUser || r.attentionActive);
    }
    if (nav === "deliveries") {
      list = list.filter(
        (r) =>
          isDeliveryToday(r.deliveryAt) ||
          r.nextActionCode === "RELANCER_LIVRAISON_EN_RETARD" ||
          r.nextActionCode === "RECEPTIONNER",
      );
    }
    if (chip === "a_confirmer") {
      list = list.filter((r) => r.status === "A_CONFIRMER" || r.status === "ENVOYEE_FOURNISSEUR");
    }
    if (chip === "confirmee") {
      list = list.filter((r) => r.status === "CONFIRMEE" || r.status === "LIVRAISON_PROGRAMMEE");
    }
    if (chip === "partielle") list = list.filter((r) => r.status === "PARTIELLEMENT_RECUE");
    if (chip === "recue") list = list.filter((r) => r.status === "RECUE" || r.status === "CLOTUREE");
    if (chip === "week") {
      const now = new Date();
      const day = now.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      const start = new Date(now);
      start.setDate(now.getDate() + diff);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(start.getDate() + 7);
      list = list.filter((r) => {
        if (!r.deliveryAt) return false;
        const d = new Date(r.deliveryAt);
        return d >= start && d < end;
      });
    }

    list.sort((a, b) => {
      if (sort === "number") return a.number.localeCompare(b.number, "fr");
      if (sort === "recent") {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
      if (sort === "delivery") {
        const da = a.deliveryAt ? new Date(a.deliveryAt).getTime() : Number.POSITIVE_INFINITY;
        const db = b.deliveryAt ? new Date(b.deliveryAt).getTime() : Number.POSITIVE_INFINITY;
        return da - db;
      }
      if (a.nextActionNeedsUser !== b.nextActionNeedsUser) {
        return a.nextActionNeedsUser ? -1 : 1;
      }
      const ua = a.attentionUrgency ? urgencyRank(a.attentionUrgency) : -1;
      const ub = b.attentionUrgency ? urgencyRank(b.attentionUrgency) : -1;
      if (ub !== ua) return ub - ua;
      const da = a.deliveryAt ? new Date(a.deliveryAt).getTime() : Number.POSITIVE_INFINITY;
      const db = b.deliveryAt ? new Date(b.deliveryAt).getTime() : Number.POSITIVE_INFINITY;
      return da - db;
    });
    return list;
  }, [rows, q, chip, sort, nav]);

  const chips: { id: FilterChip; label: string }[] = [
    { id: "all", label: "État · tous" },
    { id: "a_confirmer", label: "À confirmer" },
    { id: "confirmee", label: "Confirmées" },
    { id: "partielle", label: "Partielles" },
    { id: "recue", label: "Reçues" },
    { id: "week", label: "Cette semaine" },
  ];

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-[1.75rem] font-semibold tracking-tight text-bework-ink sm:text-[1.875rem]">
          Commandes
        </h1>
        <p className="text-[0.9375rem] text-bework-muted">
          Ce qui demande une action, ce qui arrive, ce qui a été reçu.
        </p>
      </header>

      {summary.total > 0 ? (
        <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs font-medium text-slate-600">
          {summary.toTreat > 0 ? (
            <span className="tabular-nums font-semibold text-amber-900">
              {summary.toTreat} à traiter
            </span>
          ) : (
            <span className="tabular-nums text-slate-500">0 à traiter</span>
          )}
          {summary.deliveriesToday > 0 ? (
            <span className="tabular-nums">
              {summary.deliveriesToday} aujourd&apos;hui
            </span>
          ) : null}
          {summary.overdue > 0 ? (
            <span className="tabular-nums text-red-800">{summary.overdue} en retard</span>
          ) : null}
          {summary.deliveriesThisWeek > 0 ? (
            <span className="tabular-nums">
              {summary.deliveriesThisWeek} cette semaine
            </span>
          ) : null}
        </p>
      ) : null}

      <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
        {(
          [
            ["treat", "À traiter"],
            ["deliveries", "Livraisons"],
            ["all", "Toutes"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setNav(id)}
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 text-xs font-bold",
              nav === id ? "bg-[#1e3a5f] text-white" : "text-slate-600 hover:bg-white",
            )}
          >
            {label}
            {id === "treat" && summary.toTreat > 0 ? ` · ${summary.toTreat}` : ""}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="BC, fournisseur, chantier…"
          className="bw-search min-w-0 flex-1"
        />
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            className="btn-cc-secondary !min-h-10 !px-3 !text-xs"
          >
            Filtres
          </button>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortId)}
            className="min-h-10 rounded-[var(--cc-radius)] border border-[color:var(--cc-chrome-border)] bg-white px-2 text-xs font-medium text-bework-ink"
            aria-label="Trier"
          >
            <option value="attention">Action / attention</option>
            <option value="delivery">Livraison</option>
            <option value="recent">Plus récentes</option>
            <option value="number">Référence</option>
          </select>
          {canCreate ? (
            <Link href="/dashboard/commandes/nouvelle" className="btn-cc-primary !min-h-10 !text-xs">
              + Nouvelle
            </Link>
          ) : null}
        </div>
      </div>

      {filtersOpen ? (
        <div className="flex flex-wrap gap-1.5">
          {chips.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setChip(c.id)}
              className={cn(
                "rounded-full px-2.5 py-1 text-[11px] font-semibold",
                chip === c.id
                  ? "bg-[#1e3a5f] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200",
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      ) : null}

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white px-5 py-10 text-center">
          <p className="text-sm font-semibold text-slate-900">Aucune commande pour le moment.</p>
          <p className="mt-1 text-sm text-slate-600">
            Créez une commande lorsque vous devez suivre un achat ou une livraison fournisseur.
          </p>
          {canCreate ? (
            <Link
              href="/dashboard/commandes/nouvelle"
              className="mt-4 inline-flex rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white"
            >
              + Nouvelle commande
            </Link>
          ) : null}
        </div>
      ) : filtered.length === 0 ? (
        <p className="rounded-lg border border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-600">
          {nav === "treat"
            ? "Rien à traiter pour le moment."
            : "Aucune commande ne correspond à ces filtres."}
        </p>
      ) : (
        <>
          <div className="cc-list-surface hidden md:block">
            <table className="w-full min-w-[920px] border-collapse text-left text-[0.875rem]">
              <thead>
                <tr className="border-b border-[color:var(--cc-border)] text-[12px] font-medium text-bework-muted">
                  <th className="px-3 py-2.5">Fournisseur / Réf.</th>
                  <th className="px-3 py-2.5">Chantier</th>
                  <th className="px-3 py-2.5">Objet</th>
                  <th className="px-3 py-2.5">Livraison</th>
                  <th className="px-3 py-2.5">Réception</th>
                  <th className="px-3 py-2.5">Prochaine action</th>
                  <th className="px-3 py-2.5">Attention</th>
                  <th className="w-10 px-2 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => {
                  const del = fmtDelivery(row.deliveryAt);
                  return (
                    <tr
                      key={row.id}
                      role="link"
                      tabIndex={0}
                      onClick={() => router.push(`/dashboard/commandes/${row.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          router.push(`/dashboard/commandes/${row.id}`);
                        }
                      }}
                      className="cc-list-row cursor-pointer border-b border-[color:var(--cc-border)] last:border-b-0"
                    >
                      <td className="px-3 py-3 align-top">
                        <p className="text-[13px] font-semibold uppercase tracking-wide text-bework-navy">
                          {canOpenSupplier ? (
                            <Link
                              href={`/dashboard/fournisseurs/${row.supplierId}`}
                              onClick={(e) => e.stopPropagation()}
                              className="hover:underline"
                            >
                              {row.supplierName}
                            </Link>
                          ) : (
                            row.supplierName
                          )}
                        </p>
                        <p className="mt-0.5 font-semibold tabular-nums text-slate-900">{row.number}</p>
                      </td>
                      <td className="px-3 py-3 align-top text-slate-700">
                        {row.projectId ? (
                          <Link
                            href={`/dashboard/projets/${row.projectId}?returnTo=${encodeURIComponent("/dashboard/commandes")}`}
                            onClick={(e) => e.stopPropagation()}
                            className="font-medium text-slate-800 hover:underline"
                          >
                            {row.projectTitleShort ?? "—"}
                          </Link>
                        ) : (
                          (row.projectTitleShort ?? "—")
                        )}
                      </td>
                      <td className="max-w-[200px] px-3 py-3 align-top text-slate-800">
                        <span className="line-clamp-2">{row.subjectShort}</span>
                      </td>
                      <td className="px-3 py-3 align-top">
                        {del ? (
                          <div>
                            <p className="font-semibold tabular-nums text-slate-900">
                              {isDeliveryToday(row.deliveryAt) ? "Aujourd'hui · " : ""}
                              {del.date} · {del.time}
                            </p>
                            {row.deliveryLabel ? (
                              <p className="text-[11px] text-slate-500">{row.deliveryLabel}</p>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3 align-top font-medium tabular-nums text-slate-800">
                        {receiptLabel(row)}
                      </td>
                      <td className="px-3 py-3 align-top">
                        <NextActionCell row={row} canCreate={canCreate} />
                      </td>
                      <td className="px-3 py-3 align-top">
                        <AttentionBadge row={row} />
                      </td>
                      <td className="px-2 py-3 align-top">
                        <RowMenu row={row} canCreate={canCreate} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <ul className="space-y-2 md:hidden">
            {filtered.map((row) => {
              const del = fmtDelivery(row.deliveryAt);
              return (
                <li key={row.id}>
                  <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-3 shadow-sm">
                    <Link href={`/dashboard/commandes/${row.id}`} className="block">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-[11px] font-extrabold uppercase tracking-wide text-[#1e3a5f]">
                            {row.supplierName}
                          </p>
                          <p className="font-bold tabular-nums text-slate-900">{row.number}</p>
                        </div>
                        <AttentionBadge row={row} />
                      </div>
                      <p className="mt-1 text-sm text-slate-600">
                        {row.projectTitleShort ?? "—"}
                      </p>
                      <p className="mt-0.5 text-sm font-medium text-slate-900">{row.subjectShort}</p>
                      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600">
                        {del ? (
                          <span className="font-semibold tabular-nums text-slate-800">
                            {isDeliveryToday(row.deliveryAt) ? "Aujourd'hui · " : ""}
                            {del.date} · {del.time}
                            {row.deliveryLabel ? ` · ${row.deliveryLabel}` : ""}
                          </span>
                        ) : null}
                        <span className="tabular-nums">{receiptLabel(row)}</span>
                      </div>
                      <p className="mt-2 text-[12px] font-bold text-slate-900">
                        {row.nextActionLabel}
                      </p>
                    </Link>
                    {canCreate &&
                    row.nextActionNeedsUser &&
                    row.nextActionHref?.includes("/reception") &&
                    row.canReceive ? (
                      <Link
                        href={row.nextActionHref}
                        className="mt-2 inline-flex rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-xs font-bold text-white"
                      >
                        Réceptionner
                      </Link>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
