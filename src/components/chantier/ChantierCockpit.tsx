"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";

export type ChantierCockpitTabId =
  | "overview"
  | "taches"
  | "materiaux"
  | "documents"
  | "messages"
  | "partage"
  | "sous-traitants"
  | "contractuel"
  | "rentabilite"
  | "pilotage";

type NavGroupId = "overview" | "travaux" | "documents" | "gestion" | "echanges";

type TabDef = { id: ChantierCockpitTabId; label: string };

type NavGroup = {
  id: NavGroupId;
  label: string;
  /** Onglets cockpit internes (routes / panels existants). */
  tabs: TabDef[];
  /** Liens externes déjà supportés (planning, suivi…). */
  externalLinks?: { label: string; href: string }[];
};

const TAB_LABELS: Record<ChantierCockpitTabId, string> = {
  overview: "Vue d’ensemble",
  taches: "Tâches",
  materiaux: "Matériaux",
  documents: "Documents",
  messages: "Messages",
  partage: "Partage",
  "sous-traitants": "Sous-traitants",
  contractuel: "Suivi contractuel",
  rentabilite: "Rentabilité",
  pilotage: "Organisation",
};

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

function tabFromHash(): ChantierCockpitTabId | null {
  if (typeof window === "undefined") return null;
  const h = window.location.hash.replace(/^#/, "");
  if (h === "tab-taches" || h.startsWith("tab-taches")) return "taches";
  if (h === "tab-materiaux" || h === "materiaux") return "materiaux";
  if (h === "dossier-chantier" || h === "tab-documents") return "documents";
  if (h === "tab-messages") return "messages";
  if (h === "tab-partage") return "partage";
  if (h === "tab-sous-traitants" || h === "sous-traitants") return "sous-traitants";
  if (h === "tab-contractuel" || h === "suivi-contractuel") return "contractuel";
  if (h === "tab-rentabilite" || h === "rentabilite") return "rentabilite";
  if (h === "tab-pilotage") return "pilotage";
  if (h === "tab-overview" || h === "vue-ensemble") return "overview";
  return null;
}

function groupForTab(tab: ChantierCockpitTabId): NavGroupId {
  if (tab === "overview") return "overview";
  if (tab === "taches" || tab === "materiaux") return "travaux";
  if (tab === "documents") return "documents";
  if (tab === "messages" || tab === "partage") return "echanges";
  return "gestion";
}

export function ChantierCockpit({
  stats,
  attentionItems,
  panels,
  defaultTab = "overview",
  hiddenTabs,
  opsOverview,
  travauxExternalLinks,
  documentsExternalLinks,
}: {
  stats: ChantierOverviewStat[];
  attentionItems: ChantierOverviewItem[];
  panels: Partial<Record<ChantierCockpitTabId, ReactNode>>;
  defaultTab?: ChantierCockpitTabId;
  hiddenTabs?: ChantierCockpitTabId[];
  opsOverview?: ReactNode;
  /** Liens production déjà existants (planning / suivi). */
  travauxExternalLinks?: { label: string; href: string }[];
  documentsExternalLinks?: { label: string; href: string }[];
}) {
  const groups = useMemo((): NavGroup[] => {
    const visible = (id: ChantierCockpitTabId) =>
      !hiddenTabs?.includes(id) && panels[id] != null;

    const tab = (id: ChantierCockpitTabId): TabDef | null =>
      visible(id) ? { id, label: TAB_LABELS[id] } : null;

    const built: NavGroup[] = [
      {
        id: "overview",
        label: "Vue d’ensemble",
        tabs: [tab("overview")].filter((t): t is TabDef => t != null),
      },
      {
        id: "travaux",
        label: "Travaux",
        tabs: [tab("taches"), tab("materiaux")].filter(
          (t): t is TabDef => t != null,
        ),
        externalLinks: travauxExternalLinks,
      },
      {
        id: "documents",
        label: "Documents",
        tabs: [tab("documents")].filter((t): t is TabDef => t != null),
        externalLinks: documentsExternalLinks,
      },
      {
        id: "gestion",
        label: "Gestion",
        tabs: [
          tab("sous-traitants"),
          tab("contractuel"),
          tab("rentabilite"),
          tab("pilotage"),
        ].filter((t): t is TabDef => t != null),
      },
      {
        id: "echanges",
        label: "Échanges",
        tabs: [tab("messages"), tab("partage")].filter(
          (t): t is TabDef => t != null,
        ),
      },
    ];
    return built.filter(
      (g) =>
        g.tabs.length > 0 || (g.externalLinks && g.externalLinks.length > 0),
    );
  }, [hiddenTabs, panels, travauxExternalLinks, documentsExternalLinks]);

  const visibleTabs = useMemo(
    () => groups.flatMap((g) => g.tabs),
    [groups],
  );

  const [tab, setTab] = useState<ChantierCockpitTabId>(defaultTab);
  const [group, setGroup] = useState<NavGroupId>(groupForTab(defaultTab));

  useEffect(() => {
    const fromHash = tabFromHash();
    if (fromHash && visibleTabs.some((t) => t.id === fromHash)) {
      setTab(fromHash);
      setGroup(groupForTab(fromHash));
    }
  }, [visibleTabs]);

  useEffect(() => {
    if (!visibleTabs.some((t) => t.id === tab) && visibleTabs[0]) {
      setTab(visibleTabs[0].id);
      setGroup(groupForTab(visibleTabs[0].id));
    }
  }, [visibleTabs, tab]);

  const activeGroup = groups.find((g) => g.id === group) ?? groups[0];
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

  function selectTab(id: ChantierCockpitTabId) {
    setTab(id);
    setGroup(groupForTab(id));
    if (typeof window !== "undefined") {
      const hash =
        id === "taches"
          ? "tab-taches"
          : id === "documents"
            ? "dossier-chantier"
            : id === "overview"
              ? ""
              : `tab-${id}`;
      const url = new URL(window.location.href);
      url.hash = hash;
      window.history.replaceState(
        {},
        "",
        url.pathname + url.search + (hash ? `#${hash}` : ""),
      );
    }
  }

  function selectGroup(g: NavGroup) {
    setGroup(g.id);
    if (g.tabs.length > 0) {
      const preferred =
        g.tabs.find((t) => t.id === tab) ??
        (g.id === "travaux"
          ? g.tabs.find((t) => t.id === "taches")
          : g.tabs[0]);
      if (preferred) selectTab(preferred.id);
    }
  }

  const showSubNav =
    activeGroup &&
    (activeGroup.tabs.length > 1 ||
      (activeGroup.externalLinks && activeGroup.externalLinks.length > 0) ||
      (activeGroup.id === "documents" &&
        (activeGroup.externalLinks?.length ?? 0) > 0));

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "sticky top-0 z-10 -mx-1 px-1 py-1",
          "bg-[color-mix(in_srgb,var(--background,#f8fafc)_92%,transparent)] backdrop-blur-sm supports-[not(backdrop-filter)]:bg-slate-50",
        )}
      >
        <div
          className="flex gap-1 overflow-x-auto rounded-xl border border-slate-200/90 bg-white p-1 shadow-[0_1px_0_rgba(15,23,42,0.03)]"
          role="tablist"
          aria-label="Sections chantier"
        >
          {groups.map((g) => (
            <button
              key={g.id}
              type="button"
              role="tab"
              aria-selected={group === g.id}
              onClick={() => selectGroup(g)}
              className={cn(
                "shrink-0 rounded-lg px-3.5 py-2 text-xs font-semibold transition sm:text-[13px]",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1e3a5f]",
                group === g.id
                  ? "bg-[#1e3a5f] text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50 hover:text-[#1e3a5f]",
              )}
            >
              {g.label}
            </button>
          ))}
        </div>

        {showSubNav && activeGroup ? (
          <div className="mt-1.5 flex gap-1 overflow-x-auto px-0.5 pb-0.5">
            {activeGroup.externalLinks?.map((l) => (
              <Link
                key={l.href + l.label}
                href={l.href}
                className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-700 hover:border-[#1e3a5f]/30 hover:text-[#1e3a5f]"
              >
                {l.label}
              </Link>
            ))}
            {activeGroup.tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => selectTab(t.id)}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1.5 text-[12px] font-semibold transition",
                  tab === t.id
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/80",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {tab === "overview" && group === "overview" ? (
        <div className="space-y-4">
          {opsOverview ? (
            opsOverview
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((s) => {
                  const body = (
                    <>
                      <p className="text-2xl font-extrabold tabular-nums text-slate-900">
                        {s.value}
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-600">
                        {s.label}
                      </p>
                    </>
                  );
                  const cls = cn(
                    "rounded-2xl border p-4 shadow-[0_1px_0_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5",
                    toneClass[s.tone ?? "neutral"],
                  );
                  return s.href ? (
                    <Link key={s.label} href={s.href} className={cls}>
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
                  <p className="mt-3 text-sm text-slate-600">
                    Rien de bloquant pour le moment.
                  </p>
                ) : (
                  <ul className="mt-3 divide-y divide-slate-100">
                    {attentionItems.map((item) => (
                      <li key={item.id}>
                        <Link
                          href={item.href}
                          className="flex items-start gap-3 py-3 transition hover:bg-slate-50/80"
                        >
                          <span
                            className={cn(
                              "mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full",
                              dot[item.tone ?? "info"],
                            )}
                            aria-hidden
                          />
                          <span>
                            <span className="block text-sm font-semibold text-slate-900">
                              {item.title}
                            </span>
                            {item.subtitle ? (
                              <span className="mt-0.5 block text-xs text-slate-500">
                                {item.subtitle}
                              </span>
                            ) : null}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}

          <div>{panels.overview}</div>
        </div>
      ) : (
        <div id={tab === "documents" ? "dossier-chantier" : undefined}>
          {active}
        </div>
      )}
    </div>
  );
}
