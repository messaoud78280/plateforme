"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type {
  TaskListAssigneeOption,
  TaskListProjectOption,
  TaskListRow,
  TaskListStatusBucket,
  TaskListSummary,
} from "@/lib/tasks/list-view";
import { priorityRank } from "@/lib/tasks/priority";
import { cn } from "@/lib/cn";

type SortId = "default" | "priority" | "due" | "created";
type ScopeId = "mine" | "team";
type StatusFilter = "all" | "a_faire" | "en_cours" | "a_valider" | "terminee" | "retard";

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

function initials(name: string | null): string {
  if (!name?.trim()) return "?";
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function statusBadgeClass(bucket: TaskListStatusBucket): string {
  switch (bucket) {
    case "a_faire":
      return "badge-cc badge-cc-info";
    case "en_cours":
      return "badge-cc badge-cc-cyan";
    case "a_valider":
      return "badge-cc badge-cc-intel";
    case "terminee":
      return "badge-cc badge-cc-ok";
    default:
      return "badge-cc badge-cc-neutral";
  }
}

function rowAccent(row: TaskListRow): {
  bar: string;
  soft: string;
  hover: string;
} {
  if (row.isOverdue) {
    return {
      bar: "bg-bework-critical",
      soft: "bg-[color:var(--bw-soft-critical)]/80",
      hover: "hover:bg-[color:var(--bw-soft-critical)]",
    };
  }
  if (row.priority === "URGENT") {
    return {
      bar: "bg-bework-critical",
      soft: "bg-[color:var(--bw-soft-critical)]/45",
      hover: "hover:bg-[color:var(--bw-soft-critical)]/70",
    };
  }
  if (row.priority === "PRIORITAIRE") {
    return {
      bar: "bg-bework-watch",
      soft: "bg-[color:var(--bw-soft-watch)]/55",
      hover: "hover:bg-[color:var(--bw-soft-watch)]/80",
    };
  }
  if (row.statusBucket === "a_valider") {
    return {
      bar: "bg-bework-intel",
      soft: "bg-[color:var(--bw-soft-violet)]/55",
      hover: "hover:bg-[color:var(--bw-soft-violet)]/80",
    };
  }
  if (row.statusBucket === "en_cours") {
    return {
      bar: "bg-bework-cyan",
      soft: "bg-[color:var(--bw-soft-cyan)]/55",
      hover: "hover:bg-[color:var(--bw-soft-cyan)]/80",
    };
  }
  if (row.statusBucket === "a_faire") {
    return {
      bar: "bg-bework-accent",
      soft: "bg-[color:var(--bw-soft-accent)]/55",
      hover: "hover:bg-[color:var(--bw-soft-accent)]/80",
    };
  }
  if (row.statusBucket === "terminee") {
    return {
      bar: "bg-bework-ok",
      soft: "bg-[color:var(--bw-soft-ok)]/55",
      hover: "hover:bg-[color:var(--bw-soft-ok)]/80",
    };
  }
  return {
    bar: "bg-bework-navy/30",
    soft: "bg-[color:var(--bw-soft-navy)]/50",
    hover: "hover:bg-bework-navy-soft/70",
  };
}

function SummaryKpis({ summary }: { summary: TaskListSummary }) {
  const items = [
    {
      label: "Ouvertes",
      value: summary.totalOpen,
      tone: "bw-surface-tinted-navy",
      valueClass: "text-bework-navy",
    },
    {
      label: "En retard",
      value: summary.enRetard,
      tone: summary.enRetard > 0 ? "bw-surface-tinted-critical" : "bw-surface-tinted-navy",
      valueClass: summary.enRetard > 0 ? "text-bework-critical" : "text-bework-navy",
    },
    {
      label: "À faire",
      value: summary.aFaire,
      tone: "bw-surface-tinted-accent",
      valueClass: "text-bework-accent",
    },
    {
      label: "En cours",
      value: summary.enCours,
      tone: "bw-surface-tinted-cyan",
      valueClass: "text-bework-cyan",
    },
    {
      label: "À valider",
      value: summary.aValider,
      tone: "bw-surface-tinted-violet",
      valueClass: "text-bework-intel",
    },
  ];

  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
      {items.map((k) => (
        <li key={k.label} className={cn("rounded-xl px-3.5 py-3 shadow-sm", k.tone)}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">
            {k.label}
          </p>
          <p className={cn("mt-1 text-2xl font-semibold tabular-nums tracking-tight", k.valueClass)}>
            {k.value}
          </p>
        </li>
      ))}
    </ul>
  );
}

function RowMenu({ row }: { row: TaskListRow }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        className="rounded-lg px-2 py-1.5 text-sm text-bework-muted transition-colors duration-150 hover:bg-bework-navy-soft hover:text-bework-navy"
        aria-label="Actions"
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
          <div className="absolute right-0 z-20 mt-1 w-48 overflow-hidden rounded-xl border border-bework-navy/10 bg-white py-1 shadow-[var(--cc-shadow-hover)]">
            <Link
              href={`/dashboard/taches/${row.id}`}
              className="block px-3 py-2 text-sm text-bework-ink transition-colors hover:bg-bework-navy-soft/60"
            >
              Ouvrir
            </Link>
            <Link
              href={`/dashboard/messagerie?task=${encodeURIComponent(row.id)}`}
              className="block px-3 py-2 text-sm text-bework-ink transition-colors hover:bg-bework-navy-soft/60"
            >
              Message
            </Link>
            <Link
              href={`/dashboard/taches/${row.id}#documents`}
              className="block px-3 py-2 text-sm text-bework-ink transition-colors hover:bg-bework-navy-soft/60"
            >
              Documents
            </Link>
            {row.projectId ? (
              <Link
                href={`/dashboard/projets/${row.projectId}`}
                className="block px-3 py-2 text-sm text-bework-ink transition-colors hover:bg-bework-navy-soft/60"
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
    <div className="rounded-2xl bw-surface-tinted-navy p-5 shadow-[var(--cc-shadow)]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-[15px] font-semibold text-bework-navy-deep">Nouvelle tâche</h2>
        <button type="button" onClick={onClose} className="btn-cc-ghost !min-h-8 !text-xs">
          Fermer
        </button>
      </div>
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
        <label className="sm:col-span-2 block text-xs font-semibold text-bework-muted">
          Titre
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bw-search mt-1"
            placeholder="Ex. Relancer Point.P — confirmation livraison membrane"
            required
          />
        </label>
        <label className="block text-xs font-semibold text-bework-muted">
          Responsable
          <select
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
            className="bw-search mt-1"
          >
            <option value="">À assigner</option>
            {assignees.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
                {a.roleLabel ? ` · ${a.roleLabel}` : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-semibold text-bework-muted">
          Chantier
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="bw-search mt-1"
          >
            <option value="">Aucun</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-semibold text-bework-muted">
          Échéance
          <input
            type="date"
            value={desiredDate}
            onChange={(e) => setDesiredDate(e.target.value)}
            className="bw-search mt-1"
          />
        </label>
        <label className="block text-xs font-semibold text-bework-muted">
          Priorité
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="bw-search mt-1"
          >
            <option value="STANDARD">Normale</option>
            <option value="PRIORITAIRE">Prioritaire</option>
            <option value="URGENT">Urgente</option>
          </select>
        </label>
        <label className="sm:col-span-2 block text-xs font-semibold text-bework-muted">
          Description (optionnel)
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-[var(--cc-radius)] border border-[color:var(--cc-chrome-border)] px-3 py-2 text-sm"
          />
        </label>
        {error ? <p className="sm:col-span-2 text-xs text-bework-critical">{error}</p> : null}
        <div className="sm:col-span-2 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-cc-secondary !min-h-9 !text-xs">
            Annuler
          </button>
          <button type="submit" disabled={loading} className="btn-cc-primary !min-h-9 !text-xs">
            {loading ? "Création…" : "Créer la tâche"}
          </button>
        </div>
      </form>
    </div>
  );
}

function TaskBadges({ row }: { row: TaskListRow }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {row.isOverdue ? (
        <span className="badge-cc badge-cc-critical">
          {row.overdueDays != null && row.overdueDays > 0
            ? `En retard de ${row.overdueDays} j`
            : "En retard"}
        </span>
      ) : null}
      <span className={statusBadgeClass(row.statusBucket)}>{row.statusLabel}</span>
      {row.priority !== "STANDARD" ? (
        <span
          className={cn(
            "badge-cc",
            row.priority === "URGENT" ? "badge-cc-critical" : "badge-cc-watch",
          )}
        >
          {row.priorityLabel}
        </span>
      ) : null}
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
  const [q, setQ] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [sort, setSort] = useState<SortId>("default");
  const [scope, setScope] = useState<ScopeId>(initialScope);
  const [createOpen, setCreateOpen] = useState(false);

  function changeScope(next: ScopeId) {
    setScope(next);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("scope", next);
      window.history.replaceState({}, "", url.toString());
    }
  }

  const filtered = useMemo(() => {
    let list = [...rows];
    if (scope === "mine") {
      list = list.filter((r) => r.assigneeId === currentUserId);
    }
    if (q.trim()) {
      const needle = q.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(needle) ||
          (r.projectTitle ?? "").toLowerCase().includes(needle) ||
          (r.assigneeName ?? "").toLowerCase().includes(needle),
      );
    }
    if (statusFilter === "retard") list = list.filter((r) => r.isOverdue);
    else if (statusFilter !== "all") list = list.filter((r) => r.statusBucket === statusFilter);
    if (assigneeFilter) list = list.filter((r) => r.assigneeId === assigneeFilter);
    if (projectFilter) list = list.filter((r) => r.projectId === projectFilter);
    if (priorityFilter) list = list.filter((r) => r.priority === priorityFilter);

    if (sort === "priority") {
      list.sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority));
    } else if (sort === "due") {
      list.sort((a, b) => {
        const da = a.desiredDate ? new Date(a.desiredDate).getTime() : Number.POSITIVE_INFINITY;
        const db = b.desiredDate ? new Date(b.desiredDate).getTime() : Number.POSITIVE_INFINITY;
        return da - db;
      });
    } else if (sort === "created") {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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
    sort,
  ]);

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-5 px-4 pb-10 pt-2 sm:px-6 xl:max-w-[1520px]">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-[1.75rem] font-semibold tracking-tight text-bework-navy-deep sm:text-[1.875rem]">
            Tâches
          </h1>
          <p className="mt-1 max-w-xl text-[0.9375rem] leading-relaxed text-bework-muted">
            Suivez le travail attribué à l’équipe — priorités, échéances et validations au même
            endroit.
          </p>
        </div>
        {canCreate ? (
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="btn-cc-primary shrink-0 self-start !min-h-10 !px-4 !text-[13px]"
          >
            + Nouvelle tâche
          </button>
        ) : null}
      </header>

      {rows.length > 0 ? <SummaryKpis summary={summary} /> : null}

      <div className="rounded-2xl border border-bework-accent/15 bg-[color:var(--bw-soft-accent)]/55 p-3 shadow-sm sm:p-3.5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher une tâche…"
            className="bw-search min-w-0 w-full lg:max-w-md lg:flex-1"
            aria-label="Rechercher une tâche"
          />
          <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
            {canViewTeam ? (
              <div className="flex rounded-xl border border-bework-navy/10 bg-bework-chrome p-0.5">
                <button
                  type="button"
                  onClick={() => changeScope("mine")}
                  className={cn(
                    "rounded-lg px-3 py-2 text-[12px] font-semibold transition-colors duration-150",
                    scope === "mine"
                      ? "bg-bework-navy-deep text-white shadow-sm"
                      : "text-bework-muted hover:text-bework-navy",
                  )}
                >
                  Mes tâches
                </button>
                <button
                  type="button"
                  onClick={() => changeScope("team")}
                  className={cn(
                    "rounded-lg px-3 py-2 text-[12px] font-semibold transition-colors duration-150",
                    scope === "team"
                      ? "bg-bework-navy-deep text-white shadow-sm"
                      : "text-bework-muted hover:text-bework-navy",
                  )}
                >
                  Équipe
                </button>
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => setFiltersOpen((v) => !v)}
              className={cn(
                "btn-cc-secondary !min-h-10 !px-3 !text-xs",
                filtersOpen && "border-bework-accent/30 bg-[color:var(--bw-soft-accent)] text-bework-accent",
              )}
            >
              Filtres
            </button>
            <label className="inline-flex items-center gap-1.5 text-xs text-bework-muted">
              <span className="font-medium">Trier</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortId)}
                className="min-h-10 rounded-lg border border-bework-navy/10 bg-white px-2.5 text-xs font-medium text-bework-ink transition-colors focus:border-bework-accent/40 focus:outline-none"
              >
                <option value="default">Retard / priorité</option>
                <option value="priority">Priorité</option>
                <option value="due">Échéance</option>
                <option value="created">Création</option>
              </select>
            </label>
          </div>
        </div>

        {filtersOpen ? (
          <div className="mt-3 flex flex-wrap gap-2 border-t border-bework-navy/10 pt-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="rounded-lg border border-bework-navy/10 bg-white px-2.5 py-2 text-xs font-medium text-bework-ink"
            >
              <option value="all">Statut — tous</option>
              <option value="a_faire">À faire</option>
              <option value="en_cours">En cours</option>
              <option value="a_valider">À valider</option>
              <option value="terminee">Terminées</option>
              <option value="retard">En retard</option>
            </select>
            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="rounded-lg border border-bework-navy/10 bg-white px-2.5 py-2 text-xs font-medium text-bework-ink"
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
              className="rounded-lg border border-bework-navy/10 bg-white px-2.5 py-2 text-xs font-medium text-bework-ink"
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
              className="rounded-lg border border-bework-navy/10 bg-white px-2.5 py-2 text-xs font-medium text-bework-ink"
            >
              <option value="">Priorité — toutes</option>
              <option value="URGENT">Urgente</option>
              <option value="PRIORITAIRE">Prioritaire</option>
              <option value="STANDARD">Normale</option>
            </select>
          </div>
        ) : null}
      </div>

      {createOpen ? (
        <CreateTaskPanel
          projects={projects}
          assignees={assignees}
          onClose={() => setCreateOpen(false)}
        />
      ) : null}

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-bework-navy/20 bg-bework-navy-soft/60 px-5 py-12 text-center">
          <p className="text-sm font-semibold text-bework-navy-deep">Aucune tâche en cours.</p>
          <p className="mt-1 text-sm text-bework-muted">
            Créez une tâche pour suivre un travail attribué à l’équipe.
          </p>
          {canCreate ? (
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="btn-cc-primary mt-4 !text-sm"
            >
              + Créer une tâche
            </button>
          ) : null}
        </div>
      ) : filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm text-bework-muted">
          Aucune tâche ne correspond à vos critères.
        </p>
      ) : (
        <>
          <ul className="hidden space-y-2 md:block">
            {filtered.map((row) => {
              const accent = rowAccent(row);
              return (
                <li key={row.id}>
                  <div
                    role="link"
                    tabIndex={0}
                    onClick={() => router.push(`/dashboard/taches/${row.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        router.push(`/dashboard/taches/${row.id}`);
                      }
                    }}
                    className={cn(
                      "group relative grid cursor-pointer grid-cols-[minmax(0,1.7fr)_minmax(10rem,0.95fr)_minmax(8rem,0.75fr)_auto_auto] items-center gap-4 overflow-hidden rounded-xl border border-bework-navy/10 px-4 py-3.5 shadow-sm transition-[background,box-shadow,transform] duration-150",
                      accent.soft,
                      accent.hover,
                      "hover:shadow-[var(--cc-shadow-hover)] hover:-translate-y-px",
                    )}
                  >
                    <span
                      className={cn("absolute inset-y-0 left-0 w-[3px]", accent.bar)}
                      aria-hidden
                    />
                    <div className="min-w-0 pl-1">
                      <p className="truncate text-[0.9375rem] font-semibold tracking-tight text-bework-ink">
                        {row.title}
                      </p>
                      <p className="mt-0.5 truncate text-[13px] text-bework-muted">
                        {row.projectTitleShort ?? row.projectTitle ?? "Sans chantier"}
                      </p>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-bework-navy-soft text-[11px] font-semibold text-bework-navy">
                          {initials(row.assigneeName)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-medium text-bework-ink">
                            {row.assigneeName ?? "Non assigné"}
                          </p>
                          {row.assigneeRoleLabel ? (
                            <p className="truncate text-[12px] text-bework-muted">
                              {row.assigneeRoleLabel}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="min-w-0">
                      <p
                        className={cn(
                          "text-[13px] font-semibold tabular-nums",
                          row.isOverdue ? "text-bework-critical" : "text-bework-ink",
                        )}
                      >
                        {row.dueLabel}
                      </p>
                    </div>

                    <div className="flex items-center justify-end">
                      <TaskBadges row={row} />
                    </div>

                    <div
                      className="flex items-center gap-0.5 justify-self-end"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span
                        className="px-1 text-lg font-light text-bework-muted opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                        aria-hidden
                      >
                        ›
                      </span>
                      <RowMenu row={row} />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <ul className="space-y-2.5 md:hidden">
            {filtered.map((row) => {
              const accent = rowAccent(row);
              return (
                <li key={row.id}>
                  <Link
                    href={`/dashboard/taches/${row.id}`}
                    className={cn(
                      "relative block overflow-hidden rounded-xl border border-bework-navy/10 px-4 py-3.5 shadow-sm transition-[background,box-shadow] duration-150",
                      accent.soft,
                      accent.hover,
                    )}
                  >
                    <span
                      className={cn("absolute inset-y-0 left-0 w-[3px]", accent.bar)}
                      aria-hidden
                    />
                    <p className="pl-1 text-sm font-semibold text-bework-ink">{row.title}</p>
                    <p className="mt-0.5 pl-1 text-[13px] text-bework-muted">
                      {row.projectTitleShort ?? "Sans chantier"}
                    </p>
                    <div className="mt-3 flex items-center gap-2 pl-1">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-bework-navy-soft text-[10px] font-semibold text-bework-navy">
                        {initials(row.assigneeName)}
                      </span>
                      <p className="text-[13px] font-medium text-bework-ink">
                        {row.assigneeName ?? "Non assigné"}
                      </p>
                    </div>
                    <p
                      className={cn(
                        "mt-2 pl-1 text-[13px] font-semibold",
                        row.isOverdue ? "text-bework-critical" : "text-bework-muted",
                      )}
                    >
                      {row.dueLabel}
                    </p>
                    <div className="mt-2.5 pl-1">
                      <TaskBadges row={row} />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
