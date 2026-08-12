"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { roundMoney } from "@/lib/commercial/money";
import type { ProfitabilityHealth } from "@/lib/chantier/project-profitability";
import { cn } from "@/lib/cn";

function fmtK(n: number) {
  if (n >= 1000) {
    return `${roundMoney(n / 1000, 0).toLocaleString("fr-FR")} k€`;
  }
  return `${roundMoney(n, 0).toLocaleString("fr-FR")} €`;
}

function fmtPct(n: number) {
  return `${roundMoney(n, 1).toLocaleString("fr-FR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} %`;
}

type Row = {
  projectId: string;
  projectTitle: string;
  clientName: string | null;
  marketSellHt: number;
  plannedMarginPercent: number | null;
  estimatedMarginPercent: number | null;
  invoicedPercent: number | null;
  collectedTtc: number;
  health: ProfitabilityHealth;
  healthLabel: string;
  hasBudget: boolean;
};

type Filter = "all" | ProfitabilityHealth;

export function PortfolioRentabiliteClient({ rows }: { rows: Row[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter !== "all" && r.health !== filter) return false;
      if (!qq) return true;
      return [r.projectTitle, r.clientName]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(qq);
    });
  }, [rows, filter, q]);

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: "Tous" },
    { id: "STABLE", label: "Stables" },
    { id: "WATCH", label: "À surveiller" },
    { id: "CRITICAL", label: "Critiques" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold",
              filter === f.id
                ? "bg-[#1e3a5f] text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200",
            )}
          >
            {f.label}
          </button>
        ))}
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Chantier, client…"
          className="ml-auto min-w-[12rem] flex-1 rounded-xl border border-slate-200 px-3 py-1.5 text-sm sm:max-w-xs"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">
          Aucun chantier dans ce filtre.
        </p>
      ) : (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {filtered.map((r) => (
            <li key={r.projectId}>
              <Link
                href={`/dashboard/projets/${r.projectId}#tab-rentabilite`}
                className="flex flex-col gap-3 px-4 py-3.5 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-semibold text-slate-900">
                      {r.projectTitle}
                    </p>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-bold",
                        r.health === "CRITICAL"
                          ? "bg-red-50 text-red-700"
                          : r.health === "WATCH"
                            ? "bg-amber-50 text-amber-800"
                            : "bg-emerald-50 text-emerald-800",
                      )}
                    >
                      {r.healthLabel}
                    </span>
                    {!r.hasBudget ? (
                      <span className="text-[10px] font-semibold text-slate-400">
                        Sans budget
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs text-slate-500">
                    {r.clientName ?? "Client"} · Marché {fmtK(r.marketSellHt)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-4 text-xs sm:text-sm">
                  <div className="text-right">
                    <p className="text-[10px] uppercase text-slate-400">
                      Marge prévue
                    </p>
                    <p className="font-semibold tabular-nums">
                      {r.plannedMarginPercent != null
                        ? fmtPct(r.plannedMarginPercent)
                        : "—"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase text-slate-400">
                      Marge estimée
                    </p>
                    <p className="font-semibold tabular-nums text-[#1e3a5f]">
                      {r.estimatedMarginPercent != null
                        ? fmtPct(r.estimatedMarginPercent)
                        : "—"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase text-slate-400">
                      Facturé
                    </p>
                    <p className="font-semibold tabular-nums">
                      {r.invoicedPercent != null
                        ? fmtPct(r.invoicedPercent)
                        : "—"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase text-slate-400">
                      Encaissé
                    </p>
                    <p className="font-semibold tabular-nums">
                      {fmtK(r.collectedTtc)}
                    </p>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
