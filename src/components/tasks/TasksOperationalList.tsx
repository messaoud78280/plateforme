"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type {
  TaskListAssigneeOption,
  TaskListProjectOption,
  TaskListRow,
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

function RowMenu({ row }: { row: TaskListRow }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        className="rounded-md px-2 py-1 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-800"
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
          <div className="absolute right-0 z-20 mt-1 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
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
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold text-[#1e3a5f]">Nouvelle tâche</h2>
        <button type="button" onClick={onClose} className="text-xs text-slate-500 hover:text-slate-800">
          Fermer
        </button>
      </div>
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
        <label className="sm:col-span-2 block text-xs font-semibold text-slate-600">
          Titre
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="Ex. Relancer le fournisseur pour les plans terrasse"
            required
          />
        </label>
        <label className="block text-xs font-semibold text-slate-600">
          Responsable
          <select
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
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
        <label className="block text-xs font-semibold text-slate-600">
          Chantier
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
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
          Échéance
          <input
            type="date"
            value={desiredDate}
            onChange={(e) => setDesiredDate(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-xs font-semibold text-slate-600">
          Priorité
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="STANDARD">Normale</option>
            <option value="PRIORITAIRE">Prioritaire</option>
            <option value="URGENT">Urgente</option>
          </select>
        </label>
        <label className="sm:col-span-2 block text-xs font-semibold text-slate-600">
          Description (optionnel)
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </label>
        {error ? <p className="sm:col-span-2 text-xs text-red-600">{error}</p> : null}
        <div className="sm:col-span-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-[#1e3a5f] px-3 py-2 text-xs font-bold text-white hover:bg-[#152a45] disabled:opacity-60"
          >
            {loading ? "Création…" : "Créer la tâche"}
          </button>
        </div>
      </form>
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
    <div className="mx-auto w-full max-w-[1400px] space-y-4 px-1 sm:px-2 xl:max-w-[1520px]">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[1.75rem] font-semibold tracking-tight text-bework-ink sm:text-[1.875rem]">
            Tâches
          </h1>
          <p className="mt-1 text-[0.9375rem] text-bework-muted">Suivez le travail attribué à l’équipe.</p>
        </div>
        {canCreate ? (
          <button type="button" onClick={() => setCreateOpen(true)} className="btn-cc-primary !min-h-10 !text-xs">
            + Nouvelle tâche
          </button>
        ) : null}
      </header>

      {rows.length > 0 ? (
        <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs font-medium text-slate-600">
          <span className="tabular-nums text-slate-900">{summary.aFaire} à faire</span>
          <span className="tabular-nums">{summary.enCours} en cours</span>
          {summary.enRetard > 0 ? (
            <span className="tabular-nums text-red-700">{summary.enRetard} en retard</span>
          ) : null}
          <span className="tabular-nums">{summary.aValider} à valider</span>
        </p>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher une tâche…"
          className="bw-search min-w-0 flex-1"
        />
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            className="btn-cc-secondary !min-h-10 !px-3 !text-xs"
          >
            Filtres
          </button>
          {canViewTeam ? (
            <div className="flex rounded-lg border border-slate-200 p-0.5">
              <button
                type="button"
                onClick={() => changeScope("mine")}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-semibold",
                  scope === "mine" ? "bg-[#1e3a5f] text-white" : "text-slate-600",
                )}
              >
                Mes tâches
              </button>
              <button
                type="button"
                onClick={() => changeScope("team")}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-semibold",
                  scope === "team" ? "bg-[#1e3a5f] text-white" : "text-slate-600",
                )}
              >
                Équipe
              </button>
            </div>
          ) : null}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortId)}
            className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs font-semibold text-slate-700"
            aria-label="Trier"
          >
            <option value="default">Retard / priorité</option>
            <option value="priority">Priorité</option>
            <option value="due">Échéance</option>
            <option value="created">Création</option>
          </select>
        </div>
      </div>

      {filtersOpen ? (
        <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
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
            className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
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
            className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
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
            className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
          >
            <option value="">Priorité — toutes</option>
            <option value="URGENT">Urgente</option>
            <option value="PRIORITAIRE">Prioritaire</option>
            <option value="STANDARD">Normale</option>
          </select>
        </div>
      ) : null}

      {createOpen ? (
        <CreateTaskPanel
          projects={projects}
          assignees={assignees}
          onClose={() => setCreateOpen(false)}
        />
      ) : null}

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white px-5 py-10 text-center">
          <p className="text-sm font-semibold text-slate-900">Aucune tâche en cours.</p>
          <p className="mt-1 text-sm text-slate-600">
            Créez une tâche pour suivre un travail attribué à l’équipe.
          </p>
          {canCreate ? (
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="mt-4 inline-flex rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white"
            >
              + Créer une tâche
            </button>
          ) : null}
        </div>
      ) : filtered.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-600">
          Aucune tâche ne correspond à vos critères.
        </p>
      ) : (
        <>
          {/* Desktop */}
          <ul className="cc-list-surface hidden divide-y divide-[color:var(--cc-border)] md:block">
            {filtered.map((row) => (
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
                  className="cc-list-row flex cursor-pointer items-start gap-4 px-4 py-3.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.9375rem] font-semibold tracking-tight text-bework-ink">
                      {row.title}
                    </p>
                    <p className="mt-0.5 text-sm text-slate-600">
                      {row.projectTitleShort ?? row.projectTitle ?? "Sans chantier"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {row.assigneeName ?? "Non assigné"}
                      {row.assigneeRoleLabel ? (
                        <span className="text-slate-400"> · {row.assigneeRoleLabel}</span>
                      ) : null}
                      <span className="mx-1.5 text-slate-300">·</span>
                      <span className={row.isOverdue ? "font-semibold text-red-700" : ""}>
                        Échéance : {row.dueLabel.toLowerCase()}
                      </span>
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                        {row.statusLabel}
                      </span>
                      {row.priority !== "STANDARD" ? (
                        <span
                          className={cn(
                            "rounded-md px-2 py-0.5 text-[11px] font-semibold",
                            row.priority === "URGENT"
                              ? "bg-red-50 text-red-800"
                              : "bg-amber-50 text-amber-900",
                          )}
                        >
                          {row.priorityLabel}
                        </span>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <Link href={`/dashboard/taches/${row.id}`} className="btn-cc-primary !min-h-8 !px-3 !text-xs">
                        Ouvrir
                      </Link>
                      <RowMenu row={row} />
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {/* Mobile */}
          <ul className="space-y-2 md:hidden">
            {filtered.map((row) => (
              <li key={row.id}>
                <Link
                  href={`/dashboard/taches/${row.id}`}
                  className="block rounded-xl border border-slate-200 bg-white px-4 py-3"
                >
                  <p className="text-sm font-bold text-[#1e3a5f]">{row.title}</p>
                  <p className="mt-1 text-xs text-slate-600">
                    {row.projectTitleShort ?? "Sans chantier"}
                    {row.assigneeName ? ` · ${row.assigneeName}` : ""}
                  </p>
                  <p className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                    <span className={row.isOverdue ? "font-semibold text-red-700" : "text-slate-600"}>
                      {row.dueLabel}
                    </span>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 font-semibold text-slate-700">
                      {row.statusLabel}
                    </span>
                    {row.priority !== "STANDARD" ? (
                      <span className="font-semibold text-amber-900">{row.priorityLabel}</span>
                    ) : null}
                  </p>
                  <span className="mt-2 inline-block text-xs font-semibold text-[#1e3a5f]">Ouvrir</span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
