"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Clock,
  ListTodo,
} from "lucide-react";
import type {
  TaskListAssigneeOption,
  TaskListProjectOption,
  TaskListRow,
  TaskListStatusBucket,
  TaskListSummary,
} from "@/lib/tasks/list-view";
import { priorityRank } from "@/lib/tasks/priority";
import { cn } from "@/lib/cn";

type SortId =
  | "default"
  | "priority"
  | "due"
  | "project"
  | "assignee"
  | "created"
  | "updated";
type ScopeId = "mine" | "team";
type StatusFilter = "all" | "a_faire" | "en_cours" | "a_valider" | "terminee" | "retard";
type DueFilter = "" | "overdue" | "today" | "tomorrow" | "week" | "none";
type GroupId = "none" | "due" | "status" | "assignee" | "project" | "priority";

type Props = {
  rows: TaskListRow[];
  summary: TaskListSummary;
  projects: TaskListProjectOption[];
  assignees: TaskListAssigneeOption[];
  canViewTeam: boolean;
  currentUserId: string;
  initialScope: ScopeId;
  canCreate: boolean;
};

type DueTone = "neutral" | "today" | "soft" | "amber" | "orange" | "red" | "critical" | "done";

function initials(name: string | null): string {
  if (!name?.trim()) return "?";
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function dueTone(row: TaskListRow): DueTone {
  if (row.statusBucket === "terminee") return "done";
  if (!row.isOverdue && row.isDueToday) return "today";
  if (!row.isOverdue) return "neutral";
  const d = row.overdueDays ?? 1;
  if (d <= 3) return "amber";
  if (d <= 7) return "orange";
  if (d <= 14) return "red";
  return "critical";
}

function accentBar(tone: DueTone): string {
  switch (tone) {
    case "done":
      return "bg-emerald-500";
    case "today":
      return "bg-amber-400";
    case "amber":
      return "bg-amber-500";
    case "orange":
      return "bg-orange-500";
    case "red":
      return "bg-red-400";
    case "critical":
      return "bg-red-600";
    default:
      return "bg-slate-300";
  }
}

function dueTextClass(tone: DueTone): string {
  switch (tone) {
    case "today":
      return "text-amber-800";
    case "amber":
      return "text-amber-800";
    case "orange":
      return "text-orange-800";
    case "red":
      return "text-red-700";
    case "critical":
      return "text-red-800 font-semibold";
    case "done":
      return "text-slate-500";
    default:
      return "text-slate-700";
  }
}

function statusPill(bucket: TaskListStatusBucket): string {
  switch (bucket) {
    case "a_faire":
      return "bg-sky-50 text-sky-800 border-sky-200/80";
    case "en_cours":
      return "bg-cyan-50 text-cyan-900 border-cyan-200/80";
    case "a_valider":
      return "bg-violet-50 text-violet-900 border-violet-200/80";
    case "terminee":
      return "bg-emerald-50 text-emerald-800 border-emerald-200/80";
    default:
      return "bg-slate-50 text-slate-600 border-slate-200";
  }
}

function priorityPill(priority: string): string | null {
  if (priority === "URGENT") return "bg-red-50 text-red-800 border-red-200/70";
  if (priority === "PRIORITAIRE") return "bg-amber-50 text-amber-900 border-amber-200/70";
  return null;
}

function dueGroupKey(row: TaskListRow): string {
  if (row.statusBucket === "terminee") return "done";
  if (row.isOverdue) return "overdue";
  if (row.isDueToday) return "today";
  if (row.dueLabel === "Demain") return "tomorrow";
  if (!row.desiredDate) return "none";
  const d = new Date(row.desiredDate);
  const now = new Date();
  const endWeek = new Date(now);
  endWeek.setDate(endWeek.getDate() + (7 - ((now.getDay() + 6) % 7)));
  endWeek.setHours(23, 59, 59, 999);
  if (d.getTime() <= endWeek.getTime()) return "week";
  return "later";
}

const DUE_GROUP_LABELS: Record<string, string> = {
  overdue: "En retard",
  today: "Aujourd’hui",
  tomorrow: "Demain",
  week: "Cette semaine",
  later: "Plus tard",
  none: "Sans date",
  done: "Terminées",
};

function isThisWeek(iso: string | null): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return d >= start && d < end;
}

function isTomorrow(iso: string | null): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  const t = new Date();
  t.setDate(t.getDate() + 1);
  return (
    d.getFullYear() === t.getFullYear() &&
    d.getMonth() === t.getMonth() &&
    d.getDate() === t.getDate()
  );
}

function RowMenu({ row }: { row: TaskListRow }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        className="rounded-lg px-2 py-1.5 text-sm text-slate-400 transition-colors duration-150 hover:bg-slate-100 hover:text-bework-navy"
        aria-label="Actions"
        onClick={() => setOpen((v) => !v)}
      >
        …
      </button>
      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-10 cursor-default"
            aria-label="Fermer"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-20 mt-1 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
            <Link
              href={`/dashboard/taches/${row.id}`}
              className="block px-3 py-2 text-sm text-slate-800 hover:bg-slate-50"
            >
              Ouvrir
            </Link>
            <Link
              href={`/dashboard/messagerie?task=${encodeURIComponent(row.id)}`}
              className="block px-3 py-2 text-sm text-slate-800 hover:bg-slate-50"
            >
              Message
            </Link>
            <Link
              href={`/dashboard/taches/${row.id}#documents`}
              className="block px-3 py-2 text-sm text-slate-800 hover:bg-slate-50"
            >
              Documents
            </Link>
            {row.projectId ? (
              <Link
                href={`/dashboard/projets/${row.projectId}`}
                className="block px-3 py-2 text-sm text-slate-800 hover:bg-slate-50"
              >
                Voir chantier
              </Link>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}

function CreateTaskPanel({
  projects,
  assignees,
  onClose,
}: {
  projects: TaskListProjectOption[];
  assignees: TaskListAssigneeOption[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [desiredDate, setDesiredDate] = useState("");
  const [priority, setPriority] = useState("STANDARD");
  const [description, setDescription] = useState("");
  const [more, setMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Le titre est requis.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          projectId: projectId || null,
          priority,
          desiredDate: desiredDate || null,
          assignedToId: assigneeId || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Création impossible.");
        return;
      }
      onClose();
      router.push(`/dashboard/taches/${data.id}`);
      router.refresh();
    } catch {
      setError("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/20" onClick={onClose}>
      <aside
        className="h-full w-full max-w-md overflow-y-auto bg-white p-5 shadow-[-8px_0_32px_rgba(15,23,42,0.12)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-bework-navy">Nouvelle tâche</h2>
          <button type="button" onClick={onClose} className="text-slate-400" aria-label="Fermer">
            ×
          </button>
        </div>
        <form onSubmit={(e) => void submit(e)} className="space-y-3">
          <label className="block text-xs font-semibold text-slate-600">
            Titre
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
              required
            />
          </label>
          <label className="block text-xs font-semibold text-slate-600">
            Chantier
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            >
              <option value="">Aucun</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-semibold text-slate-600">
            Responsable
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            >
              <option value="">À assigner</option>
              {assignees.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-semibold text-slate-600">
              Échéance
              <input
                type="date"
                value={desiredDate}
                onChange={(e) => setDesiredDate(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
              />
            </label>
            <label className="block text-xs font-semibold text-slate-600">
              Priorité
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
              >
                <option value="STANDARD">Normale</option>
                <option value="PRIORITAIRE">Prioritaire</option>
                <option value="URGENT">Haute</option>
              </select>
            </label>
          </div>
          <button
            type="button"
            onClick={() => setMore((v) => !v)}
            className="text-xs font-semibold text-bework-navy"
          >
            {more ? "Moins d’options" : "Description"}
          </button>
          {more ? (
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              placeholder="Contexte, livrable attendu…"
            />
          ) : null}
          {error ? <p className="text-xs text-red-700">{error}</p> : null}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-[#1e3a5f] py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading ? "Création…" : "Créer la tâche"}
          </button>
        </form>
      </aside>
    </div>
  );
}

export function TasksOperationalList({
  rows,
  summary,
  projects,
  assignees,
  canViewTeam,
  currentUserId,
  initialScope,
  canCreate,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [dueFilter, setDueFilter] = useState<DueFilter>("");
  const [sort, setSort] = useState<SortId>("default");
  const [groupBy, setGroupBy] = useState<GroupId>("due");
  const [scope, setScope] = useState<ScopeId>(initialScope);
  const [createOpen, setCreateOpen] = useState(false);
  const [drawer, setDrawer] = useState<TaskListRow | null>(null);

  function pushUrl(patch: Record<string, string>) {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    for (const [k, v] of Object.entries(patch)) {
      if (!v) url.searchParams.delete(k);
      else url.searchParams.set(k, v);
    }
    startTransition(() => {
      window.history.replaceState({}, "", url.toString());
    });
  }

  useEffect(() => {
    const t = window.setTimeout(() => {
      pushUrl({ q: q.trim() });
    }, 280);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  function changeScope(next: ScopeId) {
    setScope(next);
    pushUrl({ scope: next });
  }

  const filtered = useMemo(() => {
    let list = [...rows];
    if (scope === "mine") list = list.filter((r) => r.assigneeId === currentUserId);
    if (q.trim()) {
      const needle = q.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(needle) ||
          (r.projectTitle ?? "").toLowerCase().includes(needle) ||
          (r.assigneeName ?? "").toLowerCase().includes(needle) ||
          (r.description ?? "").toLowerCase().includes(needle),
      );
    }
    if (statusFilter === "retard") list = list.filter((r) => r.isOverdue);
    else if (statusFilter !== "all") list = list.filter((r) => r.statusBucket === statusFilter);
    if (assigneeFilter) list = list.filter((r) => r.assigneeId === assigneeFilter);
    if (projectFilter) list = list.filter((r) => r.projectId === projectFilter);
    if (priorityFilter) list = list.filter((r) => r.priority === priorityFilter);
    if (dueFilter === "overdue") list = list.filter((r) => r.isOverdue);
    else if (dueFilter === "today") list = list.filter((r) => r.isDueToday);
    else if (dueFilter === "tomorrow") list = list.filter((r) => isTomorrow(r.desiredDate));
    else if (dueFilter === "week") list = list.filter((r) => isThisWeek(r.desiredDate));
    else if (dueFilter === "none") list = list.filter((r) => !r.desiredDate);

    if (sort === "priority") {
      list.sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority));
    } else if (sort === "due") {
      list.sort((a, b) => {
        const da = a.desiredDate ? new Date(a.desiredDate).getTime() : Number.POSITIVE_INFINITY;
        const db = b.desiredDate ? new Date(b.desiredDate).getTime() : Number.POSITIVE_INFINITY;
        return da - db;
      });
    } else if (sort === "project") {
      list.sort((a, b) =>
        (a.projectTitle ?? "").localeCompare(b.projectTitle ?? "", "fr"),
      );
    } else if (sort === "assignee") {
      list.sort((a, b) =>
        (a.assigneeName ?? "").localeCompare(b.assigneeName ?? "", "fr"),
      );
    } else if (sort === "created") {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sort === "updated") {
      list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    } else {
      list.sort((a, b) => {
        if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;
        const pr = priorityRank(a.priority) - priorityRank(b.priority);
        if (pr !== 0) return pr;
        const da = a.desiredDate ? new Date(a.desiredDate).getTime() : Number.POSITIVE_INFINITY;
        const db = b.desiredDate ? new Date(b.desiredDate).getTime() : Number.POSITIVE_INFINITY;
        return da - db;
      });
    }
    return list;
  }, [
    rows,
    scope,
    currentUserId,
    q,
    statusFilter,
    assigneeFilter,
    projectFilter,
    priorityFilter,
    dueFilter,
    sort,
  ]);

  const groups = useMemo(() => {
    if (groupBy === "none") return [{ id: "all", label: null as string | null, items: filtered }];
    const map = new Map<string, { label: string; items: TaskListRow[] }>();
    for (const row of filtered) {
      let key = "other";
      let label = "Autres";
      if (groupBy === "due") {
        key = dueGroupKey(row);
        label = DUE_GROUP_LABELS[key] ?? key;
      } else if (groupBy === "status") {
        key = row.statusBucket;
        label = row.statusLabel;
      } else if (groupBy === "assignee") {
        key = row.assigneeId ?? "none";
        label = row.assigneeName ?? "Non assigné";
      } else if (groupBy === "project") {
        key = row.projectId ?? "none";
        label = row.projectTitleShort ?? row.projectTitle ?? "Sans chantier";
      } else if (groupBy === "priority") {
        key = row.priority;
        label = row.priorityLabel;
      }
      const cur = map.get(key) ?? { label, items: [] };
      cur.items.push(row);
      map.set(key, cur);
    }
    const order =
      groupBy === "due"
        ? ["overdue", "today", "tomorrow", "week", "later", "none", "done"]
        : [...map.keys()];
    return order
      .filter((k) => map.has(k))
      .map((k) => {
        const g = map.get(k)!;
        return { id: k, label: g.label, items: g.items };
      });
  }, [filtered, groupBy]);

  const kpiItems = [
    {
      id: "open",
      value: summary.totalOpen,
      label: "Ouvertes",
      secondary: null as string | null,
      tone: "navy" as const,
      icon: ListTodo,
      onClick: () => {
        setStatusFilter("all");
        setDueFilter("");
      },
    },
    {
      id: "late",
      value: summary.enRetard,
      label: "En retard",
      secondary: summary.enRetardSevere > 0 ? `${summary.enRetardSevere} > 7 j` : null,
      tone: "critical" as const,
      icon: AlertTriangle,
      onClick: () => {
        setStatusFilter("retard");
        setDueFilter("overdue");
        setGroupBy("due");
      },
    },
    {
      id: "todo",
      value: summary.aFaire,
      label: "À faire",
      secondary: null,
      tone: "accent" as const,
      icon: ClipboardList,
      onClick: () => setStatusFilter("a_faire"),
    },
    {
      id: "progress",
      value: summary.enCours,
      label: "En cours",
      secondary: null,
      tone: "cyan" as const,
      icon: Clock,
      onClick: () => setStatusFilter("en_cours"),
    },
    {
      id: "validate",
      value: summary.aValider,
      label: "À valider",
      secondary: summary.aValiderToday > 0 ? `${summary.aValiderToday} aujourd’hui` : null,
      tone: "violet" as const,
      icon: CheckCircle2,
      onClick: () => setStatusFilter("a_valider"),
    },
  ];

  const treatBits =
    summary.enRetardSevere > 0 ||
    summary.aValiderToday > 0 ||
    summary.prioritaires > 0;

  function TaskRow({ row }: { row: TaskListRow }) {
    const tone = dueTone(row);
    const prioClass = priorityPill(row.priority);
    const done = row.statusBucket === "terminee";

    return (
      <li>
        <div
          role="button"
          tabIndex={0}
          onClick={() => setDrawer(row)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setDrawer(row);
            }
          }}
          className={cn(
            "group relative grid cursor-pointer items-center gap-3 overflow-hidden rounded-xl border border-slate-200/90 bg-white pl-4 pr-3 shadow-[var(--cc-shadow)] transition duration-150",
            "hover:-translate-y-px hover:border-bework-navy/15 hover:shadow-md",
            "min-h-[76px] py-2.5",
            "grid-cols-1 lg:grid-cols-[minmax(0,1.35fr)_minmax(9rem,0.7fr)_minmax(6.5rem,0.55fr)_5.5rem_5rem_auto]",
            done && "opacity-75",
          )}
        >
          <span className={cn("absolute inset-y-0 left-0 w-[3px]", accentBar(tone))} aria-hidden />

          {/* Tâche */}
          <div className="min-w-0 pl-1">
            <p
              className={cn(
                "truncate text-[15px] font-semibold tracking-tight text-bework-ink",
                done && "text-slate-600",
              )}
            >
              {row.title}
            </p>
            <p className="mt-0.5 truncate text-[12px] text-slate-600">
              {row.projectTitleShort ?? row.projectTitle ?? "Sans chantier"}
              {row.sourceLabel ? ` · ${row.sourceLabel}` : ""}
            </p>
          </div>

          {/* Responsable */}
          <div className="hidden min-w-0 items-center gap-2 lg:flex">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-bework-navy">
              {initials(row.assigneeName)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-slate-800">
                {row.assigneeName ?? "Non assigné"}
              </p>
              {row.assigneeRoleLabel ? (
                <p className="truncate text-[11px] text-slate-500">{row.assigneeRoleLabel}</p>
              ) : null}
            </div>
          </div>

          {/* Échéance */}
          <div className={cn("hidden items-center gap-1.5 lg:flex", dueTextClass(tone))}>
            <Calendar className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
            <span className="text-[13px] font-medium tabular-nums">{row.dueLabel}</span>
          </div>

          {/* Statut */}
          <div className="hidden lg:block">
            <span
              className={cn(
                "inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                statusPill(row.statusBucket),
              )}
            >
              {row.statusLabel}
            </span>
          </div>

          {/* Priorité */}
          <div className="hidden lg:block">
            {prioClass ? (
              <span
                className={cn(
                  "inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                  prioClass,
                )}
              >
                {row.priorityLabel}
              </span>
            ) : (
              <span className="text-[12px] text-slate-400">—</span>
            )}
          </div>

          {/* Actions */}
          <div
            className="flex items-center justify-end gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <Link
              href={`/dashboard/taches/${row.id}`}
              className="hidden rounded-full border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-600 opacity-0 transition group-hover:opacity-100 lg:inline-flex"
            >
              Ouvrir
            </Link>
            <RowMenu row={row} />
          </div>

          {/* Mobile extras */}
          <div className="flex flex-wrap items-center gap-2 pl-1 lg:hidden">
            <span className="flex items-center gap-1 text-[12px] font-medium text-slate-700">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold">
                {initials(row.assigneeName)}
              </span>
              {row.assigneeName ?? "Non assigné"}
            </span>
            <span className={cn("flex items-center gap-1 text-[12px] font-medium", dueTextClass(tone))}>
              <Calendar className="h-3 w-3" />
              {row.dueLabel}
            </span>
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                statusPill(row.statusBucket),
              )}
            >
              {row.statusLabel}
            </span>
            {prioClass ? (
              <span
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                  prioClass,
                )}
              >
                {row.priorityLabel}
              </span>
            ) : null}
          </div>
        </div>
      </li>
    );
  }

  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[1440px] space-y-4 px-4 pb-10 pt-2 sm:px-6",
        pending && "opacity-90",
      )}
    >
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-[1.65rem] font-semibold tracking-tight text-bework-navy-deep">
            Tâches
          </h1>
          <p className="mt-1 text-[14px] text-slate-600">
            Suivez le travail attribué à l’équipe — priorités, échéances et validations.
          </p>
        </div>
        {canCreate ? (
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="rounded-full bg-[#1e3a5f] px-4 py-2 text-[13px] font-medium text-white"
          >
            + Nouvelle tâche
          </button>
        ) : null}
      </header>

      {rows.length > 0 ? (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {kpiItems.map((k) => {
            const Icon = k.icon;
            return (
              <li key={k.id}>
                <button
                  type="button"
                  onClick={k.onClick}
                  className={cn(
                    "w-full rounded-2xl border px-3 py-2.5 text-left shadow-[var(--cc-shadow)] transition hover:-translate-y-px",
                    k.tone === "critical" &&
                      "border-red-200/60 bg-red-50/40",
                    k.tone === "cyan" && "border-cyan-200/50 bg-cyan-50/50",
                    k.tone === "accent" && "border-amber-200/50 bg-amber-50/40",
                    k.tone === "violet" && "border-violet-200/50 bg-violet-50/40",
                    k.tone === "navy" && "border-bework-navy/10 bg-bework-soft-navy/40",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={cn(
                        "text-[1.25rem] font-semibold tabular-nums leading-none",
                        k.tone === "critical" && summary.enRetard > 0
                          ? "text-red-700"
                          : "text-bework-navy",
                      )}
                    >
                      {k.value}
                    </p>
                    <Icon className="h-4 w-4 text-bework-navy/60" strokeWidth={1.75} />
                  </div>
                  <p className="mt-1.5 text-[12px] font-medium text-slate-700">{k.label}</p>
                  {k.secondary ? (
                    <p className="text-[11px] text-slate-500">{k.secondary}</p>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      {treatBits ? (
        <div className="flex flex-wrap items-center gap-2 text-[13px]">
          <span className="font-semibold text-bework-navy">À traiter en priorité</span>
          {summary.enRetardSevere > 0 ? (
            <button
              type="button"
              onClick={() => {
                setStatusFilter("retard");
                setDueFilter("overdue");
              }}
              className="rounded-full bg-orange-50 px-2.5 py-1 font-medium text-orange-900"
            >
              {summary.enRetardSevere} tâche{summary.enRetardSevere > 1 ? "s" : ""} &gt; 7 jours
            </button>
          ) : null}
          {summary.aValiderToday > 0 ? (
            <button
              type="button"
              onClick={() => {
                setStatusFilter("a_valider");
                setDueFilter("today");
              }}
              className="rounded-full bg-violet-50 px-2.5 py-1 font-medium text-violet-900"
            >
              {summary.aValiderToday} validation{summary.aValiderToday > 1 ? "s" : ""} aujourd’hui
            </button>
          ) : null}
          {summary.prioritaires > 0 ? (
            <button
              type="button"
              onClick={() => setPriorityFilter("PRIORITAIRE")}
              className="rounded-full bg-amber-50 px-2.5 py-1 font-medium text-amber-900"
            >
              {summary.prioritaires} tâche{summary.prioritaires > 1 ? "s" : ""} prioritaire
              {summary.prioritaires > 1 ? "s" : ""}
            </button>
          ) : null}
        </div>
      ) : summary.enRetard === 0 && rows.length > 0 ? (
        <p className="text-[13px] font-medium text-emerald-700">✓ Aucune tâche en retard</p>
      ) : null}

      <div className="sticky top-14 z-20 space-y-2 rounded-2xl border border-slate-200/80 bg-white/95 p-3 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher une tâche, chantier, responsable…"
            className="min-w-0 flex-1 rounded-full border border-slate-200 bg-white px-4 py-2 text-[13px] outline-none focus:border-bework-accent/40"
          />
          <div className="flex flex-wrap items-center gap-2">
            {canViewTeam ? (
              <div className="flex rounded-full border border-slate-200 bg-slate-50 p-0.5">
                <button
                  type="button"
                  onClick={() => changeScope("mine")}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-[12px] font-semibold",
                    scope === "mine" ? "bg-bework-navy text-white" : "text-slate-600",
                  )}
                >
                  Mes tâches
                </button>
                <button
                  type="button"
                  onClick={() => changeScope("team")}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-[12px] font-semibold",
                    scope === "team" ? "bg-bework-navy text-white" : "text-slate-600",
                  )}
                >
                  Équipe
                </button>
              </div>
            ) : null}
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
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[12px]"
            >
              <option value="default">Priorité / retard</option>
              <option value="due">Échéance</option>
              <option value="priority">Priorité</option>
              <option value="project">Chantier</option>
              <option value="assignee">Responsable</option>
              <option value="created">Création récente</option>
              <option value="updated">Mise à jour récente</option>
            </select>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as GroupId)}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[12px]"
            >
              <option value="none">Sans regroupement</option>
              <option value="due">Par échéance</option>
              <option value="status">Par statut</option>
              <option value="assignee">Par responsable</option>
              <option value="project">Par chantier</option>
              <option value="priority">Par priorité</option>
            </select>
          </div>
        </div>

        {filtersOpen ? (
          <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[12px]"
            >
              <option value="all">Statut — tous</option>
              <option value="a_faire">À faire</option>
              <option value="en_cours">En cours</option>
              <option value="a_valider">À valider</option>
              <option value="terminee">Terminées</option>
              <option value="retard">En retard</option>
            </select>
            <select
              value={dueFilter}
              onChange={(e) => setDueFilter(e.target.value as DueFilter)}
              className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[12px]"
            >
              <option value="">Échéance — toutes</option>
              <option value="overdue">En retard</option>
              <option value="today">Aujourd’hui</option>
              <option value="tomorrow">Demain</option>
              <option value="week">Cette semaine</option>
              <option value="none">Sans échéance</option>
            </select>
            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[12px]"
            >
              <option value="">Responsable — tous</option>
              {assignees.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[12px]"
            >
              <option value="">Chantier — tous</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[12px]"
            >
              <option value="">Priorité — toutes</option>
              <option value="URGENT">Haute</option>
              <option value="PRIORITAIRE">Prioritaire</option>
              <option value="STANDARD">Normale</option>
            </select>
          </div>
        ) : null}

        {(statusFilter !== "all" ||
          dueFilter ||
          assigneeFilter ||
          projectFilter ||
          priorityFilter) && (
          <div className="flex flex-wrap gap-1.5">
            {statusFilter !== "all" ? (
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium"
              >
                Statut ×
              </button>
            ) : null}
            {dueFilter ? (
              <button
                type="button"
                onClick={() => setDueFilter("")}
                className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium"
              >
                Échéance ×
              </button>
            ) : null}
            {assigneeFilter ? (
              <button
                type="button"
                onClick={() => setAssigneeFilter("")}
                className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium"
              >
                Responsable ×
              </button>
            ) : null}
            {projectFilter ? (
              <button
                type="button"
                onClick={() => setProjectFilter("")}
                className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium"
              >
                Chantier ×
              </button>
            ) : null}
            {priorityFilter ? (
              <button
                type="button"
                onClick={() => setPriorityFilter("")}
                className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium"
              >
                Priorité ×
              </button>
            ) : null}
          </div>
        )}
      </div>

      {createOpen ? (
        <CreateTaskPanel
          projects={projects}
          assignees={assignees}
          onClose={() => setCreateOpen(false)}
        />
      ) : null}

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-12 text-center">
          <p className="text-sm font-semibold text-slate-900">Aucune tâche en cours.</p>
          {canCreate ? (
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="mt-4 rounded-full bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white"
            >
              + Créer une tâche
            </button>
          ) : null}
        </div>
      ) : filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-600">
          Aucune tâche ne correspond à vos critères.
        </p>
      ) : (
        <div className="space-y-5">
          {groups.map((g) => (
            <section key={g.id}>
              {g.label ? (
                <h2 className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-slate-500">
                  {g.label}
                  <span className="ml-1.5 font-medium normal-case text-slate-400">
                    · {g.items.length}
                  </span>
                </h2>
              ) : null}
              <ul className="space-y-1.5">
                {g.items.map((row) => (
                  <TaskRow key={row.id} row={row} />
                ))}
              </ul>
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
              <h2 className="text-[17px] font-semibold text-bework-ink">{drawer.title}</h2>
              <button type="button" onClick={() => setDrawer(null)} className="text-slate-400" aria-label="Fermer">
                ×
              </button>
            </div>
            <dl className="mt-4 space-y-3 text-[13px]">
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-slate-400">Chantier</dt>
                <dd className="font-medium text-slate-800">
                  {drawer.projectTitle ?? "Sans chantier"}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-slate-400">Responsable</dt>
                <dd className="font-medium">
                  {drawer.assigneeName ?? "Non assigné"}
                  {drawer.assigneeRoleLabel ? (
                    <span className="text-slate-500"> · {drawer.assigneeRoleLabel}</span>
                  ) : null}
                </dd>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <dt className="text-[11px] uppercase tracking-wide text-slate-400">Statut</dt>
                  <dd>
                    <span
                      className={cn(
                        "mt-0.5 inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                        statusPill(drawer.statusBucket),
                      )}
                    >
                      {drawer.statusLabel}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-wide text-slate-400">Priorité</dt>
                  <dd className="mt-0.5 font-medium">{drawer.priorityLabel}</dd>
                </div>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-slate-400">Échéance</dt>
                <dd className={cn("font-medium", dueTextClass(dueTone(drawer)))}>
                  {drawer.dueLabel}
                </dd>
              </div>
              {drawer.description ? (
                <div>
                  <dt className="text-[11px] uppercase tracking-wide text-slate-400">Description</dt>
                  <dd className="mt-1 whitespace-pre-wrap text-slate-700">{drawer.description}</dd>
                </div>
              ) : null}
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-slate-400">Origine</dt>
                <dd className="text-slate-600">
                  {drawer.sourceLabel ?? "Créée manuellement"}
                </dd>
              </div>
            </dl>
            <div className="mt-5 flex flex-col gap-2">
              <Link
                href={`/dashboard/taches/${drawer.id}`}
                className="rounded-full bg-[#1e3a5f] px-4 py-2.5 text-center text-[13px] font-medium text-white"
              >
                Ouvrir la tâche
              </Link>
              {drawer.projectId ? (
                <Link
                  href={`/dashboard/projets/${drawer.projectId}`}
                  className="text-center text-[13px] font-medium text-bework-navy hover:underline"
                >
                  Voir le chantier
                </Link>
              ) : null}
              <Link
                href={`/dashboard/taches/${drawer.id}#documents`}
                className="text-center text-[13px] font-medium text-bework-navy hover:underline"
              >
                Voir les documents
              </Link>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
