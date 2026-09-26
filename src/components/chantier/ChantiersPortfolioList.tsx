"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ChantierStatus } from "@prisma/client";
import { DeleteChantierButton } from "@/components/chantier/DeleteChantierButton";
import type {
  PortfolioModuleSnapshot,
  PortfolioProjectRow,
} from "@/lib/chantier/portfolio";
import type { PortfolioDeliverySnapshot } from "@/lib/chantier/portfolio-delivery";
import { cn } from "@/lib/cn";

export type SortId = "attention" | "recent" | "nom" | "statut";
type ViewMode = "list" | "grid";

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

function statusVisual(status: ChantierStatus): {
  badge: string;
  rail: string;
  bar: string;
  short: string;
} {
  switch (status) {
    case "EN_COURS":
      return {
        badge: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80",
        rail: "bg-emerald-500",
        bar: "bg-emerald-500",
        short: "En réalisation",
      };
    case "EN_ATTENTE":
      return {
        badge: "bg-rose-50 text-rose-800 ring-1 ring-rose-200/80",
        rail: "bg-rose-400",
        bar: "bg-rose-400",
        short: "En préparation",
      };
    case "RECEPTION":
      return {
        badge: "bg-teal-50 text-teal-800 ring-1 ring-teal-200/80",
        rail: "bg-teal-500",
        bar: "bg-teal-500",
        short: "Réception",
      };
    case "TERMINE":
      return {
        badge: "bg-violet-50 text-violet-800 ring-1 ring-violet-200/80",
        rail: "bg-violet-400",
        bar: "bg-violet-400",
        short: "Terminé",
      };
    case "ETUDE":
    default:
      return {
        badge: "bg-slate-100 text-slate-700 ring-1 ring-slate-200/90",
        rail: "bg-slate-400",
        bar: "bg-[#3b6cf0]",
        short: "En étude",
      };
  }
}

function moduleDot(state: PortfolioModuleSnapshot["state"]) {
  if (state === "done") return "bg-emerald-500";
  if (state === "progress") return "bg-amber-400";
  return "bg-slate-300";
}

function RowMenu({ row }: { row: PortfolioProjectRow }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        className="rounded-lg px-2 py-1 text-sm text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
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
          <div className="absolute right-0 z-20 mt-1 w-52 overflow-hidden rounded-xl border border-slate-200/80 bg-white py-1 shadow-[0_10px_28px_rgba(15,23,42,0.12)]">
            <Link href={row.href} className="block px-3 py-2 text-sm text-slate-800 hover:bg-slate-50">
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

function AttentionChip({ row }: { row: PortfolioProjectRow }) {
  if (row.attentionLevel === "none" || row.attentionCount <= 0) {
    return (
      <span className="inline-flex items-center rounded-xl bg-slate-50 px-3 py-2 text-[12px] font-medium text-slate-500 ring-1 ring-slate-200/70">
        Aucune alerte
      </span>
    );
  }
  const critical =
    row.attentionLevel === "critical" || row.attentionLevel === "urgent";
  const label =
    row.attentionCount > 1
      ? `${row.attentionCount} actions`
      : row.attentionLabel ?? "1 action";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-semibold",
        critical
          ? "bg-rose-50 text-rose-800 ring-1 ring-rose-200/80"
          : "bg-amber-50 text-amber-900 ring-1 ring-amber-200/80",
      )}
    >
      {label}
      <span aria-hidden className="opacity-60">
        ›
      </span>
    </span>
  );
}

function Tags({ row }: { row: PortfolioProjectRow }) {
  const tags: string[] = [];
  if (row.clientLabel) tags.push(row.clientLabel);
  if (row.responsibleName) {
    tags.push(row.responsibleName);
  } else {
    tags.push("Responsable à définir");
  }
  if (row.documentsCount > 0) {
    tags.push(`${row.documentsCount} doc${row.documentsCount > 1 ? "s" : ""}`);
  }
  if (tags.length === 0) return null;
  return (
    <div className="mt-2.5 flex flex-wrap gap-1.5">
      {tags.slice(0, 3).map((t) => (
        <span
          key={t}
          className={cn(
            "rounded-full px-2.5 py-0.5 text-[11px] font-medium",
            t === "Responsable à définir"
              ? "bg-amber-50 text-amber-800"
              : "bg-slate-100 text-slate-600",
          )}
        >
          {t}
        </span>
      ))}
    </div>
  );
}

function ModulesColumn({ modules }: { modules: PortfolioModuleSnapshot[] }) {
  return (
    <ul className="space-y-1.5">
      {modules.map((m) => (
        <li key={m.key} className="flex items-center justify-between gap-3 text-[12px]">
          <span className="inline-flex items-center gap-2 text-slate-700">
            <span className={cn("h-2 w-2 shrink-0 rounded-full", moduleDot(m.state))} aria-hidden />
            {m.label}
          </span>
          <span
            className={cn(
              "font-medium",
              m.state === "done"
                ? "text-emerald-700"
                : m.state === "progress"
                  ? "text-amber-700"
                  : "text-slate-400",
            )}
          >
            {m.stateLabel}
          </span>
        </li>
      ))}
    </ul>
  );
}

function ProgressBlock({
  row,
  barClass,
}: {
  row: PortfolioProjectRow;
  barClass: string;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.04em] text-slate-400">
          {row.progressLabel}
        </p>
        <p className="text-[12px] font-semibold tabular-nums text-slate-700">
          {row.progressPercent} %
        </p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={cn("h-full rounded-full transition-[width] duration-300", barClass)}
          style={{ width: `${Math.min(100, Math.max(0, row.progressPercent))}%` }}
        />
      </div>
      {row.nextDelivery ? (
        <DeliveryDetail d={row.nextDelivery} />
      ) : row.nextEvent ? (
        <p className="mt-2 truncate text-[11.5px] text-slate-500">
          Prochaine activité · {row.nextEvent.title}
        </p>
      ) : row.overdueTasks > 0 ? (
        <p className="mt-2 text-[11.5px] font-medium text-amber-800">
          {row.overdueTasks} tâche{row.overdueTasks > 1 ? "s" : ""} en retard
        </p>
      ) : null}
    </div>
  );
}

function ChantierCard({
  row,
  featured,
  view,
}: {
  row: PortfolioProjectRow;
  featured?: boolean;
  view: ViewMode;
}) {
  const visual = statusVisual(row.chantierStatus);
  const isGrid = view === "grid";

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition duration-200",
        "hover:border-slate-300/90 hover:shadow-[0_8px_24px_rgba(15,23,42,0.07)]",
        featured && "ring-1 ring-[#3b6cf0]/15",
        row.attentionLevel !== "none" && "border-l-[2px] border-l-amber-400/80",
      )}
    >
      <span
        className={cn("absolute inset-y-0 left-0 w-[4px]", visual.rail)}
        aria-hidden
      />
      <Link
        href={row.href}
        className="absolute inset-0 z-0"
        aria-label={`Ouvrir ${row.title}`}
      />

      <div
        className={cn(
          "relative z-[1] pointer-events-none pl-5 pr-4 py-4 sm:pl-6 sm:pr-5",
          isGrid ? "space-y-4" : "sm:py-5",
        )}
      >
        <div
          className={cn(
            isGrid
              ? "space-y-4"
              : "grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)_minmax(160px,0.7fr)_minmax(140px,0.55fr)] lg:items-center lg:gap-6",
          )}
        >
          {/* Identité */}
          <div className="min-w-0">
            <div className="flex items-start justify-between gap-2">
              <span
                className={cn(
                  "inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em]",
                  visual.badge,
                )}
              >
                {visual.short}
              </span>
              <div className="pointer-events-auto lg:hidden">
                <RowMenu row={row} />
              </div>
            </div>
            <h2 className="mt-2 text-[15px] font-semibold tracking-tight text-slate-900 sm:text-[16px]">
              {row.title}
            </h2>
            {row.locationLabel ? (
              <p className="mt-1.5 flex items-start gap-1.5 text-[12.5px] text-slate-500">
                <svg
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden
                >
                  <path
                    d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
                  <circle cx="12" cy="10" r="2.2" stroke="currentColor" strokeWidth="1.6" />
                </svg>
                <span className="line-clamp-2">{row.locationLabel}</span>
              </p>
            ) : null}
            <Tags row={row} />
          </div>

          {/* Progression */}
          <ProgressBlock row={row} barClass={visual.bar} />

          {/* Modules */}
          <div className={cn(!isGrid && "hidden sm:block")}>
            <ModulesColumn modules={row.modules} />
          </div>

          {/* Alertes / activité */}
          <div
            className={cn(
              "flex flex-col gap-2",
              !isGrid && "sm:items-end sm:text-right",
            )}
          >
            <div className={cn("pointer-events-auto hidden lg:block", !isGrid && "self-end")}>
              <RowMenu row={row} />
            </div>
            <AttentionChip row={row} />
            {row.primaryAttentionReason ? (
              <p className="line-clamp-2 text-[11.5px] text-slate-500">
                {row.primaryAttentionReason}
                {row.attentionOtherCount > 0
                  ? ` · +${row.attentionOtherCount}`
                  : ""}
              </p>
            ) : null}
            <p className="text-[11.5px] text-slate-400">
              Dernière activité {formatRelativeActivity(row.lastActivityAt)}
            </p>
          </div>
        </div>
      </div>
    </article>
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
  const [view, setView] = useState<ViewMode>("list");

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

  const selectClass =
    "rounded-xl border border-slate-200/90 bg-white px-3 py-2.5 text-[13px] font-medium text-slate-700 shadow-sm outline-none transition hover:border-slate-300 focus:border-[#3b6cf0]/40 focus:ring-2 focus:ring-[#3b6cf0]/10";

  return (
    <div className="mx-auto w-full max-w-[1520px] space-y-4">
      <div className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-3.5">
        <div className="flex flex-wrap items-center gap-2.5">
          <label className="relative min-w-[min(100%,18rem)] flex-1">
            <span className="sr-only">Rechercher</span>
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.7" />
                <path
                  d="m16 16 3.5 3.5"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setDebouncedQ(q.trim());
              }}
              placeholder="Rechercher un chantier, client, ville…"
              className="w-full rounded-xl border border-slate-200/90 bg-slate-50/80 py-2.5 pl-9 pr-3.5 text-[13px] text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[#3b6cf0]/40 focus:bg-white focus:ring-2 focus:ring-[#3b6cf0]/10"
            />
          </label>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={selectClass}
            aria-label="Filtrer par statut"
          >
            <option value="">Statut : Tous</option>
            <option value="EN_COURS">En réalisation</option>
            <option value="ETUDE">Étude</option>
            <option value="EN_ATTENTE">En préparation</option>
            <option value="RECEPTION">Réception</option>
            <option value="TERMINE">Terminé</option>
          </select>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortId)}
            className={selectClass}
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
              "rounded-xl px-3 py-2.5 text-[13px] font-medium transition",
              attentionOnly
                ? "bg-amber-50 text-amber-900 ring-1 ring-amber-200"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-700",
            )}
          >
            À surveiller
          </button>

          <div className="ml-auto flex items-center gap-1 rounded-xl border border-slate-200/90 bg-slate-50/80 p-1">
            <button
              type="button"
              onClick={() => setView("list")}
              className={cn(
                "rounded-lg px-2.5 py-1.5 text-[12px] font-semibold transition",
                view === "list"
                  ? "bg-white text-[#3b6cf0] shadow-sm"
                  : "text-slate-500 hover:text-slate-700",
              )}
              aria-pressed={view === "list"}
            >
              Liste
            </button>
            <button
              type="button"
              onClick={() => setView("grid")}
              className={cn(
                "rounded-lg px-2.5 py-1.5 text-[12px] font-semibold transition",
                view === "grid"
                  ? "bg-white text-[#3b6cf0] shadow-sm"
                  : "text-slate-500 hover:text-slate-700",
              )}
              aria-pressed={view === "grid"}
            >
              Grille
            </button>
          </div>

          {createSlot}
        </div>

        {(status || debouncedQ || attentionOnly) && (
          <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-2.5 text-[12px]">
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
            {attentionOnly ? (
              <span className="rounded-full bg-amber-50 px-2.5 py-1 font-medium text-amber-900">
                À surveiller
              </span>
            ) : null}
            <button
              type="button"
              onClick={resetFilters}
              className="font-medium text-[#3b6cf0] hover:underline"
            >
              Réinitialiser
            </button>
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
          <p className="text-base font-semibold text-slate-900">
            {rows.length === 0
              ? "Vous n’avez encore aucun chantier."
              : "Aucun chantier ne correspond."}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {rows.length === 0
              ? "Créez votre premier chantier pour piloter le terrain."
              : "Modifiez la recherche ou réinitialisez les filtres."}
          </p>
        </div>
      ) : (
        <div
          className={cn(
            view === "grid"
              ? "grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
              : "space-y-3",
          )}
        >
          {filtered.map((row, i) => (
            <ChantierCard
              key={row.id}
              row={row}
              featured={i === 0 && sort === "attention" && row.attentionScore > 0}
              view={view}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DeliveryDetail({ d }: { d: PortfolioDeliverySnapshot }) {
  if (d.phase === "proposed" && d.requestedAt && d.proposedAt) {
    return (
      <p className="mt-2 text-[11.5px] leading-snug text-slate-500">
        Livraison · {d.supplierName}
        <span className="block text-slate-400">
          Demandée {formatWhen(d.requestedAt)}
          <span className="text-slate-300"> · </span>
          Proposée {formatWhen(d.proposedAt)}
        </span>
      </p>
    );
  }
  return (
    <p className="mt-2 truncate text-[11.5px] text-slate-500">
      Livraison · {d.supplierName}
      {d.statusHint ? ` · ${d.statusHint}` : ""}
    </p>
  );
}
