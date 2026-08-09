"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { PilotagePortfolioRow } from "@/lib/pilotage/load-pilotage-portfolio";
import { cn } from "@/lib/cn";

type Props = {
  rows: PilotagePortfolioRow[];
  canConfigureContractuel: boolean;
};

function fmtWhen(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function AttentionDot({ level }: { level: PilotagePortfolioRow["attentionLevel"] }) {
  if (level === "none") return null;
  const critical = level === "critical" || level === "urgent";
  return (
    <span
      className={cn(
        "inline-block h-1.5 w-1.5 shrink-0 rounded-full",
        critical ? "bg-red-500" : "bg-amber-500",
      )}
      aria-hidden
    />
  );
}

export function PilotagePortfolioView({ rows, canConfigureContractuel }: Props) {
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [watchOnly, setWatchOnly] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(q.trim().toLowerCase()), 280);
    return () => window.clearTimeout(t);
  }, [q]);

  const filtered = useMemo(() => {
    let list = [...rows];
    if (watchOnly) {
      list = list.filter(
        (r) =>
          r.attentionCount > 0 ||
          r.overdueTasks > 0 ||
          (r.contract?.criticalBlockers ?? 0) > 0 ||
          Boolean(r.nextDelivery?.statusHint),
      );
    }
    if (debounced) {
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(debounced) ||
          (r.clientLabel ?? "").toLowerCase().includes(debounced) ||
          (r.responsibleName ?? "").toLowerCase().includes(debounced) ||
          (r.siteCity ?? "").toLowerCase().includes(debounced),
      );
    }
    return list;
  }, [rows, watchOnly, debounced]);

  const watchRows = filtered.filter(
    (r) =>
      r.attentionCount > 0 ||
      r.overdueTasks > 0 ||
      (r.contract?.criticalBlockers ?? 0) > 0 ||
      r.primarySignal,
  );
  const calmRows = filtered.filter((r) => !watchRows.includes(r));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher un chantier, un client…"
          className="min-w-[min(100%,18rem)] flex-1 rounded-[var(--bw-radius-control,0.625rem)] border border-[color:var(--cc-border)] bg-white px-3.5 py-2.5 text-sm shadow-sm outline-none focus:border-[#1e3a5f]/35 focus:ring-2 focus:ring-[#1e3a5f]/10"
        />
        <button
          type="button"
          onClick={() => setWatchOnly((v) => !v)}
          className={cn(
            "rounded-[var(--bw-radius-control,0.625rem)] px-3 py-2.5 text-sm font-medium",
            watchOnly
              ? "bg-amber-50 text-amber-900 ring-1 ring-amber-200"
              : "bg-white text-slate-600 ring-1 ring-[color:var(--cc-border)]",
          )}
        >
          À surveiller
        </button>
        <select
          className="rounded-[var(--bw-radius-control,0.625rem)] border border-[color:var(--cc-border)] bg-white px-3 py-2.5 text-sm text-slate-700 shadow-sm"
          defaultValue="attention"
          aria-label="Tri"
          onChange={(e) => {
            /* tri serveur déjà attention ; client re-sort local */
            void e;
          }}
        >
          <option value="attention">Trier : Attention</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-[var(--bw-radius-panel,1.125rem)] border border-dashed border-slate-200 bg-white px-6 py-14 text-center">
          <p className="text-base font-semibold text-bework-ink">
            {rows.length === 0 ? "Aucun chantier dans votre périmètre." : "Aucun résultat."}
          </p>
          <p className="mt-1 text-sm text-bework-muted">
            {rows.length === 0
              ? "Les chantiers BeWork apparaissent ici automatiquement — sans créer un second dossier."
              : "Modifiez la recherche ou le filtre."}
          </p>
          {rows.length === 0 ? (
            <Link href="/dashboard/projets" className="btn-cc-primary mt-4 inline-flex">
              Voir les chantiers
            </Link>
          ) : null}
        </div>
      ) : (
        <>
          {watchRows.length > 0 ? (
            <section className="space-y-2">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-bework-muted">
                Chantiers à surveiller
              </h2>
              <div className="cc-list-surface divide-y divide-slate-100/90">
                {watchRows.map((row) => (
                  <PilotageRow
                    key={row.id}
                    row={row}
                    canConfigureContractuel={canConfigureContractuel}
                    emphasize
                  />
                ))}
              </div>
            </section>
          ) : null}

          {calmRows.length > 0 && !watchOnly ? (
            <section className="space-y-2">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-bework-muted">
                Autres chantiers
              </h2>
              <div className="cc-list-surface divide-y divide-slate-100/90">
                {calmRows.map((row) => (
                  <PilotageRow
                    key={row.id}
                    row={row}
                    canConfigureContractuel={canConfigureContractuel}
                  />
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}

function PilotageRow({
  row,
  canConfigureContractuel,
  emphasize,
}: {
  row: PilotagePortfolioRow;
  canConfigureContractuel: boolean;
  emphasize?: boolean;
}) {
  return (
    <article
      className={cn(
        "group relative cc-list-row px-4 py-3.5 sm:px-5",
        emphasize && "border-l-[3px] border-l-amber-400/80",
      )}
    >
      <Link href={row.href} className="absolute inset-0 z-0" aria-label={`Ouvrir ${row.title}`} />
      <div className="relative z-[1] pointer-events-none flex gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-[15px] font-semibold tracking-tight text-bework-ink">
              {row.title}
            </h3>
            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              {row.statusLabel}
            </span>
          </div>
          <p className="text-[13px] text-slate-500">
            {[row.clientLabel, row.responsibleName].filter(Boolean).join(" · ")}
          </p>
          {row.primarySignal ? (
            <p className="flex items-center gap-1.5 text-[12.5px] font-semibold text-amber-900">
              <AttentionDot level={row.attentionLevel === "none" ? "watch" : row.attentionLevel} />
              {row.primarySignal}
            </p>
          ) : (
            <p className="text-[12.5px] text-slate-400">Aucune alerte importante</p>
          )}
          <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[12px] text-slate-500">
            {row.nextEvent ? (
              <span>
                Échéance · {row.nextEvent.title} · {fmtWhen(row.nextEvent.startAt)}
              </span>
            ) : null}
            {row.nextDelivery ? (
              <span className="pointer-events-auto">
                Livraison ·{" "}
                <Link
                  href={row.nextDelivery.href}
                  className="font-medium text-slate-800 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {row.nextDelivery.supplierName} · {fmtWhen(row.nextDelivery.at)}
                  {row.nextDelivery.statusHint ? ` · ${row.nextDelivery.statusHint}` : ""}
                </Link>
              </span>
            ) : null}
            {row.overdueTasks > 0 ? (
              <span>
                {row.overdueTasks} tâche{row.overdueTasks > 1 ? "s" : ""} en retard
              </span>
            ) : row.openTasks > 0 ? (
              <span>
                {row.openTasks} tâche{row.openTasks > 1 ? "s" : ""} ouverte
                {row.openTasks > 1 ? "s" : ""}
              </span>
            ) : null}
          </div>
        </div>
        <div className="pointer-events-auto flex shrink-0 flex-col items-end justify-between gap-2">
          {canConfigureContractuel ? (
            <Link
              href={
                row.contract
                  ? `/dashboard/projets/${row.id}#tab-contractuel`
                  : `/dashboard/projets/${row.id}/suivi-contractuel`
              }
              className="text-[11px] font-medium text-slate-400 opacity-0 transition group-hover:opacity-100 hover:text-[#1e3a5f]"
              onClick={(e) => e.stopPropagation()}
            >
              {row.contract ? "Suivi contractuel" : "Activer suivi"}
            </Link>
          ) : null}
          <span className="text-lg font-light text-slate-300 group-hover:text-[#1e3a5f]">›</span>
        </div>
      </div>
    </article>
  );
}
