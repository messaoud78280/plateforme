"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Calendar,
  ClipboardList,
  FileText,
  Receipt,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { FOLLOW_UP_PHASES, phaseForStatus, type FollowUpPhaseId } from "@/lib/follow-up/phases";
import { STATUS_LABELS, URGENCY_LABELS } from "@/lib/follow-up/types";
import { formatDaysInStepLabel } from "@/lib/follow-up/urgency";
import { isFollowUpUrgentLevel } from "@/lib/follow-up/kpi";
import type { FollowUpCardData } from "@/components/follow-up/FollowUpPostItCard";
import type { SerializedAttention } from "@/lib/follow-up/attention";
import {
  FollowUpKanban,
  type KanbanColumn,
  type KanbanSheet,
} from "@/components/follow-up/FollowUpKanban";
import { PageHeader } from "@/components/ui/PageHeader";

export type FollowUpWorkspaceSheet = FollowUpCardData & {
  status: string;
  colorKey: string;
  clientName?: string | null;
  nextActionAt?: string | null;
  nextActionAtLabel?: string | null;
  statusEnteredAt?: string | null;
  assigneeId?: string | null;
  projectId?: string | null;
  projectTitle?: string | null;
  attention?: SerializedAttention | null;
  createdAt?: string | null;
};

type ViewId = "attention" | "liste" | "workflow";
type ScopeId = "mine" | "team";
type SortId = "attention" | "due" | "step_time" | "activity" | "project" | "assignee";
type GroupId = "none" | "status" | "phase" | "project" | "assignee" | "attention" | "due";

type Props = {
  sheets: FollowUpWorkspaceSheet[];
  columns: KanbanColumn[];
  canEdit: boolean;
  currentUserId: string;
  initialView?: ViewId;
  initialFilter?: string | null;
  initialScope?: ScopeId;
};

function refLabel(s: FollowUpWorkspaceSheet) {
  if (s.osNumber) return `OS-${s.osNumber}`;
  if (s.orderNumber) return s.orderNumber;
  return null;
}

function displayTitle(s: FollowUpWorkspaceSheet) {
  const ref = refLabel(s);
  return ref ? `${s.title} — ${ref}` : s.title;
}

function effectiveUrgency(s: FollowUpWorkspaceSheet) {
  return (s.attention?.effectiveUrgency ?? s.urgency) as string;
}

function overdueDays(s: FollowUpWorkspaceSheet): number | null {
  if (!s.delayLabel) return null;
  const m = String(s.delayLabel).match(/(\d+)\s*j/);
  if (m) return Number(m[1]);
  if (String(s.delayLabel).includes("h") || String(s.delayLabel).includes("min")) return 0;
  return null;
}

function dueShort(s: FollowUpWorkspaceSheet): string | null {
  if (s.delayLabel) {
    const d = overdueDays(s);
    if (d != null && d > 0) return `${d} j de retard`;
    return `${s.delayLabel} de retard`;
  }
  if (s.nextActionAtLabel && s.nextActionAtLabel !== "—") return s.nextActionAtLabel;
  return null;
}

/** Badge attention calme — pas de doublon avec le retard. */
function attentionBadge(s: FollowUpWorkspaceSheet): { label: string; className: string } | null {
  const u = effectiveUrgency(s);
  if (u === "NORMAL" || u === "A_SURVEILLER") return null;
  if (s.delayLabel && (u === "URGENT" || u === "CRITIQUE")) {
    // Le retard porte déjà l’info — n’afficher Critique que si réellement CRITIQUE
    if (u !== "CRITIQUE") return null;
  }
  if (u === "CRITIQUE") {
    return { label: "Critique", className: "bg-red-50 text-red-800 border-red-200/70" };
  }
  if (u === "URGENT") {
    return { label: "Urgent", className: "bg-orange-50 text-orange-900 border-orange-200/70" };
  }
  if (u === "IMPORTANT") {
    return { label: "Important", className: "bg-amber-50 text-amber-900 border-amber-200/70" };
  }
  return null;
}

function primaryAction(status: string): { label: string; hrefSuffix?: string } {
  if (["NOUVEAU", "A_PLANIFIER", "A_ANALYSER", "PLANIFIE"].includes(status)) {
    return { label: "Planifier" };
  }
  if (["ATTENTE_FOURNISSEUR", "COMMANDE_FOURNISSEUR", "COMMANDE_PASSEE"].includes(status)) {
    return { label: "Relancer" };
  }
  if (status === "TRAVAUX_TERMINES") return { label: "Préparer facturation" };
  if (status === "A_FACTURER") return { label: "Facturer" };
  if (status === "AVENANT") return { label: "Continuer l’avenant" };
  if (["ATTENTE_REGLEMENT", "FACTURE"].includes(status)) return { label: "Voir" };
  return { label: "Continuer" };
}

function ChangeStepMenu({
  sheet,
  columns,
  onDone,
}: {
  sheet: FollowUpWorkspaceSheet;
  columns: KanbanColumn[];
  onDone: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function move(to: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/follow-up/${sheet.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: to, source: "menu" }),
      });
      if (res.ok) {
        setOpen(false);
        onDone();
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        disabled={busy}
        onClick={() => setOpen((v) => !v)}
        className="rounded-full border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-700 disabled:opacity-50"
      >
        Changer d’étape
      </button>
      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-10"
            aria-label="Fermer"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-20 mt-1 max-h-56 w-52 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
            <p className="px-3 py-1 text-[10px] font-semibold uppercase text-slate-400">
              Passer à
            </p>
            {columns
              .filter((c) => c.statusKey !== sheet.status && c.statusKey !== "__AUTRES__")
              .map((c) => (
                <button
                  key={c.statusKey}
                  type="button"
                  className="block w-full px-3 py-1.5 text-left text-[12px] hover:bg-slate-50"
                  onClick={() => void move(c.statusKey)}
                >
                  {c.label}
                </button>
              ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

export function FollowUpWorkspace({
  sheets,
  columns,
  canEdit,
  currentUserId,
  initialView = "attention",
  initialFilter = null,
  initialScope = "team",
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [view, setView] = useState<ViewId>(initialView);
  const [scope, setScope] = useState<ScopeId>(initialScope);
  const [q, setQ] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [showMoreKpi, setShowMoreKpi] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [urgencyFilter, setUrgencyFilter] = useState("");
  const [phaseFilter, setPhaseFilter] = useState<"" | FollowUpPhaseId>("");
  const [sort, setSort] = useState<SortId>("attention");
  const [groupBy, setGroupBy] = useState<GroupId>("none");
  const [drawer, setDrawer] = useState<FollowUpWorkspaceSheet | null>(null);
  const [kpiFilter, setKpiFilter] = useState<string | null>(initialFilter);

  useEffect(() => {
    setKpiFilter(initialFilter);
  }, [initialFilter]);

  function pushUrl(patch: Record<string, string>) {
    const url = new URL(window.location.href);
    for (const [k, v] of Object.entries(patch)) {
      if (!v) url.searchParams.delete(k);
      else url.searchParams.set(k, v);
    }
    startTransition(() => {
      window.history.replaceState({}, "", url.toString());
    });
  }

  function setViewAndUrl(v: ViewId) {
    setView(v);
    pushUrl({
      view: v === "attention" ? "attention" : v === "liste" ? "liste" : "tableau",
    });
  }

  const now = useMemo(() => new Date(), []);
  const startToday = useMemo(() => {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [now]);
  const endToday = useMemo(() => {
    const d = new Date(now);
    d.setHours(23, 59, 59, 999);
    return d;
  }, [now]);
  const endWeek = useMemo(() => {
    const d = new Date(startToday);
    const day = d.getDay();
    d.setDate(d.getDate() + (day === 0 ? 0 : 7 - day));
    d.setHours(23, 59, 59, 999);
    return d;
  }, [startToday]);

  const filtered = useMemo(() => {
    let list = [...sheets];
    if (scope === "mine") list = list.filter((s) => s.assigneeId === currentUserId);

    const needle = q.trim().toLowerCase();
    if (needle) {
      list = list.filter((s) =>
        [s.title, s.osNumber, s.orderNumber, s.clientName, s.nextAction, s.assignee?.name, s.projectTitle]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(needle),
      );
    }
    if (statusFilter) list = list.filter((s) => s.status === statusFilter);
    if (assigneeFilter) list = list.filter((s) => s.assigneeId === assigneeFilter);
    if (urgencyFilter) list = list.filter((s) => effectiveUrgency(s) === urgencyFilter);
    if (phaseFilter) {
      list = list.filter((s) => phaseForStatus(s.status)?.id === phaseFilter);
    }

    if (kpiFilter === "overdue") list = list.filter((s) => Boolean(s.delayLabel));
    else if (kpiFilter === "today") {
      list = list.filter((s) => {
        if (!s.nextActionAt || s.nextActionDone) return false;
        const d = new Date(s.nextActionAt);
        return d >= startToday && d <= endToday;
      });
    } else if (kpiFilter === "week") {
      list = list.filter((s) => {
        if (!s.nextActionAt || s.nextActionDone) return false;
        const d = new Date(s.nextActionAt);
        return d >= startToday && d <= endWeek;
      });
    } else if (kpiFilter === "a-facturer") {
      list = list.filter((s) => s.status === "A_FACTURER" || s.status === "TRAVAUX_TERMINES");
    } else if (kpiFilter === "a-planifier") {
      list = list.filter((s) =>
        ["NOUVEAU", "A_PLANIFIER", "A_ANALYSER"].includes(s.status),
      );
    } else if (kpiFilter === "urgent") {
      list = list.filter((s) => isFollowUpUrgentLevel(effectiveUrgency(s)));
    } else if (kpiFilter === "avenant") {
      list = list.filter((s) => s.status === "AVENANT");
    } else if (kpiFilter === "non-preparees") {
      list = list.filter(
        (s) =>
          s.status === "INTERVENTION_PREVUE" ||
          s.status === "COMMANDE_FOURNISSEUR" ||
          (s.nextAction ?? "").toLowerCase().includes("commander"),
      );
    }

    list.sort((a, b) => {
      if (sort === "due") {
        const da = a.nextActionAt ? new Date(a.nextActionAt).getTime() : Number.POSITIVE_INFINITY;
        const db = b.nextActionAt ? new Date(b.nextActionAt).getTime() : Number.POSITIVE_INFINITY;
        return da - db;
      }
      if (sort === "step_time") {
        const ea = a.statusEnteredAt ? new Date(a.statusEnteredAt).getTime() : 0;
        const eb = b.statusEnteredAt ? new Date(b.statusEnteredAt).getTime() : 0;
        return ea - eb;
      }
      if (sort === "activity") {
        return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
      }
      if (sort === "project") {
        return (a.projectTitle ?? a.title).localeCompare(b.projectTitle ?? b.title, "fr");
      }
      if (sort === "assignee") {
        return (a.assignee?.name ?? "").localeCompare(b.assignee?.name ?? "", "fr");
      }
      // attention
      const rank = (u: string) =>
        ({ CRITIQUE: 4, URGENT: 3, IMPORTANT: 2, A_SURVEILLER: 1, NORMAL: 0 }[u] ?? 0);
      const ra = rank(effectiveUrgency(a));
      const rb = rank(effectiveUrgency(b));
      if (rb !== ra) return rb - ra;
      if (Boolean(a.delayLabel) !== Boolean(b.delayLabel)) return a.delayLabel ? -1 : 1;
      return 0;
    });
    return list;
  }, [
    sheets,
    scope,
    currentUserId,
    q,
    statusFilter,
    assigneeFilter,
    urgencyFilter,
    phaseFilter,
    kpiFilter,
    sort,
    startToday,
    endToday,
    endWeek,
  ]);

  const attentionGroups = useMemo(() => {
    const used = new Set<string>();
    const take = (pred: (s: FollowUpWorkspaceSheet) => boolean) => {
      const items: FollowUpWorkspaceSheet[] = [];
      for (const s of filtered) {
        if (used.has(s.id)) continue;
        if (pred(s)) {
          used.add(s.id);
          items.push(s);
        }
      }
      return items;
    };
    return [
      {
        id: "urgent",
        label: "Urgent",
        items: take((s) => isFollowUpUrgentLevel(effectiveUrgency(s))),
      },
      {
        id: "today",
        label: "Aujourd’hui",
        items: take((s) => {
          if (!s.nextActionAt || s.nextActionDone) return false;
          const d = new Date(s.nextActionAt);
          return d >= startToday && d <= endToday;
        }),
      },
      {
        id: "week",
        label: "Cette semaine",
        items: take((s) => {
          if (!s.nextActionAt || s.nextActionDone) return false;
          const d = new Date(s.nextActionAt);
          return d > endToday && d <= endWeek;
        }),
      },
      {
        id: "external",
        label: "En attente externe",
        items: take((s) =>
          ["ATTENTE_FOURNISSEUR", "COMMANDE_FOURNISSEUR", "ATTENTE_REGLEMENT"].includes(
            s.status,
          ),
        ),
      },
      {
        id: "billing",
        label: "À facturer",
        items: take((s) => s.status === "A_FACTURER" || s.status === "TRAVAUX_TERMINES"),
      },
      {
        id: "watch",
        label: "À surveiller",
        items: take(
          (s) =>
            effectiveUrgency(s) === "A_SURVEILLER" ||
            effectiveUrgency(s) === "IMPORTANT" ||
            Boolean(s.delayLabel),
        ),
      },
    ].filter((g) => g.items.length > 0);
  }, [filtered, startToday, endToday, endWeek]);

  const listGroups = useMemo(() => {
    if (groupBy === "none") return [{ id: "all", label: null as string | null, items: filtered }];
    const map = new Map<string, { label: string; items: FollowUpWorkspaceSheet[] }>();
    for (const s of filtered) {
      let key = "x";
      let label = "Autres";
      if (groupBy === "status") {
        key = s.status;
        label = s.statusLabel || STATUS_LABELS[s.status as keyof typeof STATUS_LABELS] || s.status;
      } else if (groupBy === "phase") {
        const p = phaseForStatus(s.status);
        key = p?.id ?? "other";
        label = p?.label ?? "Autres";
      } else if (groupBy === "project") {
        key = s.projectId ?? "none";
        label = s.projectTitle ?? s.title;
      } else if (groupBy === "assignee") {
        key = s.assigneeId ?? "none";
        label = s.assignee?.name ?? "Non assigné";
      } else if (groupBy === "attention") {
        key = effectiveUrgency(s);
        label = URGENCY_LABELS[key as keyof typeof URGENCY_LABELS] ?? key;
      } else if (groupBy === "due") {
        key = s.delayLabel ? "overdue" : s.nextActionAt ? "dated" : "none";
        label =
          key === "overdue" ? "En retard" : key === "dated" ? "Avec échéance" : "Sans échéance";
      }
      const cur = map.get(key) ?? { label, items: [] };
      cur.items.push(s);
      map.set(key, cur);
    }
    return [...map.entries()].map(([id, g]) => ({ id, label: g.label, items: g.items }));
  }, [filtered, groupBy]);

  const assignees = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of sheets) {
      if (s.assigneeId && s.assignee?.name) m.set(s.assigneeId, s.assignee.name);
    }
    return [...m.entries()];
  }, [sheets]);

  const kpiMain = [
    {
      id: "treat",
      label: "À traiter",
      value: attentionGroups.reduce((n, g) => n + g.items.length, 0) || filtered.length,
      tone: "navy" as const,
      icon: ClipboardList,
      onClick: () => {
        setViewAndUrl("attention");
        setKpiFilter(null);
        pushUrl({ filter: "" });
      },
    },
    {
      id: "late",
      label: "En retard",
      value: sheets.filter((s) => s.delayLabel).length,
      tone: "critical" as const,
      icon: AlertTriangle,
      onClick: () => {
        setKpiFilter("overdue");
        pushUrl({ filter: "overdue" });
      },
    },
    {
      id: "today",
      label: "Aujourd’hui",
      value: sheets.filter((s) => {
        if (!s.nextActionAt || s.nextActionDone) return false;
        const d = new Date(s.nextActionAt);
        return d >= startToday && d <= endToday;
      }).length,
      tone: "accent" as const,
      icon: Calendar,
      onClick: () => {
        setKpiFilter("today");
        pushUrl({ filter: "today" });
      },
    },
    {
      id: "bill",
      label: "À facturer",
      value: sheets.filter((s) => s.status === "A_FACTURER" || s.status === "TRAVAUX_TERMINES")
        .length,
      tone: "cyan" as const,
      icon: Receipt,
      onClick: () => {
        setKpiFilter("a-facturer");
        pushUrl({ filter: "a-facturer" });
      },
    },
    {
      id: "plan",
      label: "À planifier",
      value: sheets.filter((s) =>
        ["NOUVEAU", "A_PLANIFIER", "A_ANALYSER"].includes(s.status),
      ).length,
      tone: "violet" as const,
      icon: FileText,
      onClick: () => {
        setKpiFilter("a-planifier");
        pushUrl({ filter: "a-planifier" });
      },
    },
  ];

  const kpiMore = [
    {
      label: "Avenants",
      value: sheets.filter((s) => s.status === "AVENANT").length,
      filter: "avenant",
    },
    {
      label: "Cette semaine",
      value: sheets.filter((s) => {
        if (!s.nextActionAt || s.nextActionDone) return false;
        const d = new Date(s.nextActionAt);
        return d >= startToday && d <= endWeek;
      }).length,
      filter: "week",
    },
    {
      label: "Urgences",
      value: sheets.filter((s) => isFollowUpUrgentLevel(effectiveUrgency(s))).length,
      filter: "urgent",
    },
  ];

  function RowActions({ s }: { s: FollowUpWorkspaceSheet }) {
    const act = primaryAction(s.status);
    return (
      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
        <Link
          href={`/dashboard/fiches-suivi/${s.id}`}
          className="rounded-full bg-[#1e3a5f] px-2.5 py-1 text-[11px] font-medium text-white"
        >
          {act.label}
        </Link>
        {canEdit ? (
          <ChangeStepMenu sheet={s} columns={columns} onDone={() => setDrawer(null)} />
        ) : null}
      </div>
    );
  }

  function SheetRowCompact({ s }: { s: FollowUpWorkspaceSheet }) {
    const attn = attentionBadge(s);
    const due = dueShort(s);
    return (
      <li
        className="group relative cursor-pointer overflow-hidden rounded-xl border border-slate-200/90 bg-white pl-4 pr-3 py-2.5 shadow-[var(--cc-shadow)] transition hover:border-bework-navy/15 hover:shadow-md"
        onClick={() => setDrawer(s)}
      >
        <span
          className={cn(
            "absolute inset-y-0 left-0 w-[3px]",
            s.delayLabel
              ? (overdueDays(s) ?? 0) > 7
                ? "bg-red-500"
                : "bg-orange-400"
              : effectiveUrgency(s) === "CRITIQUE"
                ? "bg-red-500"
                : effectiveUrgency(s) === "URGENT"
                  ? "bg-orange-500"
                  : effectiveUrgency(s) === "IMPORTANT"
                    ? "bg-amber-400"
                    : "bg-slate-300",
          )}
          aria-hidden
        />
        <div className="grid gap-2 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(7rem,0.6fr)_5.5rem_auto] lg:items-center">
          <div className="min-w-0 pl-1">
            <p className="truncate text-[14px] font-semibold text-bework-ink">{displayTitle(s)}</p>
            <p className="truncate text-[12px] text-slate-500">
              {s.statusLabel}
              {s.clientName ? ` · ${s.clientName}` : ""}
            </p>
          </div>
          <div className="min-w-0 pl-1 lg:pl-0">
            <p className="text-[11px] uppercase tracking-wide text-slate-400">Prochaine action</p>
            <p className="truncate text-[13px] font-medium text-slate-800">
              {s.nextAction && !s.nextActionDone ? s.nextAction : "—"}
            </p>
          </div>
          <div className="pl-1 text-[12px] text-slate-700 lg:pl-0">
            <p className="font-medium">{s.assignee?.name?.split(/\s+/)[0] ?? "—"}</p>
            {due ? (
              <p
                className={cn(
                  "font-medium",
                  s.delayLabel ? "text-orange-800" : "text-slate-600",
                )}
              >
                {due}
              </p>
            ) : null}
          </div>
          <div>
            {attn ? (
              <span
                className={cn(
                  "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                  attn.className,
                )}
              >
                {attn.label}
              </span>
            ) : (
              <span className="text-[12px] text-slate-400">—</span>
            )}
          </div>
          <RowActions s={s} />
        </div>
      </li>
    );
  }

  return (
    <div className={cn("mx-auto space-y-4 px-4 pb-10 sm:px-6", pending && "opacity-90", view === "workflow" ? "max-w-[100vw]" : "max-w-[1440px]")}>
      <PageHeader
        title="Fiches de suivi"
        description="Suivez vos dossiers, leurs prochaines actions et leur avancement."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-full border border-slate-200 bg-white p-0.5 text-[12px] font-semibold">
              {(
                [
                  ["attention", "À traiter"],
                  ["liste", "Liste"],
                  ["workflow", "Workflow"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setViewAndUrl(id)}
                  className={cn(
                    "rounded-full px-3 py-1.5",
                    view === id ? "bg-bework-navy text-white" : "text-slate-600",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <Link
              href="/dashboard/fiches-suivi/nouvelle"
              className="rounded-full bg-[#1e3a5f] px-4 py-2 text-[13px] font-medium text-white"
            >
              + Nouvelle fiche
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
        {kpiMain.map((k) => {
          const Icon = k.icon;
          return (
            <button
              key={k.id}
              type="button"
              onClick={k.onClick}
              className={cn(
                "rounded-2xl border px-3 py-2.5 text-left shadow-[var(--cc-shadow)] transition hover:-translate-y-px",
                k.tone === "critical" && "border-red-200/50 bg-red-50/35",
                k.tone === "accent" && "border-amber-200/50 bg-amber-50/40",
                k.tone === "cyan" && "border-cyan-200/50 bg-cyan-50/40",
                k.tone === "violet" && "border-violet-200/50 bg-violet-50/40",
                k.tone === "navy" && "border-bework-navy/10 bg-bework-soft-navy/40",
              )}
            >
              <div className="flex items-start justify-between">
                <p
                  className={cn(
                    "text-[1.2rem] font-semibold tabular-nums",
                    k.tone === "critical" && k.value > 0 ? "text-red-700" : "text-bework-navy",
                  )}
                >
                  {k.value}
                </p>
                <Icon className="h-4 w-4 text-bework-navy/55" strokeWidth={1.75} />
              </div>
              <p className="mt-1 text-[12px] font-medium text-slate-700">{k.label}</p>
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-2 text-[12px]">
        <button
          type="button"
          onClick={() => setShowMoreKpi((v) => !v)}
          className="font-medium text-bework-navy hover:underline"
        >
          {showMoreKpi ? "Masquer" : "+ 3 indicateurs"}
        </button>
        {showMoreKpi
          ? kpiMore.map((k) => (
              <button
                key={k.filter}
                type="button"
                onClick={() => {
                  setKpiFilter(k.filter);
                  pushUrl({ filter: k.filter });
                }}
                className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700"
              >
                {k.label} · {k.value}
              </button>
            ))
          : null}
      </div>

      <div className="sticky top-14 z-20 space-y-2 rounded-2xl border border-slate-200/80 bg-white/95 p-3 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher un dossier, chantier, client, OS…"
            className="min-w-0 flex-1 rounded-full border border-slate-200 px-4 py-2 text-[13px] outline-none focus:border-bework-accent/40"
          />
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-full border border-slate-200 bg-slate-50 p-0.5 text-[12px] font-semibold">
              <button
                type="button"
                onClick={() => {
                  setScope("mine");
                  pushUrl({ scope: "mine" });
                }}
                className={cn(
                  "rounded-full px-3 py-1.5",
                  scope === "mine" ? "bg-bework-navy text-white" : "text-slate-600",
                )}
              >
                Mes fiches
              </button>
              <button
                type="button"
                onClick={() => {
                  setScope("team");
                  pushUrl({ scope: "" });
                }}
                className={cn(
                  "rounded-full px-3 py-1.5",
                  scope === "team" ? "bg-bework-navy text-white" : "text-slate-600",
                )}
              >
                Équipe
              </button>
            </div>
            <button
              type="button"
              onClick={() => setFiltersOpen((v) => !v)}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-[12px] font-medium"
            >
              Filtres
            </button>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortId)}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-[12px]"
            >
              <option value="attention">Attention</option>
              <option value="due">Prochaine échéance</option>
              <option value="step_time">Temps dans l’étape</option>
              <option value="activity">Dernière activité</option>
              <option value="project">Chantier</option>
              <option value="assignee">Responsable</option>
            </select>
            {view === "liste" ? (
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as GroupId)}
                className="rounded-full border border-slate-200 px-3 py-1.5 text-[12px]"
              >
                <option value="none">Sans regroupement</option>
                <option value="status">Par étape</option>
                <option value="phase">Par macro-phase</option>
                <option value="project">Par chantier</option>
                <option value="assignee">Par responsable</option>
                <option value="attention">Par attention</option>
                <option value="due">Par échéance</option>
              </select>
            ) : null}
            {view === "workflow" ? (
              <select
                value={phaseFilter}
                onChange={(e) => setPhaseFilter(e.target.value as "" | FollowUpPhaseId)}
                className="rounded-full border border-slate-200 px-3 py-1.5 text-[12px]"
              >
                <option value="">Tout le workflow</option>
                {FOLLOW_UP_PHASES.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            ) : null}
          </div>
        </div>
        {filtersOpen ? (
          <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[12px]"
            >
              <option value="">Étape — toutes</option>
              {columns.map((c) => (
                <option key={c.statusKey} value={c.statusKey}>
                  {c.label}
                </option>
              ))}
            </select>
            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[12px]"
            >
              <option value="">Responsable — tous</option>
              {assignees.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
            <select
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value)}
              className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[12px]"
            >
              <option value="">Attention — toutes</option>
              {(["CRITIQUE", "URGENT", "IMPORTANT", "A_SURVEILLER", "NORMAL"] as const).map(
                (u) => (
                  <option key={u} value={u}>
                    {URGENCY_LABELS[u]}
                  </option>
                ),
              )}
            </select>
            {kpiFilter ? (
              <button
                type="button"
                onClick={() => {
                  setKpiFilter(null);
                  pushUrl({ filter: "" });
                }}
                className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium"
              >
                Filtre KPI ×
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {sheets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center">
          <p className="text-sm font-semibold text-slate-800">Aucune fiche pour le moment</p>
          <Link
            href="/dashboard/fiches-suivi/nouvelle"
            className="mt-4 inline-flex rounded-full bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white"
          >
            + Nouvelle fiche
          </Link>
        </div>
      ) : view === "workflow" ? (
        columns.length === 0 ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-8 text-sm text-amber-950">
            Aucun processus métier trouvé. Configurez-le dans{" "}
            <Link href="/dashboard/parametres/processus" className="font-semibold underline">
              Paramètres → Processus métier
            </Link>
            .
          </div>
        ) : (
          <FollowUpKanban
            columns={
              phaseFilter
                ? columns.filter((c) => phaseForStatus(c.statusKey)?.id === phaseFilter)
                : columns
            }
            sheets={filtered as KanbanSheet[]}
            canEdit={canEdit}
            currentUserId={currentUserId}
            compact
          />
        )
      ) : view === "attention" ? (
        attentionGroups.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-600">
            ✓ Rien d’urgent à traiter dans ce filtre.
          </p>
        ) : (
          <div className="space-y-5">
            {attentionGroups.map((g) => (
              <section key={g.id}>
                <h2 className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-slate-500">
                  {g.label}
                  <span className="ml-1.5 font-medium normal-case text-slate-400">
                    · {g.items.length}
                  </span>
                </h2>
                <ul className="space-y-1.5">
                  {g.items.map((s) => (
                    <SheetRowCompact key={s.id} s={s} />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )
      ) : (
        <div className="space-y-5">
          {listGroups.map((g) => (
            <section key={g.id}>
              {g.label ? (
                <h2 className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-slate-500">
                  {g.label} · {g.items.length}
                </h2>
              ) : null}
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="hidden grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)_minmax(0,1fr)_6.5rem_5.5rem_5rem_auto] gap-2 border-b border-slate-100 bg-slate-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 lg:grid">
                  <span>Dossier</span>
                  <span>Étape</span>
                  <span>Prochaine action</span>
                  <span>Responsable</span>
                  <span>Échéance</span>
                  <span>Attention</span>
                  <span className="text-right">Action</span>
                </div>
                <ul className="divide-y divide-slate-100">
                  {g.items.map((s) => {
                    const attn = attentionBadge(s);
                    const due = dueShort(s);
                    return (
                      <li
                        key={s.id}
                        className="cursor-pointer px-4 py-2.5 hover:bg-slate-50/80"
                        onClick={() => setDrawer(s)}
                      >
                        <div className="grid gap-2 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)_minmax(0,1fr)_6.5rem_5.5rem_5rem_auto] lg:items-center">
                          <div className="min-w-0">
                            <p className="truncate text-[14px] font-semibold">{displayTitle(s)}</p>
                            <p className="truncate text-[12px] text-slate-500">
                              {s.clientName ?? s.projectTitle ?? "—"}
                            </p>
                          </div>
                          <p className="text-[13px] text-slate-700">{s.statusLabel}</p>
                          <p className="truncate text-[13px] font-medium text-slate-800">
                            {s.nextAction && !s.nextActionDone ? s.nextAction : "—"}
                          </p>
                          <p className="text-[13px]">{s.assignee?.name?.split(/\s+/)[0] ?? "—"}</p>
                          <p
                            className={cn(
                              "text-[12px] font-medium",
                              s.delayLabel ? "text-orange-800" : "text-slate-600",
                            )}
                          >
                            {due ?? "—"}
                          </p>
                          <div>
                            {attn ? (
                              <span
                                className={cn(
                                  "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                                  attn.className,
                                )}
                              >
                                {attn.label}
                              </span>
                            ) : (
                              "—"
                            )}
                          </div>
                          <RowActions s={s} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </section>
          ))}
        </div>
      )}

      {drawer ? (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-slate-900/20"
          onClick={() => setDrawer(null)}
        >
          <aside
            className="h-full w-full max-w-md overflow-y-auto bg-white p-5 shadow-[-8px_0_32px_rgba(15,23,42,0.12)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-[17px] font-semibold text-bework-ink">{displayTitle(drawer)}</h2>
                <p className="mt-1 text-[13px] text-slate-600">{drawer.statusLabel}</p>
              </div>
              <button type="button" onClick={() => setDrawer(null)} className="text-slate-400" aria-label="Fermer">
                ×
              </button>
            </div>
            <dl className="mt-4 space-y-3 text-[13px]">
              <div>
                <dt className="text-[11px] uppercase text-slate-400">Étape</dt>
                <dd className="font-medium">{drawer.statusLabel}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase text-slate-400">Prochaine action</dt>
                <dd className="font-semibold text-slate-900">
                  {drawer.nextAction && !drawer.nextActionDone ? drawer.nextAction : "—"}
                </dd>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <dt className="text-[11px] uppercase text-slate-400">Responsable</dt>
                  <dd className="font-medium">{drawer.assignee?.name ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase text-slate-400">Échéance</dt>
                  <dd className={cn("font-medium", drawer.delayLabel && "text-orange-800")}>
                    {dueShort(drawer) ?? "—"}
                  </dd>
                </div>
              </div>
              {attentionBadge(drawer) ? (
                <div>
                  <dt className="text-[11px] uppercase text-slate-400">Attention</dt>
                  <dd className="font-medium">{attentionBadge(drawer)!.label}</dd>
                </div>
              ) : null}
              <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
                <div>
                  <dt className="text-[11px] uppercase text-slate-400">Chantier</dt>
                  <dd>{drawer.projectTitle ?? drawer.title}</dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase text-slate-400">Client</dt>
                  <dd>{drawer.clientName ?? "—"}</dd>
                </div>
              </div>
              {(refLabel(drawer) || drawer.workObject) && (
                <div className="grid grid-cols-2 gap-3">
                  {refLabel(drawer) ? (
                    <div>
                      <dt className="text-[11px] uppercase text-slate-400">Référence</dt>
                      <dd>{refLabel(drawer)}</dd>
                    </div>
                  ) : null}
                  {drawer.workObject ? (
                    <div>
                      <dt className="text-[11px] uppercase text-slate-400">Type</dt>
                      <dd>{drawer.workObject}</dd>
                    </div>
                  ) : null}
                </div>
              )}
              <div>
                <dt className="text-[11px] uppercase text-slate-400">Dans cette étape</dt>
                <dd>
                  {formatDaysInStepLabel(
                    drawer.statusEnteredAt ? new Date(drawer.statusEnteredAt) : null,
                  ) ?? "—"}
                </dd>
              </div>
              {(() => {
                const idx = columns.findIndex((c) => c.statusKey === drawer.status);
                if (idx < 0 || columns.length < 2) return null;
                return (
                  <div>
                    <dt className="text-[11px] uppercase text-slate-400">Progression</dt>
                    <dd className="font-medium tabular-nums">
                      {idx + 1} / {columns.length} étapes
                    </dd>
                  </div>
                );
              })()}
            </dl>
            <div className="mt-5 flex flex-col gap-2">
              <Link
                href={`/dashboard/fiches-suivi/${drawer.id}`}
                className="rounded-full bg-[#1e3a5f] px-4 py-2.5 text-center text-[13px] font-medium text-white"
              >
                Ouvrir la fiche
              </Link>
              {canEdit ? (
                <ChangeStepMenu
                  sheet={drawer}
                  columns={columns}
                  onDone={() => setDrawer(null)}
                />
              ) : null}
              {drawer.projectId ? (
                <Link
                  href={`/dashboard/projets/${drawer.projectId}`}
                  className="text-center text-[13px] font-medium text-bework-navy hover:underline"
                >
                  Voir le chantier
                </Link>
              ) : null}
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
