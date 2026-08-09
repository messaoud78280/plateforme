"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DeleteChantierButton } from "@/components/chantier/DeleteChantierButton";
import type { PortfolioProjectRow } from "@/lib/chantier/portfolio";
import type { PortfolioDeliverySnapshot } from "@/lib/chantier/portfolio-delivery";
import { cn } from "@/lib/cn";

export type SortId = "attention" | "recent" | "nom" | "statut";

type Props = {
  rows: PortfolioProjectRow[];
  initialSearch?: string;
  initialStatus?: string;
  canCreate: boolean;
  createSlot?: React.ReactNode;
};

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
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
    timeZone: "Europe/Paris",
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

function DeliveryLine({ d }: { d: PortfolioDeliverySnapshot }) {
  if (d.phase === "proposed" && d.requestedAt && d.proposedAt) {
    return (
      <span className="pointer-events-auto text-[12.5px] leading-snug text-slate-600">
        <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">
          Livraison
        </span>
        <br />
        <Link
          href={d.href}
          className="font-medium text-slate-800 hover:text-[#1e3a5f] hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {d.supplierName}
        </Link>
        <span className="block text-[12px] text-slate-500">
          Demandée {formatWhen(d.requestedAt)}
          <span className="text-slate-300"> · </span>
          Proposée {formatWhen(d.proposedAt)}
        </span>
      </span>
    );
  }

  const when =
    d.phase === "confirmed" && d.confirmedAt
      ? d.confirmedAt
      : d.requestedAt ?? d.at;

  return (
    <span className="pointer-events-auto text-[12.5px] leading-snug text-slate-600">
      <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">
        Livraison
      </span>
      <br />
      <Link
        href={d.href}
        className="font-medium text-slate-800 hover:text-[#1e3a5f] hover:underline"
        onClick={(e) => e.stopPropagation()}
      >
        {d.supplierName}
        <span className="font-normal text-slate-500">
          {" "}
          · {formatWhen(when)}
          {d.statusHint ? ` · ${d.statusHint}` : ""}
        </span>
      </Link>
    </span>
  );
}

function AttentionBlock({ row }: { row: PortfolioProjectRow }) {
  if (row.attentionLevel === "none" || !row.attentionLabel) return null;
  const critical = row.attentionLevel === "critical" || row.attentionLevel === "urgent";
  return (
    <div
      className={cn(
        "min-w-0 text-[12.5px] leading-snug",
        critical ? "text-amber-950" : "text-slate-700",
      )}
    >
      <p className="flex items-center gap-1.5 font-semibold">
        <span
          className={cn(
            "inline-block h-1.5 w-1.5 shrink-0 rounded-full",
            critical ? "bg-amber-500" : "bg-slate-400",
          )}
          aria-hidden
        />
        {row.attentionLabel}
      </p>
      {row.primaryAttentionReason ? (
        <p className="mt-0.5 pl-3 text-[12.5px] font-medium text-slate-800">
          {row.primaryAttentionReason}
        </p>
      ) : null}
      {row.attentionOtherCount > 0 ? (
        <p className="pl-3 text-[11.5px] text-slate-500">
          +{row.attentionOtherCount} autre{row.attentionOtherCount > 1 ? "s" : ""}
        </p>
      ) : null}
    </div>
  );
}

function RowMenu({ row }: { row: PortfolioProjectRow }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        className="rounded-md px-2 py-1 text-sm text-slate-400 opacity-0 transition-opacity duration-160 group-hover:opacity-100 hover:bg-slate-100 hover:text-slate-800 focus:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1e3a5f]/40"
        aria-label={`Actions ${row.title}`}
        aria-expanded={open}
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
          <div className="absolute right-0 z-20 mt-1 w-52 overflow-hidden rounded-[var(--bw-radius-panel,1.125rem)] border border-slate-200/80 bg-white py-1 shadow-[0_8px_24px_rgba(15,23,42,0.1)]">
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

function TaskLine({ row }: { row: PortfolioProjectRow }) {
  if (row.overdueTasks > 0) {
    return (
      <span className="text-[12px] font-medium text-amber-900/90">
        {row.overdueTasks} tâche{row.overdueTasks > 1 ? "s" : ""} en retard
        {row.openTasks > row.overdueTasks
          ? ` · ${row.openTasks} ouverte${row.openTasks > 1 ? "s" : ""}`
          : ""}
      </span>
    );
  }
  if (row.openTasks > 0 && row.attentionLevel !== "none") {
    return (
      <span className="text-[12px] text-slate-500">
        {row.openTasks} tâche{row.openTasks > 1 ? "s" : ""} ouverte
        {row.openTasks > 1 ? "s" : ""}
      </span>
    );
  }
  if (row.openTasks > 0 && !row.nextEvent && !row.nextDelivery) {
    return (
      <span className="text-[12px] text-slate-500">
        {row.openTasks} tâche{row.openTasks > 1 ? "s" : ""} ouverte
        {row.openTasks > 1 ? "s" : ""}
      </span>
    );
  }
  return null;
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
    if (attentionOnly) {
      list = list.filter(
        (r) =>
          r.attentionCount > 0 ||
          r.overdueTasks > 0 ||
          r.attentionLevel !== "none",
      );
    }
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
        return new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime();
      }
      if (sort === "recent") {
        return new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime();
      }
      if (sort === "nom") return a.title.localeCompare(b.title, "fr");
      return a.statusLabel.localeCompare(b.statusLabel, "fr");
    });
    return list;
  }, [rows, status, attentionOnly, debouncedQ, sort]);

  function resetFilters() {
    setQ("");
    setDebouncedQ("");
    setStatus("");
    setAttentionOnly(false);
    setSort("attention");
    router.replace("/dashboard/projets");
  }

  return (
    <div className="mx-auto w-full max-w-[1520px] space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <label className="relative min-w-[min(100%,20rem)] flex-1">
          <span className="sr-only">Rechercher</span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") setDebouncedQ(q.trim());
            }}
            placeholder="Rechercher un chantier, client, ville…"
            className="w-full rounded-[var(--bw-radius-control,0.625rem)] border border-[color:var(--cc-border)] bg-white px-3.5 py-2.5 text-sm text-bework-ink placeholder:text-slate-400 shadow-sm outline-none transition focus:border-[#1e3a5f]/35 focus:ring-2 focus:ring-[#1e3a5f]/10"
          />
        </label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-[var(--bw-radius-control,0.625rem)] border border-[color:var(--cc-border)] bg-white px-3 py-2.5 text-sm text-slate-700 shadow-sm outline-none focus:border-[#1e3a5f]/35"
          aria-label="Filtrer par statut"
        >
          <option value="">Statut : Tous</option>
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
        {attentionOnly ? (
          <button
            type="button"
            onClick={() => setAttentionOnly(false)}
            className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-[12.5px] font-semibold text-amber-900 ring-1 ring-amber-200/80 transition hover:bg-amber-100"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden />
            À surveiller
            <span className="ml-0.5 text-amber-700/70" aria-hidden>
              ×
            </span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setAttentionOnly(true)}
            className="rounded-[var(--bw-radius-control,0.625rem)] px-3 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
          >
            À surveiller
          </button>
        )}
        {createSlot}
      </div>

      {(status || debouncedQ) && !attentionOnly ? (
        <div className="flex flex-wrap items-center gap-2 text-[12.5px]">
          {debouncedQ ? (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">
              Recherche : {debouncedQ}
            </span>
          ) : null}
          {status ? (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">
              Statut filtré
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
        <div className="overflow-hidden rounded-[var(--bw-radius-panel,1.125rem)] border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          {filtered.map((row) => {
            const watch = row.attentionLevel !== "none";
            return (
              <article
                key={row.id}
                className={cn(
                  "group relative border-b border-slate-100 last:border-b-0",
                  "transition-colors duration-160 hover:bg-[#f8fafc]",
                  watch && "border-l-[2px] border-l-amber-400/90",
                )}
              >
                <Link
                  href={row.href}
                  className="absolute inset-0 z-0"
                  aria-label={`Ouvrir ${row.title}`}
                />
                <div
                  className={cn(
                    "relative z-[1] pointer-events-none px-4 py-3.5 sm:px-5 sm:py-4",
                    watch && "pl-[14px] sm:pl-[18px]",
                  )}
                >
                  {/* Mobile */}
                  <div className="space-y-2 sm:hidden">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="text-[15px] font-semibold tracking-tight text-bework-ink">
                        {row.title}
                      </h2>
                      <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                        {row.statusLabel}
                      </span>
                    </div>
                    <p className="text-[13px] text-slate-500">
                      {[row.clientLabel, row.siteCity].filter(Boolean).join(" · ")}
                    </p>
                    {row.responsibleName ? (
                      <p className="text-[13px] font-medium text-slate-800">
                        {row.responsibleName}
                      </p>
                    ) : (
                      <p className="text-[12.5px] text-slate-400">Responsable à définir</p>
                    )}
                    <AttentionBlock row={row} />
                    {row.nextDelivery ? (
                      <p className="text-[12.5px] text-slate-600">
                        {row.nextDelivery.supplierName} ·{" "}
                        {formatWhen(row.nextDelivery.requestedAt ?? row.nextDelivery.at)}
                        {row.nextDelivery.statusHint
                          ? ` · ${row.nextDelivery.statusHint}`
                          : ""}
                      </p>
                    ) : row.nextEvent ? (
                      <p className="text-[12.5px] text-slate-600">
                        {row.nextEvent.title} · {formatWhen(row.nextEvent.startAt)}
                      </p>
                    ) : null}
                    <div className="flex items-center justify-between gap-2">
                      <TaskLine row={row} />
                      <span
                        className="text-lg font-light text-slate-300 transition-transform duration-160 group-hover:translate-x-0.5 group-hover:text-[#1e3a5f]"
                        aria-hidden
                      >
                        ›
                      </span>
                    </div>
                  </div>

                  {/* Desktop — grille 45 / 40 / 15 */}
                  <div className="hidden gap-5 sm:grid sm:grid-cols-[minmax(0,0.45fr)_minmax(0,0.4fr)_minmax(0,0.15fr)] sm:items-start">
                    <div className="min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
                        <h2 className="text-[15px] font-semibold tracking-tight text-bework-ink sm:text-[16px]">
                          {row.title}
                        </h2>
                        <span className="rounded-full bg-slate-100/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.05em] text-slate-600">
                          {row.statusLabel}
                        </span>
                      </div>
                      {row.locationLabel ? (
                        <p className="text-[12.5px] text-slate-500">{row.locationLabel}</p>
                      ) : null}
                      {row.clientLabel ? (
                        <p className="text-[13px] text-slate-600">{row.clientLabel}</p>
                      ) : null}
                      {row.responsibleName ? (
                        <div className="flex items-center gap-2 pt-1">
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
                      ) : (
                        <p className="pt-1 text-[12.5px] text-slate-400">
                          Responsable à définir
                        </p>
                      )}
                    </div>

                    <div className="min-w-0 space-y-2">
                      <AttentionBlock row={row} />
                      {row.nextEvent ? (
                        <div className="pointer-events-auto text-[12.5px] leading-snug text-slate-600">
                          <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">
                            Prochaine activité
                          </span>
                          <br />
                          <Link
                            href={row.nextEvent.href}
                            className="font-medium text-slate-800 hover:text-[#1e3a5f] hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {row.nextEvent.title}
                            <span className="font-normal text-slate-500">
                              {" "}
                              · {formatWhen(row.nextEvent.startAt)}
                            </span>
                          </Link>
                        </div>
                      ) : null}
                      {row.nextDelivery ? <DeliveryLine d={row.nextDelivery} /> : null}
                      <TaskLine row={row} />
                    </div>

                    <div className="pointer-events-auto flex h-full min-h-[4.5rem] flex-col items-end justify-between gap-2">
                      <RowMenu row={row} />
                      <div className="flex items-center gap-1.5">
                        <span className="text-right text-[11px] text-slate-400">
                          {formatRelativeActivity(row.lastActivityAt)}
                        </span>
                        <span
                          className="text-lg font-light text-slate-300 transition-transform duration-160 group-hover:translate-x-0.5 group-hover:text-[#1e3a5f]"
                          aria-hidden
                        >
                          ›
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
