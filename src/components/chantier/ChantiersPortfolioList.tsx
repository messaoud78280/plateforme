"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DeleteChantierButton } from "@/components/chantier/DeleteChantierButton";
import type { PortfolioProjectRow } from "@/lib/chantier/portfolio";
import { cn } from "@/lib/cn";

export type SortId = "attention" | "recent" | "nom" | "statut";

type Props = {
  rows: PortfolioProjectRow[];
  initialSearch?: string;
  initialStatus?: string;
  canCreate: boolean;
  createSlot?: React.ReactNode;
};

function formatEventWhen(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRelativeActivity(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "À l’instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `il y a ${diffH} h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `il y a ${diffD} j`;
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function AttentionSignal({ row }: { row: PortfolioProjectRow }) {
  if (!row.attentionLabel) return null;
  const critical = row.attentionLevel === "critical" || row.attentionLevel === "urgent";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[12.5px] font-semibold",
        critical ? "text-red-700" : "text-amber-800",
      )}
    >
      <span
        className={cn(
          "inline-block h-1.5 w-1.5 rounded-full",
          critical ? "bg-red-500" : "bg-amber-500",
        )}
        aria-hidden
      />
      {row.attentionLabel}
    </span>
  );
}

function RowMenu({ row }: { row: PortfolioProjectRow }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        className="rounded-md px-2 py-1 text-sm text-slate-400 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-slate-100 hover:text-slate-800 focus:opacity-100"
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
          <div className="absolute right-0 z-20 mt-1 w-52 overflow-hidden rounded-[var(--bw-radius-panel,1.125rem)] border border-slate-200/80 bg-white py-1 shadow-lg">
            <Link
              href={row.href}
              className="block px-3 py-2 text-sm text-slate-800 hover:bg-slate-50"
            >
              Ouvrir
            </Link>
            <Link
              href={`/dashboard/messagerie?view=chantiers&project=${row.id}`}
              className="block px-3 py-2 text-sm text-slate-800 hover:bg-slate-50"
            >
              Message équipe
            </Link>
            <Link
              href={`/dashboard/agenda?project=${row.id}`}
              className="block px-3 py-2 text-sm text-slate-800 hover:bg-slate-50"
            >
              Agenda
            </Link>
            <Link
              href={`/dashboard/projets/${row.id}?tab=documents`}
              className="block px-3 py-2 text-sm text-slate-800 hover:bg-slate-50"
            >
              Documents
            </Link>
            {row.canDelete ? (
              <>
                <div className="my-1 border-t border-slate-100" />
                <div className="px-2 py-1">
                  <DeleteChantierButton
                    projectId={row.id}
                    projectTitle={row.title}
                    label="Supprimer définitivement"
                    className="!w-full !justify-start !rounded-md !border-0 !bg-transparent !px-2 !py-2 !text-left !text-sm !font-normal !text-red-600 hover:!bg-red-50"
                  />
                </div>
              </>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}

export function ChantiersPortfolioList({
  rows,
  initialSearch = "",
  initialStatus = "",
  createSlot,
}: Props) {
  const router = useRouter();
  const [q, setQ] = useState(initialSearch);
  const [debouncedQ, setDebouncedQ] = useState(initialSearch);
  const [status, setStatus] = useState(initialStatus);
  const [sort, setSort] = useState<SortId>("attention");
  const [attentionOnly, setAttentionOnly] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(q.trim()), 280);
    return () => window.clearTimeout(t);
  }, [q]);

  const filtered = useMemo(() => {
    let list = [...rows];
    if (status) list = list.filter((r) => r.chantierStatus === status);
    if (attentionOnly) list = list.filter((r) => r.attentionCount > 0);
    if (debouncedQ) {
      const s = debouncedQ.toLowerCase();
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(s) ||
          (r.clientLabel ?? "").toLowerCase().includes(s) ||
          (r.siteCity ?? "").toLowerCase().includes(s) ||
          (r.siteAddress ?? "").toLowerCase().includes(s) ||
          (r.responsibleName ?? "").toLowerCase().includes(s),
      );
    }
    list.sort((a, b) => {
      if (sort === "attention") {
        if (b.attentionScore !== a.attentionScore) return b.attentionScore - a.attentionScore;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
      if (sort === "recent") {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
      if (sort === "nom") return a.title.localeCompare(b.title, "fr");
      return a.statusLabel.localeCompare(b.statusLabel, "fr");
    });
    return list;
  }, [rows, status, attentionOnly, debouncedQ, sort]);

  const hasFilters = Boolean(status || attentionOnly || debouncedQ);

  function resetFilters() {
    setQ("");
    setDebouncedQ("");
    setStatus("");
    setAttentionOnly(false);
    setSort("attention");
    router.replace("/dashboard/projets");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <label className="relative min-w-[min(100%,18rem)] flex-1">
          <span className="sr-only">Rechercher</span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") setDebouncedQ(q.trim());
            }}
            placeholder="Rechercher un chantier, un client, une ville…"
            className="w-full rounded-[var(--bw-radius-control,0.625rem)] border border-[color:var(--cc-border)] bg-white px-3.5 py-2.5 text-sm text-bework-ink placeholder:text-slate-400 shadow-sm outline-none transition focus:border-[#1e3a5f]/35 focus:ring-2 focus:ring-[#1e3a5f]/10"
          />
        </label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-[var(--bw-radius-control,0.625rem)] border border-[color:var(--cc-border)] bg-white px-3 py-2.5 text-sm text-slate-700 shadow-sm outline-none focus:border-[#1e3a5f]/35"
          aria-label="Filtrer par statut"
        >
          <option value="">Tous les statuts</option>
          <option value="EN_COURS">En cours</option>
          <option value="ETUDE">Étude</option>
          <option value="EN_ATTENTE">En attente</option>
          <option value="RECEPTION">Réception</option>
          <option value="TERMINE">Terminé</option>
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortId)}
          className="rounded-[var(--bw-radius-control,0.625rem)] border border-[color:var(--cc-border)] bg-white px-3 py-2.5 text-sm text-slate-700 shadow-sm outline-none focus:border-[#1e3a5f]/35"
          aria-label="Trier"
        >
          <option value="attention">Trier : Attention</option>
          <option value="recent">Trier : Récent</option>
          <option value="nom">Trier : Nom</option>
          <option value="statut">Trier : Statut</option>
        </select>
        <button
          type="button"
          onClick={() => setAttentionOnly((v) => !v)}
          className={cn(
            "rounded-[var(--bw-radius-control,0.625rem)] px-3 py-2.5 text-sm font-medium transition",
            attentionOnly
              ? "bg-amber-50 text-amber-900 ring-1 ring-amber-200"
              : "bg-white text-slate-600 ring-1 ring-[color:var(--cc-border)] hover:bg-slate-50",
          )}
        >
          À surveiller
        </button>
        {createSlot}
      </div>

      {hasFilters ? (
        <div className="flex flex-wrap items-center gap-2 text-[12.5px]">
          {debouncedQ ? (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">
              Recherche : {debouncedQ}
            </span>
          ) : null}
          {status ? (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">
              Statut actif
            </span>
          ) : null}
          {attentionOnly ? (
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-900">
              Attention
            </span>
          ) : null}
          <button
            type="button"
            onClick={resetFilters}
            className="font-medium text-[#1e3a5f] hover:underline"
          >
            Réinitialiser
          </button>
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <div className="rounded-[var(--bw-radius-panel,1.125rem)] border border-dashed border-slate-200 bg-white px-6 py-14 text-center">
          <p className="text-base font-semibold text-bework-ink">
            {rows.length === 0
              ? "Vous n’avez encore aucun chantier."
              : "Aucun chantier ne correspond."}
          </p>
          <p className="mt-1 text-sm text-bework-muted">
            {rows.length === 0
              ? "Créez votre premier chantier pour piloter le terrain."
              : "Modifiez la recherche ou réinitialisez les filtres."}
          </p>
        </div>
      ) : (
        <div className="cc-list-surface divide-y divide-slate-100/90">
          {filtered.map((row) => (
            <article
              key={row.id}
              className={cn(
                "group relative cc-list-row px-4 py-3.5 sm:px-5 sm:py-4",
                "transition-[box-shadow,background] duration-180",
                "hover:shadow-[0_1px_0_rgba(30,58,95,0.06)]",
                row.attentionLevel !== "none" &&
                  "border-l-[3px] border-l-amber-400/80 pl-[13px] sm:pl-[17px]",
              )}
            >
              <Link
                href={row.href}
                className="absolute inset-0 z-0 rounded-[inherit]"
                aria-label={`Ouvrir ${row.title}`}
              />
              <div className="relative z-[1] pointer-events-none flex gap-3 sm:gap-4">
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <h2 className="text-[15px] font-semibold tracking-tight text-bework-ink sm:text-[16px]">
                      {row.title}
                    </h2>
                    <span className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">
                      {row.statusLabel}
                    </span>
                  </div>

                  <p className="text-[13px] text-slate-500">
                    {[row.locationLabel, row.clientLabel].filter(Boolean).join(" · ")}
                  </p>

                  {row.responsibleName ? (
                    <div className="flex items-center gap-2 pt-0.5">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#eef2f7] text-[10px] font-bold text-[#1e3a5f]">
                        {initials(row.responsibleName)}
                      </span>
                      <div className="min-w-0 leading-tight">
                        <p className="text-[13px] font-medium text-slate-800">
                          {row.responsibleName}
                        </p>
                        {row.responsibleRoleLabel ? (
                          <p className="text-[11.5px] text-slate-500">
                            {row.responsibleRoleLabel}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  ) : null}

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-0.5">
                    <AttentionSignal row={row} />
                    {row.nextEvent ? (
                      <span className="pointer-events-auto text-[12.5px] text-slate-600">
                        <span className="text-slate-400">Prochaine activité · </span>
                        <Link
                          href={row.nextEvent.href}
                          className="font-medium text-slate-800 hover:text-[#1e3a5f] hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {row.nextEvent.title} · {formatEventWhen(row.nextEvent.startAt)}
                        </Link>
                      </span>
                    ) : null}
                    {row.nextDelivery ? (
                      <span className="pointer-events-auto text-[12.5px] text-slate-600">
                        <span className="text-slate-400">Livraison · </span>
                        <Link
                          href={row.nextDelivery.href}
                          className="font-medium text-slate-800 hover:text-[#1e3a5f] hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {row.nextDelivery.supplierName} ·{" "}
                          {formatEventWhen(row.nextDelivery.at)}
                          {row.nextDelivery.statusHint
                            ? ` · ${row.nextDelivery.statusHint}`
                            : ""}
                        </Link>
                      </span>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12px] text-slate-400">
                    {row.openTasks > 0 ? (
                      <span>
                        {row.openTasks} tâche{row.openTasks > 1 ? "s" : ""} ouverte
                        {row.openTasks > 1 ? "s" : ""}
                        {row.overdueTasks > 0
                          ? ` · ${row.overdueTasks} en retard`
                          : ""}
                      </span>
                    ) : null}
                    {row.documentsCount > 0 ? (
                      <span>{row.documentsCount} documents</span>
                    ) : null}
                    <span className="ml-auto">
                      Dernière activité {formatRelativeActivity(row.updatedAt)}
                    </span>
                  </div>
                </div>

                <div className="pointer-events-auto flex shrink-0 flex-col items-end justify-between gap-2">
                  <RowMenu row={row} />
                  <span
                    className="text-lg font-light text-slate-300 transition-colors duration-180 group-hover:text-[#1e3a5f]"
                    aria-hidden
                  >
                    ›
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
