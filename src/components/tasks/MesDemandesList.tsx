"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { DeleteTaskButton } from "./DeleteTaskButton";
import { MissionPriorityControl } from "./MissionPriorityControl";
import { missionTypeLabel } from "@/lib/tasks/mission-types";
import {
  coerceTaskPriority,
  priorityLabel,
  priorityRank,
  sortByPriorityThenDate,
  TASK_PRIORITY_BADGE,
  TASK_PRIORITY_BORDER,
  type TaskPriority,
} from "@/lib/tasks/priority";

export type DemandeStatusFilter =
  | "toutes"
  | "a_traiter"
  | "en_cours"
  | "en_attente_info"
  | "a_valider"
  | "terminees";

export type DemandePriorityFilter = "toutes" | "URGENT" | "PRIORITAIRE" | "STANDARD";
export type DemandeSort = "priorite" | "recent" | "ancien" | "echeance";
export type MissionsViewMode = "liste" | "chantier" | "tableau";

export type DemandeTaskItem = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string | null;
  missionType: string | null;
  desiredDate: string | Date | null;
  createdAt: Date | string;
  updatedAt?: Date | string | null;
  actionsUsed: number | null;
  estimatedActions: number | string | null;
  correctionNote: string | null;
  project: { id: string; title: string } | null;
  assignedTo: { id: string; name: string } | null;
};

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  NOUVEAU: { label: "Reçue", className: "bg-slate-100 text-slate-700" },
  EN_ATTENTE: { label: "En attente", className: "bg-slate-100 text-slate-700" },
  ASSIGNEE: { label: "Assignée", className: "bg-indigo-100 text-indigo-800" },
  EN_ANALYSE: { label: "En analyse", className: "bg-blue-100 text-blue-800" },
  EN_COURS: { label: "En cours", className: "bg-blue-100 text-blue-800" },
  EN_ATTENTE_INFO: { label: "Info requise", className: "bg-amber-100 text-amber-900" },
  A_VALIDER: { label: "À valider", className: "bg-violet-100 text-violet-800" },
  COMPLETE: { label: "Terminée", className: "bg-emerald-100 text-emerald-800" },
  EN_ATTENTE_CLIENT: { label: "Action client", className: "bg-amber-100 text-amber-900" },
};

const PROGRESS_STEPS = ["Reçue", "En cours", "À valider", "Terminé"] as const;

const BOARD_COLUMNS: { id: string; label: string; match: (t: DemandeTaskItem) => boolean }[] = [
  {
    id: "a_traiter",
    label: "À traiter",
    match: (t) =>
      t.status !== "COMPLETE" &&
      (["NOUVEAU", "EN_ATTENTE", "EN_ATTENTE_INFO"].includes(t.status) || Boolean(t.correctionNote)),
  },
  {
    id: "en_cours",
    label: "En cours",
    match: (t) => ["ASSIGNEE", "EN_ANALYSE", "EN_COURS"].includes(t.status) && !t.correctionNote,
  },
  {
    id: "a_valider",
    label: "À valider",
    match: (t) => t.status === "A_VALIDER",
  },
  {
    id: "terminees",
    label: "Terminées",
    match: (t) => t.status === "COMPLETE",
  },
];

function getStatusBadge(task: DemandeTaskItem) {
  if (task.status === "COMPLETE") return STATUS_BADGES.COMPLETE!;
  if (task.status === "A_VALIDER") return STATUS_BADGES.A_VALIDER!;
  if (task.status === "EN_ATTENTE_INFO" || (task.status === "EN_COURS" && task.correctionNote)) {
    return STATUS_BADGES.EN_ATTENTE_CLIENT!;
  }
  return STATUS_BADGES[task.status] ?? STATUS_BADGES.NOUVEAU!;
}

function getProgressIndex(task: DemandeTaskItem): number {
  if (task.status === "COMPLETE") return 3;
  if (task.status === "A_VALIDER") return 2;
  if (["EN_COURS", "EN_ANALYSE", "ASSIGNEE", "EN_ATTENTE_INFO"].includes(task.status)) return 1;
  return 0;
}

function isBlocking(task: DemandeTaskItem): boolean {
  return (
    task.status === "EN_ATTENTE_INFO" ||
    Boolean(task.correctionNote && task.status !== "COMPLETE") ||
    coerceTaskPriority(task.priority) === "URGENT"
  );
}

function formatShortDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

function isOverdue(desiredDate: Date | string | null | undefined, status: string): boolean {
  if (!desiredDate || status === "COMPLETE") return false;
  const d = new Date(desiredDate);
  d.setHours(23, 59, 59, 999);
  return d.getTime() < Date.now();
}

interface MesDemandesListProps {
  tasks: DemandeTaskItem[];
}

function MissionCard({
  task,
  onPriorityUpdated,
  compact,
}: {
  task: DemandeTaskItem;
  onPriorityUpdated: (taskId: string, priority: TaskPriority) => void;
  compact?: boolean;
}) {
  const badge = getStatusBadge(task);
  const progressIndex = getProgressIndex(task);
  const prio = coerceTaskPriority(task.priority);
  const overdue = isOverdue(task.desiredDate, task.status);
  const blocking = isBlocking(task);
  const messagerieUrl = `/dashboard/messagerie?task=${encodeURIComponent(task.id)}`;
  const detailUrl = `/dashboard/taches/${task.id}`;
  const docsUrl = `/dashboard/taches/${task.id}#documents`;
  const chantierUrl = task.project?.id ? `/dashboard/projets/${task.project.id}` : null;

  return (
    <li
      className={`list-none rounded-xl border border-slate-200/90 border-l-4 bg-white shadow-sm transition hover:shadow-md ${TASK_PRIORITY_BORDER[prio]} ${
        blocking ? "ring-1 ring-amber-200/80" : ""
      }`}
    >
      <div className={`flex flex-col gap-3 p-4 ${compact ? "" : "sm:flex-row sm:items-stretch sm:justify-between"}`}>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className={`font-semibold text-[#1e3a5f] ${compact ? "text-sm" : "text-[15px]"}`}>
              <Link href={detailUrl} className="hover:underline">
                {task.title}
              </Link>
            </h3>
            <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${TASK_PRIORITY_BADGE[prio]}`}>
              {priorityLabel(prio)}
            </span>
            <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${badge.className}`}>
              {badge.label}
            </span>
            {overdue ? (
              <span className="inline-flex rounded-full bg-red-600 px-2 py-0.5 text-[11px] font-semibold text-white">
                Échéance dépassée
              </span>
            ) : null}
            {task.correctionNote ? (
              <span className="inline-flex rounded-full bg-amber-500 px-2 py-0.5 text-[11px] font-semibold text-white">
                Retour demandé
              </span>
            ) : null}
          </div>

          {!compact ? (
            <>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                {task.missionType ? (
                  <span className="font-medium text-slate-600">{missionTypeLabel(task.missionType)}</span>
                ) : null}
                <span>{task.assignedTo?.name ?? "Non assigné"} · assistant</span>
                <span>Créée {formatShortDate(task.createdAt)}</span>
                {task.desiredDate ? (
                  <span className={overdue ? "font-semibold text-red-600" : ""}>
                    Échéance {formatShortDate(task.desiredDate)}
                  </span>
                ) : null}
              </div>
              {chantierUrl ? (
                <p className="mt-1.5 text-xs">
                  <Link href={chantierUrl} className="font-medium text-[#1e3a5f] hover:underline">
                    Chantier : {task.project!.title}
                  </Link>
                </p>
              ) : (
                <p className="mt-1.5 text-xs text-slate-400">Aucun chantier lié</p>
              )}
              <div className="mt-2.5 flex flex-wrap gap-1">
                {PROGRESS_STEPS.map((step, i) => (
                  <span
                    key={step}
                    className={`rounded px-2 py-0.5 text-[10px] font-semibold ${
                      i <= progressIndex ? "bg-[#1e3a5f]/10 text-[#1e3a5f]" : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {step}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <p className="mt-1 text-[11px] text-slate-500">
              {task.assignedTo?.name ?? "Non assigné"}
              {task.desiredDate ? ` · ${formatShortDate(task.desiredDate)}` : ""}
            </p>
          )}

          <div className="mt-2">
            <MissionPriorityControl
              taskId={task.id}
              priority={task.priority}
              onUpdated={(p) => onPriorityUpdated(task.id, p)}
            />
          </div>
        </div>

        {!compact ? (
          <div className="flex shrink-0 flex-wrap items-center gap-1.5 sm:flex-col sm:items-stretch lg:flex-row lg:items-center">
            <Link
              href={detailUrl}
              className="inline-flex items-center justify-center rounded-lg bg-[#1e3a5f] px-3 py-2 text-xs font-semibold text-white hover:bg-[#152a45]"
            >
              Voir détail
            </Link>
            <Link
              href={messagerieUrl}
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Message
            </Link>
            <Link
              href={docsUrl}
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Documents
            </Link>
            {chantierUrl ? (
              <Link
                href={chantierUrl}
                className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Chantier
              </Link>
            ) : null}
            <DeleteTaskButton
              taskId={task.id}
              confirmText="Supprimer cette mission ? Cette opération est irréversible."
            />
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            <Link href={detailUrl} className="text-xs font-semibold text-[#1e3a5f] hover:underline">
              Ouvrir
            </Link>
            <Link href={messagerieUrl} className="text-xs font-semibold text-slate-600 hover:underline">
              Message
            </Link>
          </div>
        )}
      </div>
    </li>
  );
}

/** V2 missions client — filtres, tri, priorité 1 clic, vues liste / chantier / tableau. */
export function MesDemandesList({ tasks: initialTasks }: MesDemandesListProps) {
  const [filter, setFilter] = useState<DemandeStatusFilter>("toutes");
  const [priorityFilter, setPriorityFilter] = useState<DemandePriorityFilter>("toutes");
  const [sort, setSort] = useState<DemandeSort>("priorite");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<MissionsViewMode>("liste");
  const [priorityOverrides, setPriorityOverrides] = useState<Record<string, TaskPriority>>({});

  const tasks = useMemo(
    () =>
      initialTasks.map((t) =>
        priorityOverrides[t.id] ? { ...t, priority: priorityOverrides[t.id]! } : t,
      ),
    [initialTasks, priorityOverrides],
  );

  const counts = useMemo(() => {
    const open = tasks.filter((t) => t.status !== "COMPLETE");
    const overdue = open.filter((t) => isOverdue(t.desiredDate, t.status)).length;
    return {
      total: tasks.length,
      aTraiter: open.filter(
        (t) =>
          ["NOUVEAU", "EN_ATTENTE", "EN_ATTENTE_INFO"].includes(t.status) || Boolean(t.correctionNote),
      ).length,
      urgentes: open.filter((t) => coerceTaskPriority(t.priority) === "URGENT").length,
      aValider: tasks.filter((t) => t.status === "A_VALIDER").length,
      enCours: open.filter((t) => ["ASSIGNEE", "EN_ANALYSE", "EN_COURS"].includes(t.status)).length,
      overdue,
    };
  }, [tasks]);

  const filtered = useMemo(() => {
    let list = tasks;

    if (filter === "a_traiter") {
      list = list.filter(
        (t) =>
          t.status !== "COMPLETE" &&
          (["NOUVEAU", "EN_ATTENTE", "EN_ATTENTE_INFO"].includes(t.status) || Boolean(t.correctionNote)),
      );
    } else if (filter === "en_cours") {
      list = list.filter((t) => ["EN_COURS", "EN_ANALYSE", "ASSIGNEE"].includes(t.status));
    } else if (filter === "en_attente_info") {
      list = list.filter(
        (t) => t.status === "EN_ATTENTE_INFO" || (t.status === "EN_COURS" && Boolean(t.correctionNote)),
      );
    } else if (filter === "a_valider") {
      list = list.filter((t) => t.status === "A_VALIDER");
    } else if (filter === "terminees") {
      list = list.filter((t) => t.status === "COMPLETE");
    }

    if (priorityFilter !== "toutes") {
      list = list.filter((t) => coerceTaskPriority(t.priority) === priorityFilter);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q)) ||
          (t.project?.title && t.project.title.toLowerCase().includes(q)) ||
          (t.assignedTo?.name && t.assignedTo.name.toLowerCase().includes(q)) ||
          missionTypeLabel(t.missionType).toLowerCase().includes(q),
      );
    }

    if (sort === "priorite") return sortByPriorityThenDate(list, "asc");
    if (sort === "recent") {
      return [...list].sort(
        (a, b) =>
          new Date(b.updatedAt ?? b.createdAt).getTime() -
          new Date(a.updatedAt ?? a.createdAt).getTime(),
      );
    }
    if (sort === "ancien") {
      return [...list].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
    }
    return [...list].sort((a, b) => {
      const da = a.desiredDate ? new Date(a.desiredDate).getTime() : Number.POSITIVE_INFINITY;
      const db = b.desiredDate ? new Date(b.desiredDate).getTime() : Number.POSITIVE_INFINITY;
      if (da !== db) return da - db;
      return priorityRank(a.priority) - priorityRank(b.priority);
    });
  }, [tasks, filter, priorityFilter, sort, search]);

  const byChantier = useMemo(() => {
    const map = new Map<string, { key: string; title: string; projectId: string | null; items: DemandeTaskItem[] }>();
    for (const t of filtered) {
      const key = t.project?.id ?? "__none__";
      const title = t.project?.title ?? "Sans chantier lié";
      const existing = map.get(key);
      if (existing) existing.items.push(t);
      else map.set(key, { key, title, projectId: t.project?.id ?? null, items: [t] });
    }
    return Array.from(map.values()).sort((a, b) => {
      if (a.key === "__none__") return 1;
      if (b.key === "__none__") return -1;
      return a.title.localeCompare(b.title);
    });
  }, [filtered]);

  function onPriorityUpdated(taskId: string, priority: TaskPriority) {
    setPriorityOverrides((prev) => ({ ...prev, [taskId]: priority }));
  }

  const statusFilters: { id: DemandeStatusFilter; label: string; count?: number }[] = [
    { id: "toutes", label: "Toutes", count: counts.total },
    { id: "a_traiter", label: "À traiter", count: counts.aTraiter },
    { id: "en_cours", label: "En cours", count: counts.enCours },
    { id: "en_attente_info", label: "Info requise" },
    { id: "a_valider", label: "À valider", count: counts.aValider },
    { id: "terminees", label: "Terminées" },
  ];

  return (
    <div className="space-y-4">
      {(counts.urgentes > 0 || counts.overdue > 0) && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          <p className="font-semibold">Points d’attention</p>
          <p className="mt-0.5 text-red-800/90">
            {counts.urgentes > 0 ? `${counts.urgentes} mission${counts.urgentes > 1 ? "s" : ""} urgente${counts.urgentes > 1 ? "s" : ""}` : null}
            {counts.urgentes > 0 && counts.overdue > 0 ? " · " : null}
            {counts.overdue > 0
              ? `${counts.overdue} échéance${counts.overdue > 1 ? "s" : ""} dépassée${counts.overdue > 1 ? "s" : ""}`
              : null}
            {" — "}
            classez par priorité ou ouvrez le chantier concerné.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <button
          type="button"
          onClick={() => {
            setFilter("a_traiter");
            setPriorityFilter("toutes");
          }}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left shadow-sm transition hover:border-[#1e3a5f]/30"
        >
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">À traiter</p>
          <p className="mt-0.5 text-xl font-bold text-[#1e3a5f]">{counts.aTraiter}</p>
        </button>
        <button
          type="button"
          onClick={() => {
            setFilter("toutes");
            setPriorityFilter("URGENT");
          }}
          className="rounded-xl border border-red-100 bg-red-50/80 px-3 py-2.5 text-left shadow-sm transition hover:border-red-300"
        >
          <p className="text-[11px] font-medium uppercase tracking-wide text-red-700/80">Urgentes</p>
          <p className="mt-0.5 text-xl font-bold text-red-700">{counts.urgentes}</p>
        </button>
        <button
          type="button"
          onClick={() => {
            setFilter("en_cours");
            setPriorityFilter("toutes");
          }}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left shadow-sm transition hover:border-[#1e3a5f]/30"
        >
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">En cours</p>
          <p className="mt-0.5 text-xl font-bold text-[#1e3a5f]">{counts.enCours}</p>
        </button>
        <button
          type="button"
          onClick={() => {
            setFilter("a_valider");
            setPriorityFilter("toutes");
          }}
          className="rounded-xl border border-violet-100 bg-violet-50/70 px-3 py-2.5 text-left shadow-sm transition hover:border-violet-300"
        >
          <p className="text-[11px] font-medium uppercase tracking-wide text-violet-700/80">À valider</p>
          <p className="mt-0.5 text-xl font-bold text-violet-800">{counts.aValider}</p>
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm sm:p-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {statusFilters.map(({ id, label, count }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFilter(id)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    filter === id
                      ? "bg-[#1e3a5f] text-white shadow-sm"
                      : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {label}
                  {typeof count === "number" ? (
                    <span
                      className={`rounded-md px-1.5 py-0.5 text-[10px] ${
                        filter === id ? "bg-white/20 text-white" : "bg-white text-slate-500"
                      }`}
                    >
                      {count}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
            <div className="flex rounded-lg border border-slate-200 p-0.5" role="group" aria-label="Vue">
              {(
                [
                  { id: "liste" as const, label: "Liste" },
                  { id: "chantier" as const, label: "Chantiers" },
                  { id: "tableau" as const, label: "Tableau" },
                ] as const
              ).map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setViewMode(id)}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                    viewMode === id ? "bg-[#1e3a5f] text-white" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Priorité
              </span>
              {(
                [
                  { id: "toutes" as const, label: "Toutes" },
                  { id: "URGENT" as const, label: "Urgent" },
                  { id: "PRIORITAIRE" as const, label: "Prioritaire" },
                  { id: "STANDARD" as const, label: "Normal" },
                ] as const
              ).map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setPriorityFilter(id)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                    priorityFilter === id
                      ? id === "URGENT"
                        ? "bg-red-600 text-white"
                        : id === "PRIORITAIRE"
                          ? "bg-amber-500 text-white"
                          : "bg-slate-700 text-white"
                      : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                id="missions-sort"
                value={sort}
                onChange={(e) => setSort(e.target.value as DemandeSort)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:border-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/15"
              >
                <option value="priorite">Trier : priorité</option>
                <option value="echeance">Trier : échéance</option>
                <option value="recent">Trier : plus récentes</option>
                <option value="ancien">Trier : plus anciennes</option>
              </select>
              <input
                type="search"
                placeholder="Rechercher (titre, chantier, assistant…)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm placeholder:text-slate-400 focus:border-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/15 sm:w-64"
              />
            </div>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
          <p className="text-slate-600">Aucune mission ne correspond à vos critères.</p>
          <Link href="/dashboard/nouvelle-demande" className="btn-cc-primary mt-4 inline-flex">
            + Nouvelle mission
          </Link>
        </div>
      ) : viewMode === "tableau" ? (
        <div className="grid gap-3 lg:grid-cols-4">
          {BOARD_COLUMNS.map((col) => {
            const items = filtered.filter(col.match);
            return (
              <section key={col.id} className="rounded-xl border border-slate-200 bg-slate-50/80 p-2">
                <header className="mb-2 flex items-center justify-between px-1">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-slate-600">{col.label}</h3>
                  <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                    {items.length}
                  </span>
                </header>
                <ul className="space-y-2">
                  {items.map((task) => (
                    <MissionCard
                      key={task.id}
                      task={task}
                      compact
                      onPriorityUpdated={onPriorityUpdated}
                    />
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      ) : viewMode === "chantier" ? (
        <div className="space-y-5">
          {byChantier.map((group) => (
            <section key={group.key} className="space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                <h3 className="text-sm font-bold text-[#1e3a5f]">
                  {group.projectId ? (
                    <Link href={`/dashboard/projets/${group.projectId}`} className="hover:underline">
                      {group.title}
                    </Link>
                  ) : (
                    group.title
                  )}
                </h3>
                <span className="text-xs text-slate-500">
                  {group.items.length} mission{group.items.length > 1 ? "s" : ""}
                </span>
              </div>
              <ul className="space-y-2.5">
                {group.items.map((task) => (
                  <MissionCard key={task.id} task={task} onPriorityUpdated={onPriorityUpdated} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <ul className="space-y-2.5">
          {filtered.map((task) => (
            <MissionCard key={task.id} task={task} onPriorityUpdated={onPriorityUpdated} />
          ))}
        </ul>
      )}
    </div>
  );
}
