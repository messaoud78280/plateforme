"use client";

import { useMemo, useState } from "react";
import {
  Building2,
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

const FAMILY_DOT: Record<string, string> = {
  commercial: "bg-bework-accent",
  achats: "bg-bework-ok",
  chantier: "bg-bework-intel",
  technique: "bg-bework-cyan",
  marche: "bg-bework-intel",
  securite: "bg-bework-critical",
  doe: "bg-bework-navy",
  autres: "bg-slate-400",
};

function NavBtn({
  active,
  onClick,
  children,
  count,
  tone,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  count?: number;
  tone?: "watch" | "ok" | "amber";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-left text-[13px] font-medium transition-colors",
        active
          ? "bg-white text-bework-navy shadow-[0_1px_2px_rgba(15,23,42,0.06)]"
          : "text-slate-600 hover:bg-white/70 hover:text-slate-900",
      )}
    >
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {count && count > 0 ? (
        <span
          className={cn(
            "inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
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
  onGo: Go;
}) {
  const [allProjects, setAllProjects] = useState(false);
  const [projectQ, setProjectQ] = useState("");
  const can = (id: HubView) => !allowedViews || allowedViews.includes(id);

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
    return list.slice(0, allProjects ? 40 : 0);
  }, [projects, projectQ, allProjects]);

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
            <span className="inline-flex items-center gap-2">
              <FolderOpen className="h-3.5 w-3.5 text-bework-navy" strokeWidth={1.75} />
              Tous les documents
            </span>
          </NavBtn>
          <NavBtn active={view === "recent"} onClick={() => onGo({ view: "recent", group: "all", sort: "recent", page: "1" })}>
            <span className="inline-flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-bework-accent" strokeWidth={1.75} />
              Récents
            </span>
          </NavBtn>
          {can("favorites") ? (
          <NavBtn active={view === "favorites"} onClick={() => onGo({ view: "favorites", group: "all", page: "1" })}>
            <span className="inline-flex items-center gap-2">
              <Star className="h-3.5 w-3.5 text-amber-500" strokeWidth={1.75} />
              Favoris
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
            <span className="inline-flex items-center gap-2">
              <TriangleAlert className="h-3.5 w-3.5 text-bework-watch" strokeWidth={1.75} />
              À récupérer
            </span>
          </NavBtn>
          ) : null}
          {can("classify") && (classifyCount > 0 || view === "classify") ? (
            <NavBtn
              active={view === "classify"}
              count={classifyCount}
              tone="amber"
              onClick={() => onGo({ view: "classify", group: "all", page: "1" })}
            >
              <span className="inline-flex items-center gap-2">
                <Inbox className="h-3.5 w-3.5 text-amber-700" strokeWidth={1.75} />
                À classer
              </span>
            </NavBtn>
          ) : null}
        </div>
      </section>

      {can("missing") ? (
      <section>
        <p className="mb-1.5 px-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
          Vues
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
        <p className="mb-1.5 px-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
          Catégories
        </p>
        <div className="space-y-3">
          {HUB_CATEGORY_FAMILIES.map((fam) => (
            <div key={fam.id}>
              <p className="mb-0.5 flex items-center gap-2 px-2.5 text-[11px] font-semibold text-slate-500">
                <span className={cn("h-1.5 w-1.5 rounded-full", FAMILY_DOT[fam.id] ?? "bg-slate-400")} />
                {fam.label}
              </p>
              <div className="space-y-0.5">
                {fam.ids.map((id) => {
                  const def = HUB_CATEGORY_DEFS.find((c) => c.id === id);
                  if (!def) return null;
                  const Icon = CATEGORY_ICONS[id];
                  const stat = statsById.get(id);
                  const count = stat ? stat.availableCount + stat.missingCount : undefined;
                  return (
                    <NavBtn
                      key={id}
                      active={group === id}
                      count={count}
                      onClick={() => onGo({ view: "categories", group: id, page: "1" })}
                    >
                      <span className="inline-flex items-center gap-2">
                        {Icon ? <Icon className="h-3.5 w-3.5 opacity-70" strokeWidth={1.75} /> : null}
                        {def.label}
                      </span>
                    </NavBtn>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {hideProject ? null : (
        <section>
          <p className="mb-1.5 px-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Chantiers
          </p>
          <div className="space-y-0.5">
            {projectStats.map((p) => (
              <NavBtn
                key={p.id}
                active={projectId === p.id}
                count={p.count}
                tone={p.missingCount > 0 ? "watch" : undefined}
                onClick={() => onGo({ projectId: p.id, view: "all", group: "all", page: "1" })}
              >
                <span className="inline-flex min-w-0 items-center gap-2">
                  <Building2 className="h-3.5 w-3.5 shrink-0 text-bework-intel" strokeWidth={1.75} />
                  <span className="truncate">{p.title}</span>
                  {p.missingCount > 0 ? (
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-bework-watch" title="Pièces à récupérer" />
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
