"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";

export type ChantierCockpitTabId =
  | "overview"
  | "taches"
  | "documents"
  | "messages"
  | "partage"
  | "pilotage";

const TABS: { id: ChantierCockpitTabId; label: string }[] = [
  { id: "overview", label: "Vue d’ensemble" },
  { id: "taches", label: "Tâches" },
  { id: "documents", label: "Documents" },
  { id: "messages", label: "Échanges" },
  { id: "partage", label: "Partage" },
  { id: "pilotage", label: "Pilotage" },
];

export type ChantierOverviewStat = {
  label: string;
  value: number | string;
  href?: string;
  tone?: "critical" | "watch" | "ok" | "neutral";
};

export type ChantierOverviewItem = {
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  tone?: "critical" | "watch" | "info";
};

export function ChantierCockpit({
  stats,
  attentionItems,
  panels,
  defaultTab = "overview",
  hiddenTabs,
}: {
  stats: ChantierOverviewStat[];
  attentionItems: ChantierOverviewItem[];
  panels: Partial<Record<ChantierCockpitTabId, ReactNode>>;
  defaultTab?: ChantierCockpitTabId;
  /** Onglets masqués (ex. Partage pour un externe). */
  hiddenTabs?: ChantierCockpitTabId[];
}) {
  const visibleTabs = useMemo(
    () => TABS.filter((t) => !hiddenTabs?.includes(t.id) && panels[t.id] != null),
    [hiddenTabs, panels]
  );
  const [tab, setTab] = useState<ChantierCockpitTabId>(defaultTab);
  useEffect(() => {
    if (!visibleTabs.some((t) => t.id === tab) && visibleTabs[0]) {
      setTab(visibleTabs[0].id);
    }
  }, [visibleTabs, tab]);
  const active = useMemo(() => panels[tab], [panels, tab]);

  const toneClass = {
    critical: "border-red-200 bg-red-50/70",
    watch: "border-amber-200 bg-amber-50/60",
    ok: "border-emerald-200 bg-emerald-50/50",
    neutral: "border-slate-200 bg-white",
  } as const;

  const dot = {
    critical: "bg-red-500",
    watch: "bg-amber-500",
    info: "bg-sky-500",
  } as const;

  return (
    <div className="space-y-5">
      <div
        className="flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50/80 p-1"
        role="tablist"
        aria-label="Sections chantier"
      >
        {visibleTabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "shrink-0 rounded-lg px-3.5 py-2 text-xs font-semibold transition sm:text-sm",
              tab === t.id
                ? "bg-bework-navy text-white shadow-sm"
                : "text-slate-600 hover:bg-white hover:text-bework-navy",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" ? (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((s) => {
              const body = (
                <>
                  <p className="text-2xl font-extrabold tabular-nums text-slate-900">{s.value}</p>
                  <p className="mt-1 text-sm font-medium text-slate-600">{s.label}</p>
                </>
              );
              const cls = cn(
                "rounded-2xl border p-4 shadow-[0_1px_0_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5",
                toneClass[s.tone ?? "neutral"],
              );
              return s.href ? (
                <Link key={s.label} href={s.href} className={cls} onClick={() => {
                  if (s.href?.includes("#")) return;
                }}>
                  {body}
                </Link>
              ) : (
                <div key={s.label} className={cls}>
                  {body}
                </div>
              );
            })}
          </div>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
            <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-bework-muted">
              Attention sur ce chantier
            </h3>
            {attentionItems.length === 0 ? (
              <p className="mt-3 text-sm text-slate-600">Rien de bloquant pour le moment.</p>
            ) : (
              <ul className="mt-3 divide-y divide-slate-100">
                {attentionItems.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className="flex items-start gap-3 py-3 transition hover:bg-slate-50/80"
                      onClick={() => {
                        if (item.href.includes("taches")) setTab("taches");
                        if (item.href.includes("documents") || item.href.includes("dossier")) setTab("documents");
                      }}
                    >
                      <span
                        className={cn("mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full", dot[item.tone ?? "info"])}
                        aria-hidden
                      />
                      <span>
                        <span className="block text-sm font-semibold text-slate-900">{item.title}</span>
                        {item.subtitle ? (
                          <span className="mt-0.5 block text-xs text-slate-500">{item.subtitle}</span>
                        ) : null}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div>{panels.overview}</div>
        </div>
      ) : (
        <div>{active}</div>
      )}
    </div>
  );
}
