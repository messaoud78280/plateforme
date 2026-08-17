"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  ChevronDown,
  Clock,
  FolderOpen,
  Inbox,
  Search,
  Star,
  TriangleAlert,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { HubCategoryId, HubCategoryStat, HubView } from "@/lib/ged/document-hub-ui";
import { HUB_CATEGORY_DEFS, HUB_CATEGORY_FAMILIES } from "@/lib/ged/document-hub-ui";
import { CATEGORY_ICONS } from "@/components/ged/GedUi";

type Go = (updates: Record<string, string>) => void;

const NAV_CAT_KEY = "bework.ged.nav.categories";
const NAV_FAM_KEY = "bework.ged.nav.families";

const FAMILY_DOT: Record<string, string> = {
  commercial: "bg-bework-accent",
  achats: "bg-bework-ok",
  chantier: "bg-bework-intel",
  technique: "bg-bework-cyan",
  marche: "bg-violet-400",
  securite: "bg-bework-critical",
  doe: "bg-bework-navy",
  autres: "bg-slate-400",
};

function readOpen(key: string, fallback: boolean): boolean {
  try {
    const v = sessionStorage.getItem(key);
    if (v === "1") return true;
    if (v === "0") return false;
  } catch {
    /* ignore */
  }
  return fallback;
}

function writeOpen(key: string, open: boolean) {
  try {
    sessionStorage.setItem(key, open ? "1" : "0");
  } catch {
    /* ignore */
  }
}

function NavBtn({
  active,
  onClick,
  children,
  count,
  tone,
  title,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  count?: number;
  tone?: "watch" | "ok" | "amber";
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "flex w-full min-w-0 items-center gap-2 rounded-xl px-2.5 py-1.5 text-left text-[13px] font-medium transition-colors",
        active
          ? "bg-white text-bework-navy shadow-[0_1px_2px_rgba(15,23,42,0.06)]"
          : "text-slate-600 hover:bg-white/70 hover:text-slate-900",
      )}
    >
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {count && count > 0 ? (
        <span
          className={cn(
            "inline-flex min-w-[1.25rem] shrink-0 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
            tone === "watch"
              ? "bg-bework-watch/15 text-[#b45309]"
              : tone === "amber"
                ? "bg-amber-100 text-amber-800"
                : "bg-slate-200/80 text-slate-600",
          )}
        >
          {count}
        </span>
      ) : null}
    </button>
  );
}

function SectionToggle({
  open,
  onToggle,
  label,
}: {
  open: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="mb-1.5 flex w-full items-center justify-between px-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400"
      aria-expanded={open}
    >
      {label}
      <ChevronDown
        className={cn("h-3.5 w-3.5 transition-transform", open ? "rotate-0" : "-rotate-90")}
        strokeWidth={2}
      />
    </button>
  );
}

export function DocumentCenterNav({
  view,
  group,
  projectId,
  origin,
  since,
  classifyCount,
  missingCount,
  categoryStats,
  projectStats,
  projects,
  hideProject,
  allowedViews,
  savedViews,
  activeSavedViewId,
  onOpenSavedView,
  onDeleteSavedView,
  onGo,
}: {
  view: HubView;
  group: string;
  projectId: string;
  origin: string;
  since: string;
  classifyCount: number;
  missingCount: number;
  categoryStats?: HubCategoryStat[];
  projectStats: Array<{ id: string; title: string; count: number; missingCount: number }>;
  projects: { id: string; title: string }[];
  hideProject?: boolean;
  allowedViews?: HubView[];
  savedViews?: Array<{ id: string; name: string }>;
  activeSavedViewId?: string | null;
  onOpenSavedView?: (id: string) => void;
  onDeleteSavedView?: (id: string) => void;
  onGo: Go;
}) {
  const [allProjects, setAllProjects] = useState(false);
  const [projectQ, setProjectQ] = useState("");
  const [catsOpen, setCatsOpen] = useState(true);
  const [familiesOpen, setFamiliesOpen] = useState<Record<string, boolean>>({});
  const can = (id: HubView) => !allowedViews || allowedViews.includes(id);

  useEffect(() => {
    setCatsOpen(readOpen(NAV_CAT_KEY, true));
    const next: Record<string, boolean> = {};
    for (const fam of HUB_CATEGORY_FAMILIES) {
      next[fam.id] = readOpen(`${NAV_FAM_KEY}.${fam.id}`, fam.id === "commercial" || fam.id === "chantier");
    }
    setFamiliesOpen(next);
  }, []);

  const statsById = useMemo(() => {
    const m = new Map<HubCategoryId, HubCategoryStat>();
    for (const s of categoryStats ?? []) m.set(s.id, s);
    return m;
  }, [categoryStats]);

  const filteredProjects = useMemo(() => {
    const q = projectQ.trim().toLowerCase();
    const list = q
      ? projects.filter((p) => p.title.toLowerCase().includes(q))
      : projects;
    return list.slice(0, 40);
  }, [projects, projectQ]);

  return (
    <nav className="space-y-5" aria-label="Navigation documentaire">
      <section>
        <p className="mb-1.5 px-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
          Accès rapide
        </p>
        <div className="space-y-0.5">
          <NavBtn
            active={view === "all" && group === "all" && !since && !origin && !projectId}
            onClick={() =>
              onGo({
                view: "all",
                group: "all",
                since: "",
                origin: "",
                docType: "",
                company: "",
                projectId: hideProject ? projectId : "",
                page: "1",
              })
            }
          >
            <span className="inline-flex min-w-0 items-center gap-2">
              <FolderOpen className="h-3.5 w-3.5 shrink-0 text-bework-navy" strokeWidth={1.75} />
              <span className="truncate">Bibliothèque</span>
            </span>
          </NavBtn>
          <NavBtn active={view === "recent"} onClick={() => onGo({ view: "recent", group: "all", sort: "recent", page: "1" })}>
            <span className="inline-flex min-w-0 items-center gap-2">
              <Clock className="h-3.5 w-3.5 shrink-0 text-bework-accent" strokeWidth={1.75} />
              <span className="truncate">Récents</span>
            </span>
          </NavBtn>
          {can("favorites") ? (
            <NavBtn active={view === "favorites"} onClick={() => onGo({ view: "favorites", group: "all", page: "1" })}>
              <span className="inline-flex min-w-0 items-center gap-2">
                <Star className="h-3.5 w-3.5 shrink-0 text-amber-500" strokeWidth={1.75} />
                <span className="truncate">Favoris</span>
              </span>
            </NavBtn>
          ) : null}
          {can("missing") ? (
            <NavBtn
              active={view === "missing"}
              count={missingCount}
              tone="watch"
              onClick={() => onGo({ view: "missing", group: "all", page: "1" })}
            >
              <span className="inline-flex min-w-0 items-center gap-2">
                <TriangleAlert className="h-3.5 w-3.5 shrink-0 text-bework-watch" strokeWidth={1.75} />
                <span className="truncate">À récupérer</span>
              </span>
            </NavBtn>
          ) : null}
          {can("classify") ? (
            <NavBtn
              active={view === "classify"}
              count={classifyCount}
              tone="amber"
              onClick={() => onGo({ view: "classify", group: "all", page: "1" })}
            >
              <span className="inline-flex min-w-0 items-center gap-2">
                <Inbox className="h-3.5 w-3.5 shrink-0 text-amber-700" strokeWidth={1.75} />
                <span className="truncate">À classer</span>
              </span>
            </NavBtn>
          ) : null}
        </div>
      </section>

      {savedViews && savedViews.length > 0 ? (
        <section>
          <p className="mb-1.5 px-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Vues enregistrées
          </p>
          <div className="space-y-0.5">
            {savedViews.map((sv) => (
              <div key={sv.id} className="group flex min-w-0 items-center gap-1">
                <NavBtn
                  active={activeSavedViewId === sv.id}
                  title={sv.name}
                  onClick={() => onOpenSavedView?.(sv.id)}
                >
                  <span className="truncate">{sv.name}</span>
                </NavBtn>
                {onDeleteSavedView ? (
                  <button
                    type="button"
                    onClick={() => onDeleteSavedView(sv.id)}
                    className="hidden shrink-0 px-1 text-[11px] text-slate-400 hover:text-slate-700 group-hover:block"
                    aria-label={`Supprimer ${sv.name}`}
                    title="Supprimer"
                  >
                    ×
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {can("missing") ? (
        <section>
          <p className="mb-1.5 px-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Raccourcis
          </p>
          <div className="space-y-0.5">
            <NavBtn active={since === "1"} onClick={() => onGo({ view: "all", since: "1", page: "1" })}>
              Ajoutés aujourd’hui
            </NavBtn>
            <NavBtn active={since === "7"} onClick={() => onGo({ view: "all", since: "7", page: "1" })}>
              Cette semaine
            </NavBtn>
            <NavBtn
              active={origin === "FOURNISSEUR"}
              onClick={() => onGo({ origin: "FOURNISSEUR", view: "all", page: "1" })}
            >
              Documents fournisseurs
            </NavBtn>
            <NavBtn
              active={origin === "DEVIS"}
              onClick={() => onGo({ origin: "DEVIS", view: "all", page: "1" })}
            >
              Documents clients
            </NavBtn>
            <NavBtn
              active={group === "doe"}
              onClick={() => onGo({ view: "categories", group: "doe", page: "1" })}
            >
              DOE
            </NavBtn>
          </div>
        </section>
      ) : null}

      <section>
        <SectionToggle
          open={catsOpen}
          label="Catégories"
          onToggle={() => {
            const next = !catsOpen;
            setCatsOpen(next);
            writeOpen(NAV_CAT_KEY, next);
          }}
        />
        {catsOpen ? (
          <div className="space-y-2">
            {HUB_CATEGORY_FAMILIES.map((fam) => {
              const open = familiesOpen[fam.id] ?? false;
              return (
                <div key={fam.id}>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !open;
                      setFamiliesOpen((prev) => ({ ...prev, [fam.id]: next }));
                      writeOpen(`${NAV_FAM_KEY}.${fam.id}`, next);
                    }}
                    className="mb-0.5 flex w-full items-center gap-2 px-2.5 text-[11px] font-semibold text-slate-500"
                    aria-expanded={open}
                  >
                    <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", FAMILY_DOT[fam.id] ?? "bg-slate-400")} />
                    <span className="min-w-0 flex-1 truncate text-left" title={fam.label}>
                      {fam.label}
                    </span>
                    <ChevronDown
                      className={cn("h-3 w-3 shrink-0 transition-transform", open ? "rotate-0" : "-rotate-90")}
                    />
                  </button>
                  {open ? (
                    <div className="space-y-0.5">
                      {fam.ids.map((id) => {
                        const def = HUB_CATEGORY_DEFS.find((c) => c.id === id);
                        if (!def) return null;
                        const Icon = CATEGORY_ICONS[id];
                        const stat = statsById.get(id);
                        const count = stat?.availableCount;
                        return (
                          <NavBtn
                            key={id}
                            active={group === id}
                            count={count}
                            title={def.label}
                            onClick={() => onGo({ view: "categories", group: id, page: "1" })}
                          >
                            <span className="inline-flex min-w-0 items-center gap-2">
                              {Icon ? <Icon className="h-3.5 w-3.5 shrink-0 opacity-70" strokeWidth={1.75} /> : null}
                              <span className="truncate">{def.label}</span>
                            </span>
                          </NavBtn>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : null}
      </section>

      {hideProject ? null : (
        <section>
          <p className="mb-1.5 px-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Chantiers récents
          </p>
          <div className="space-y-0.5">
            {projectStats.map((p) => (
              <NavBtn
                key={p.id}
                active={projectId === p.id}
                count={p.count}
                tone={p.missingCount > 0 ? "watch" : undefined}
                title={p.title}
                onClick={() => onGo({ projectId: p.id, view: "all", group: "all", page: "1" })}
              >
                <span className="inline-flex min-w-0 items-center gap-2">
                  <Building2 className="h-3.5 w-3.5 shrink-0 text-bework-intel" strokeWidth={1.75} />
                  <span className="truncate">{p.title}</span>
                  {p.missingCount > 0 ? (
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full bg-bework-watch"
                      title={`${p.missingCount} à récupérer`}
                    />
                  ) : null}
                </span>
              </NavBtn>
            ))}
            <button
              type="button"
              onClick={() => setAllProjects((v) => !v)}
              className="w-full px-2.5 py-1.5 text-left text-[12px] font-medium text-bework-navy hover:underline"
            >
              {allProjects ? "Réduire" : "Voir tous les chantiers"}
            </button>
            {allProjects ? (
              <div className="rounded-xl border border-slate-200/80 bg-white p-2">
                <label className="relative block">
                  <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    value={projectQ}
                    onChange={(e) => setProjectQ(e.target.value)}
                    placeholder="Rechercher un chantier…"
                    className="w-full rounded-lg border border-slate-200 py-1.5 pl-7 pr-2 text-[12px] outline-none focus:border-bework-accent/40"
                  />
                </label>
                <ul className="mt-1 max-h-48 overflow-y-auto">
                  {filteredProjects.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        title={p.title}
                        onClick={() => {
                          onGo({ projectId: p.id, view: "all", group: "all", page: "1" });
                          setAllProjects(false);
                        }}
                        className="w-full truncate rounded-lg px-2 py-1 text-left text-[12px] text-slate-700 hover:bg-slate-50"
                      >
                        {p.title}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </section>
      )}
    </nav>
  );
}
