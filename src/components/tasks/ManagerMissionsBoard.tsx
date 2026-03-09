"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MissionDetailDrawer } from "./MissionDetailDrawer";

const FILTER_ALL = "";
const FILTER_UNASSIGNED = "__none__";

/** Priorité : couleur de la barre gauche + libellé */
const PRIORITY_STYLES: Record<string, { label: string; borderClass: string; badgeClass: string }> = {
  URGENT: { label: "Urgent", borderClass: "border-l-red-500", badgeClass: "bg-red-100 text-red-800" },
  PRIORITAIRE: { label: "Prioritaire", borderClass: "border-l-amber-500", badgeClass: "bg-amber-100 text-amber-800" },
  STANDARD: { label: "Normal", borderClass: "border-l-slate-400", badgeClass: "bg-slate-100 text-slate-700" },
  "": { label: "Faible", borderClass: "border-l-slate-300", badgeClass: "bg-slate-100/80 text-slate-500" },
};

const PRIORITY_OPTIONS: { value: string; label: string }[] = [
  { value: "URGENT", label: "Urgent" },
  { value: "PRIORITAIRE", label: "Prioritaire" },
  { value: "STANDARD", label: "Normal" },
  { value: "", label: "Faible" },
];

export type ManagerBoardTask = {
  id: string;
  title: string;
  status: string;
  priority: string | null;
  createdAt: Date;
  updatedAt?: Date;
  estimatedActions?: string | null;
  client: { id: string; name: string };
  assignedTo: { id: string; name: string } | null;
};

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

/** Mapping colonne Kanban → statut API */
const COLUMN_TO_STATUS: Record<string, string> = {
  nouvelles: "NOUVEAU",
  "a-assigner": "EN_ATTENTE",
  "en-cours": "EN_COURS",
  "a-valider": "A_VALIDER",
  terminees: "COMPLETE",
};

function MissionCard({
  task,
  columnId,
  onOpenMission,
  onPriorityChange,
}: {
  task: ManagerBoardTask;
  columnId: string;
  onOpenMission: (taskId: string) => void;
  onPriorityChange: (taskId: string, priority: string | null) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [menuOpen]);

  const priorityKey = task.priority ?? "";
  const priorityStyle = PRIORITY_STYLES[priorityKey] ?? PRIORITY_STYLES[""];
  const hasAgent = !!task.assignedTo?.name;

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("application/task-id", task.id);
        e.dataTransfer.setData("application/column-id", columnId);
        e.dataTransfer.effectAllowed = "move";
      }}
      className={`cursor-grab rounded-lg border border-l-4 border-slate-200 bg-white p-3 shadow-sm transition hover:shadow-md active:cursor-grabbing ${priorityStyle.borderClass}`}
    >
      <button
        type="button"
        onClick={() => onOpenMission(task.id)}
        className="w-full text-left text-sm font-semibold text-slate-800 hover:text-blue-600 line-clamp-2"
      >
        {task.title || "Sans titre"}
      </button>
      <p className="mt-1.5 text-xs text-slate-500 line-clamp-1">
        {task.client.name}
        {" · "}
        {task.assignedTo?.name ?? "Non assigné"}
        {" · "}
        {formatDate(task.createdAt)}
      </p>
      <div className="mt-2 flex items-center gap-2">
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${priorityStyle.badgeClass}`}>
          {priorityStyle.label}
        </span>
        {task.estimatedActions && (
          <span className="text-xs text-slate-400">{task.estimatedActions}</span>
        )}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => onOpenMission(task.id)}
          className="flex-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
        >
          Ouvrir
        </button>
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
            className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 hover:bg-slate-50"
            title="Actions"
            aria-label="Menu actions"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
              <Link
                href={`/dashboard/taches/${task.id}#agent-section`}
                className="block px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                onClick={() => setMenuOpen(false)}
              >
                {hasAgent ? "Réassigner l'agent" : "Assigner un agent"}
              </Link>
              {PRIORITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onPriorityChange(task.id, opt.value || null);
                    setMenuOpen(false);
                  }}
                  className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                >
                  Priorité : {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

type Column = {
  id: string;
  title: string;
  tasks: ManagerBoardTask[];
};

function filterTask(
  task: ManagerBoardTask,
  clientFilter: string,
  agentFilter: string,
  searchQuery: string
): boolean {
  if (clientFilter !== FILTER_ALL && task.client.name !== clientFilter) return false;
  if (agentFilter === FILTER_UNASSIGNED && task.assignedTo?.name) return false;
  if (agentFilter !== FILTER_ALL && agentFilter !== FILTER_UNASSIGNED && task.assignedTo?.name !== agentFilter) return false;
  const q = searchQuery.trim().toLowerCase();
  if (q) {
    const title = (task.title ?? "").toLowerCase();
    const client = (task.client.name ?? "").toLowerCase();
    const agent = (task.assignedTo?.name ?? "").toLowerCase();
    if (!title.includes(q) && !client.includes(q) && !agent.includes(q)) return false;
  }
  return true;
}

export function ManagerMissionsBoard({
  nouvelles,
  aAssigner,
  enCours,
  aValider,
  terminees,
  sessionUserId,
}: {
  nouvelles: ManagerBoardTask[];
  aAssigner: ManagerBoardTask[];
  enCours: ManagerBoardTask[];
  aValider: ManagerBoardTask[];
  terminees: ManagerBoardTask[];
  sessionUserId: string;
}) {
  const router = useRouter();
  const [drawerTaskId, setDrawerTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [filterClient, setFilterClient] = useState(FILTER_ALL);
  const [filterAgent, setFilterAgent] = useState(FILTER_ALL);
  const [searchQuery, setSearchQuery] = useState("");

  const { clientNames, agentNames } = useMemo(() => {
    const all = [...nouvelles, ...aAssigner, ...enCours, ...aValider, ...terminees];
    const clients = [...new Set(all.map((t) => t.client.name))].filter(Boolean).sort();
    const agents = [...new Set(all.map((t) => t.assignedTo?.name).filter((n): n is string => !!n))].sort();
    return { clientNames: clients, agentNames: agents };
  }, [nouvelles, aAssigner, enCours, aValider, terminees]);

  const columns: Column[] = useMemo(() => {
    const fn = (tasks: ManagerBoardTask[]) =>
      tasks.filter((t) => filterTask(t, filterClient, filterAgent, searchQuery));
    return [
      { id: "nouvelles", title: "Nouvelles", tasks: fn(nouvelles) },
      { id: "a-assigner", title: "À assigner", tasks: fn(aAssigner) },
      { id: "en-cours", title: "En cours", tasks: fn(enCours) },
      { id: "a-valider", title: "À valider", tasks: fn(aValider) },
      { id: "terminees", title: "Terminées", tasks: fn(terminees) },
    ];
  }, [nouvelles, aAssigner, enCours, aValider, terminees, filterClient, filterAgent, searchQuery]);

  const handleDrop = useCallback(
    async (targetColumnId: string, taskId: string, sourceColumnId: string) => {
      if (targetColumnId === sourceColumnId) return;
      const newStatus = COLUMN_TO_STATUS[targetColumnId];
      if (!newStatus) return;
      try {
        if (targetColumnId === "a-assigner") {
          await fetch(`/api/tasks/${taskId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ assignedToId: null }),
          });
        }
        const res = await fetch(`/api/tasks/${taskId}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });
        if (res.ok) router.refresh();
      } catch {
        // ignore
      }
    },
    [router]
  );

  const handlePriorityChange = useCallback(
    async (taskId: string, priority: string | null) => {
      try {
        const res = await fetch(`/api/tasks/${taskId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ priority }),
        });
        if (res.ok) router.refresh();
      } catch {
        // ignore
      }
    },
    [router]
  );

  const hasActiveFilter = filterClient !== FILTER_ALL || filterAgent !== FILTER_ALL || searchQuery.trim() !== "";

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-3">
        <span className="text-sm font-medium text-slate-600">Filtrer :</span>
        <input
          type="search"
          placeholder="Rechercher (titre, client, agent…)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-[220px] rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <select
          value={filterClient}
          onChange={(e) => setFilterClient(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value={FILTER_ALL}>Tous les clients</option>
          {clientNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <select
          value={filterAgent}
          onChange={(e) => setFilterAgent(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value={FILTER_ALL}>Tous les agents</option>
          <option value={FILTER_UNASSIGNED}>Non assigné</option>
          {agentNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        {hasActiveFilter && (
          <button
            type="button"
            onClick={() => {
              setFilterClient(FILTER_ALL);
              setFilterAgent(FILTER_ALL);
              setSearchQuery("");
            }}
            className="text-sm font-medium text-slate-600 underline hover:text-slate-800"
          >
            Réinitialiser
          </button>
        )}
      </div>
      <p className="mb-3 text-sm text-slate-500">
        Glissez-déposez une carte dans une autre colonne pour changer son statut. Cliquez sur <strong>Ouvrir</strong> pour les détails.
      </p>
      <div className="overflow-x-auto pb-4">
        <div className="flex min-w-[1200px] gap-5">
          {columns.map((col) => (
            <div
              key={col.id}
              className={`w-72 shrink-0 rounded-xl border-2 p-4 transition ${
                dragOverColumn === col.id
                  ? "border-blue-400 bg-blue-50/80 ring-2 ring-blue-200"
                  : "border-slate-200 bg-slate-50/50"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                setDragOverColumn(col.id);
              }}
              onDragLeave={() => setDragOverColumn(null)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverColumn(null);
                const taskId = e.dataTransfer.getData("application/task-id");
                const sourceColumnId = e.dataTransfer.getData("application/column-id");
                if (taskId && sourceColumnId) handleDrop(col.id, taskId, sourceColumnId);
              }}
            >
              <h3 className="mb-3 font-semibold text-slate-800">
                {col.title}
                <span className="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-sm font-medium text-slate-700">
                  {col.tasks.length}
                </span>
              </h3>
              <div className="space-y-3">
                {col.tasks.length === 0 ? (
                  <p className="py-4 text-center text-sm text-slate-500">Aucune mission</p>
                ) : (
                  col.tasks.map((task) => (
                    <MissionCard
                      key={task.id}
                      task={task}
                      columnId={col.id}
                      onOpenMission={setDrawerTaskId}
                      onPriorityChange={handlePriorityChange}
                    />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <MissionDetailDrawer
        open={drawerTaskId !== null}
        taskId={drawerTaskId}
        onClose={() => setDrawerTaskId(null)}
        sessionUserId={sessionUserId}
      />
    </>
  );
}
