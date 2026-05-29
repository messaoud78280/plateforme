"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MissionDetailDrawer } from "./MissionDetailDrawer";
import { DeleteTaskButton } from "./DeleteTaskButton";
import { QualifyRequestButton } from "./QualifyRequestButton";
import { missionTypeLabel, MISSION_TYPES, MISSION_TYPE_LABELS } from "@/lib/tasks/mission-types";

const FILTER_ALL = "";
const FILTER_UNASSIGNED = "__none__";

/** Priorité : 3 niveaux visibles (Urgent, Normal, Faible) */
const PRIORITY_STYLES: Record<string, { label: string; borderClass: string; badgeClass: string }> = {
  URGENT: { label: "Urgent", borderClass: "border-l-red-500", badgeClass: "bg-red-500/15 text-red-700 font-semibold px-2.5 py-1 rounded-md text-xs" },
  PRIORITAIRE: { label: "Normal", borderClass: "border-l-blue-400", badgeClass: "bg-blue-500/15 text-blue-700 font-medium px-2.5 py-1 rounded-md text-xs" },
  STANDARD: { label: "Normal", borderClass: "border-l-blue-400", badgeClass: "bg-blue-500/15 text-blue-700 font-medium px-2.5 py-1 rounded-md text-xs" },
  "": { label: "Faible", borderClass: "border-l-slate-300", badgeClass: "bg-slate-200/80 text-slate-600 font-medium px-2.5 py-1 rounded-md text-xs" },
};

const PRIORITY_OPTIONS: { value: string; label: string }[] = [
  { value: "URGENT", label: "Urgent" },
  { value: "STANDARD", label: "Normal" },
  { value: "", label: "Faible" },
];

type AgentOption = { id: string; name: string; email?: string };

function AgentAvatar({ name }: { name: string }) {
  const initials = name.trim().split(/\s+/).length >= 2
    ? (name.trim().split(/\s+/)[0][0] + name.trim().split(/\s+/)[1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-600 text-xs font-semibold text-white" title={name}>
      {initials}
    </div>
  );
}

export type ManagerBoardTask = {
  id: string;
  title: string;
  status: string;
  priority: string | null;
  createdAt: Date;
  updatedAt?: Date;
  estimatedActions?: number | string | null;
  missionType?: string | null;
  desiredDate?: Date | string | null;
  client: { id: string; name: string };
  assignedTo: { id: string; name: string } | null;
  project?: { id: string; title: string } | null;
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
  agents,
  projects,
  onOpenMission,
  onPriorityChange,
  onAssignAgent,
}: {
  task: ManagerBoardTask;
  columnId: string;
  agents: AgentOption[];
  projects: { id: string; title: string; clientId?: string }[];
  onOpenMission: (taskId: string) => void;
  onPriorityChange: (taskId: string, priority: string | null) => void;
  onAssignAgent: (taskId: string, agentId: string) => void;
}) {
  const [assignerOpen, setAssignerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const assignerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [menuOpen]);

  useEffect(() => {
    if (!assignerOpen) return;
    const close = (e: MouseEvent) => {
      if (assignerRef.current && !assignerRef.current.contains(e.target as Node)) setAssignerOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [assignerOpen]);

  const priorityKey = task.priority ?? "";
  const priorityStyle = PRIORITY_STYLES[priorityKey] ?? PRIORITY_STYLES[""];

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("application/task-id", task.id);
        e.dataTransfer.setData("application/column-id", columnId);
        e.dataTransfer.effectAllowed = "move";
      }}
      className={`cursor-grab rounded-xl border border-l-4 border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md active:cursor-grabbing min-h-[200px] flex flex-col ${priorityStyle.borderClass}`}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => onOpenMission(task.id)}
          className="min-w-0 flex-1 text-left text-sm font-semibold text-slate-800 hover:text-blue-600 line-clamp-2"
        >
          {task.title || "Sans titre"}
        </button>
        <DeleteTaskButton taskId={task.id} />
      </div>
      <p className="mt-2 text-xs text-slate-600">
        <span className="font-medium text-slate-700">Client :</span>{" "}
        <Link href={`/dashboard/clients/${task.client.id}`} className="text-blue-600 hover:underline">
          {task.client.name}
        </Link>
      </p>
      {task.project ? (
        <p className="mt-1 text-xs text-slate-600">
          <span className="font-medium text-slate-700">Chantier :</span>{" "}
          <Link href={`/dashboard/projets/${task.project.id}`} className="text-blue-600 hover:underline">
            {task.project.title}
          </Link>
        </p>
      ) : null}
      {task.missionType ? (
        <p className="mt-1 text-xs text-slate-500">{missionTypeLabel(task.missionType)}</p>
      ) : null}
      <div className="mt-2 flex items-center gap-2">
        {task.assignedTo ? (
          <>
            <AgentAvatar name={task.assignedTo.name} />
            <span className="text-xs font-medium text-slate-700 truncate">{task.assignedTo.name}</span>
          </>
        ) : (
          <span className="text-xs text-slate-500 italic">Non assigné</span>
        )}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className={`inline-flex ${priorityStyle.badgeClass}`}>
          {priorityStyle.label}
        </span>
        {task.estimatedActions != null && task.estimatedActions !== "" && (
          <span className="text-xs text-slate-500">{task.estimatedActions} action(s) est.</span>
        )}
        {task.desiredDate ? (
          <span className="text-xs text-slate-500">
            Éch. {new Date(task.desiredDate).toLocaleDateString("fr-FR")}
          </span>
        ) : null}
        <span className="text-xs text-slate-400">Créée le {formatDate(task.createdAt)}</span>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {columnId === "nouvelles" ? (
          <QualifyRequestButton
            taskId={task.id}
            clientId={task.client.id}
            projects={projects}
            agents={agents}
          />
        ) : null}
        <div className="relative" ref={assignerRef}>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setAssignerOpen((v) => !v); setMenuOpen(false); }}
            className="rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700"
          >
            Assigner
          </button>
          {assignerOpen && agents.length > 0 && (
            <div className="absolute left-0 top-full z-20 mt-1 w-40 rounded-lg surface-metallic-light py-1 shadow-lg">
              {agents.map((agent) => (
                <button
                  key={agent.id}
                  type="button"
                  onClick={() => {
                    onAssignAgent(task.id, agent.id);
                    setAssignerOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                >
                  <AgentAvatar name={agent.name} />
                  {agent.name}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => onOpenMission(task.id)}
          className="text-xs font-medium text-blue-600 hover:underline"
        >
          Ouvrir
        </button>
        <div className="relative ml-auto" ref={menuRef}>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); setAssignerOpen(false); }}
            className="rounded surface-metallic-light p-1.5 text-slate-500 hover:bg-slate-50"
            title="Priorité et plus"
            aria-label="Menu"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full z-20 mt-1 w-40 rounded-lg surface-metallic-light py-1 shadow-lg">
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
              <Link
                href={`/dashboard/taches/${task.id}#agent-section`}
                className="block px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                onClick={() => setMenuOpen(false)}
              >
                Voir la fiche mission
              </Link>
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
  projectFilter: string,
  missionTypeFilter: string,
  searchQuery: string
): boolean {
  if (clientFilter !== FILTER_ALL && task.client.name !== clientFilter) return false;
  if (agentFilter === FILTER_UNASSIGNED && task.assignedTo?.name) return false;
  if (agentFilter !== FILTER_ALL && agentFilter !== FILTER_UNASSIGNED && task.assignedTo?.name !== agentFilter) return false;
  if (projectFilter !== FILTER_ALL) {
    if (projectFilter === FILTER_UNASSIGNED && task.project) return false;
    if (projectFilter !== FILTER_UNASSIGNED && task.project?.title !== projectFilter) return false;
  }
  if (missionTypeFilter !== FILTER_ALL && (task.missionType ?? "") !== missionTypeFilter) return false;
  const q = searchQuery.trim().toLowerCase();
  if (q) {
    const title = (task.title ?? "").toLowerCase();
    const client = (task.client.name ?? "").toLowerCase();
    const agent = (task.assignedTo?.name ?? "").toLowerCase();
    const project = (task.project?.title ?? "").toLowerCase();
    if (!title.includes(q) && !client.includes(q) && !agent.includes(q) && !project.includes(q)) return false;
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
  projects = [],
}: {
  nouvelles: ManagerBoardTask[];
  aAssigner: ManagerBoardTask[];
  enCours: ManagerBoardTask[];
  aValider: ManagerBoardTask[];
  terminees: ManagerBoardTask[];
  sessionUserId: string;
  projects?: { id: string; title: string; clientId?: string }[];
}) {
  const router = useRouter();
  const [drawerTaskId, setDrawerTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [dropHint, setDropHint] = useState<string | null>(null);
  const [boardState, setBoardState] = useState<{
    nouvelles: ManagerBoardTask[];
    aAssigner: ManagerBoardTask[];
    enCours: ManagerBoardTask[];
    aValider: ManagerBoardTask[];
    terminees: ManagerBoardTask[];
  }>({ nouvelles, aAssigner, enCours, aValider, terminees });
  const pendingMovesRef = useRef<Set<string>>(new Set());
  const [filterClient, setFilterClient] = useState(FILTER_ALL);
  const [filterAgent, setFilterAgent] = useState(FILTER_ALL);
  const [filterProject, setFilterProject] = useState(FILTER_ALL);
  const [filterMissionType, setFilterMissionType] = useState(FILTER_ALL);
  const [searchQuery, setSearchQuery] = useState("");
  const [agents, setAgents] = useState<AgentOption[]>([]);

  useEffect(() => {
    // Synchronise l'état local avec les props (après refresh serveur),
    // mais sans écraser les déplacements optimistes en attente de confirmation.
    const server = { nouvelles, aAssigner, enCours, aValider, terminees };
    const pending = pendingMovesRef.current;
    if (pending.size === 0) {
      setBoardState(server);
      return;
    }
    setBoardState((cur) => {
      const serverAll = [
        ...server.nouvelles,
        ...server.aAssigner,
        ...server.enCours,
        ...server.aValider,
        ...server.terminees,
      ];
      const serverById = new Map(serverAll.map((t) => [t.id, t]));

      // Si le serveur "voit" déjà la mission déplacée (statut mis à jour),
      // on la retire des pending et on laisse le serveur reprendre la main.
      for (const id of Array.from(pending)) {
        const s = serverById.get(id);
        const c =
          cur.nouvelles.find((t) => t.id === id) ??
          cur.aAssigner.find((t) => t.id === id) ??
          cur.enCours.find((t) => t.id === id) ??
          cur.aValider.find((t) => t.id === id) ??
          cur.terminees.find((t) => t.id === id);
        if (s && c && s.status === c.status) {
          pending.delete(id);
        }
      }

      if (pending.size === 0) return server;

      // Merge: on prend la base serveur, puis on réinjecte les cartes pending
      // depuis l'état courant (optimiste) pour éviter un "clignotement".
      const next = {
        nouvelles: [...server.nouvelles],
        aAssigner: [...server.aAssigner],
        enCours: [...server.enCours],
        aValider: [...server.aValider],
        terminees: [...server.terminees],
      };
      const removeFromAll = (id: string) => {
        next.nouvelles = next.nouvelles.filter((t) => t.id !== id);
        next.aAssigner = next.aAssigner.filter((t) => t.id !== id);
        next.enCours = next.enCours.filter((t) => t.id !== id);
        next.aValider = next.aValider.filter((t) => t.id !== id);
        next.terminees = next.terminees.filter((t) => t.id !== id);
      };
      for (const id of pending) {
        const c =
          cur.nouvelles.find((t) => t.id === id) ??
          cur.aAssigner.find((t) => t.id === id) ??
          cur.enCours.find((t) => t.id === id) ??
          cur.aValider.find((t) => t.id === id) ??
          cur.terminees.find((t) => t.id === id);
        if (!c) continue;
        removeFromAll(id);
        if (c.status === "NOUVEAU") next.nouvelles = [c, ...next.nouvelles];
        else if (c.status === "EN_ATTENTE") next.aAssigner = [c, ...next.aAssigner];
        else if (["ASSIGNEE", "EN_ANALYSE", "EN_COURS", "EN_ATTENTE_INFO"].includes(c.status)) next.enCours = [c, ...next.enCours];
        else if (c.status === "A_VALIDER") next.aValider = [c, ...next.aValider];
        else if (c.status === "COMPLETE") next.terminees = [c, ...next.terminees];
      }
      return next;
    });
  }, [nouvelles, aAssigner, enCours, aValider, terminees]);

  useEffect(() => {
    fetch("/api/agents")
      .then((r) => (r.ok ? r.json() : []))
      .then((list: AgentOption[]) => setAgents(Array.isArray(list) ? list : []))
      .catch(() => setAgents([]));
  }, []);

  const { clientNames, agentNames, projectNames } = useMemo(() => {
    const all = [...boardState.nouvelles, ...boardState.aAssigner, ...boardState.enCours, ...boardState.aValider, ...boardState.terminees];
    const clients = [...new Set(all.map((t) => t.client.name))].filter(Boolean).sort();
    const agentsList = [...new Set(all.map((t) => t.assignedTo?.name).filter((n): n is string => !!n))].sort();
    const projs = [...new Set(all.map((t) => t.project?.title).filter((n): n is string => !!n))].sort();
    return { clientNames: clients, agentNames: agentsList, projectNames: projs };
  }, [boardState]);

  const columns: Column[] = useMemo(() => {
    const fn = (tasks: ManagerBoardTask[]) =>
      tasks.filter((t) =>
        filterTask(t, filterClient, filterAgent, filterProject, filterMissionType, searchQuery)
      );
    return [
      { id: "nouvelles", title: "Nouvelles", tasks: fn(boardState.nouvelles) },
      { id: "a-assigner", title: "À assigner", tasks: fn(boardState.aAssigner) },
      { id: "en-cours", title: "En cours", tasks: fn(boardState.enCours) },
      { id: "a-valider", title: "À valider", tasks: fn(boardState.aValider) },
      { id: "terminees", title: "Terminées", tasks: fn(boardState.terminees) },
    ];
  }, [boardState, filterClient, filterAgent, filterProject, filterMissionType, searchQuery]);

  const handleDrop = useCallback(
    async (targetColumnId: string, taskId: string, sourceColumnId: string) => {
      if (targetColumnId === sourceColumnId) return;
      // La colonne "Terminées" est uniquement un affichage : on ne change
      // pas le statut par simple glisser-déposer pour éviter de clôturer
      // une mission sans validation explicite.
      if (targetColumnId === "terminees") {
        return;
      }
      // Même logique pour "À valider" : il faut saisir le temps passé pour décompter les crédits.
      if (targetColumnId === "a-valider") {
        setDropHint("Pour passer « À valider », ouvrez la mission et cliquez « Marquer comme terminée » (avec le temps passé).");
        window.setTimeout(() => setDropHint(null), 7000);
        setDrawerTaskId(taskId);
        return;
      }
      const newStatus = COLUMN_TO_STATUS[targetColumnId];
      if (!newStatus) return;
      // UI optimiste: on déplace immédiatement la carte pour éviter le "blanc" pendant router.refresh()
      const prev = boardState;
      pendingMovesRef.current.add(taskId);
      const keyOf = (colId: string) => {
        if (colId === "nouvelles") return "nouvelles" as const;
        if (colId === "a-assigner") return "aAssigner" as const;
        if (colId === "en-cours") return "enCours" as const;
        if (colId === "a-valider") return "aValider" as const;
        return "terminees" as const;
      };
      const sourceKey = keyOf(sourceColumnId);
      const targetKey = keyOf(targetColumnId);
      const moving =
        prev[sourceKey].find((t) => t.id === taskId) ??
        prev.nouvelles.find((t) => t.id === taskId) ??
        prev.aAssigner.find((t) => t.id === taskId) ??
        prev.enCours.find((t) => t.id === taskId) ??
        prev.aValider.find((t) => t.id === taskId) ??
        prev.terminees.find((t) => t.id === taskId);
      if (moving) {
        setBoardState((cur) => {
          const next = {
            nouvelles: cur.nouvelles.filter((t) => t.id !== taskId),
            aAssigner: cur.aAssigner.filter((t) => t.id !== taskId),
            enCours: cur.enCours.filter((t) => t.id !== taskId),
            aValider: cur.aValider.filter((t) => t.id !== taskId),
            terminees: cur.terminees.filter((t) => t.id !== taskId),
          };
          const updated: ManagerBoardTask = { ...moving, status: newStatus };
          // Si on déplace vers "À assigner", on force l'affichage "non assigné" immédiatement
          const finalTask =
            targetColumnId === "a-assigner" ? { ...updated, assignedTo: null } : updated;
          next[targetKey] = [finalTask, ...next[targetKey]];
          return next;
        });
      }
      try {
        if (targetColumnId === "a-assigner") {
          const unassignRes = await fetch(`/api/tasks/${taskId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ assignedToId: null }),
          });
          if (!unassignRes.ok) {
            setDropHint("Impossible de déplacer la mission (droits ou erreur serveur).");
            window.setTimeout(() => setDropHint(null), 7000);
            setBoardState(prev);
            pendingMovesRef.current.delete(taskId);
            router.refresh();
            return;
          }
        }
        const res = await fetch(`/api/tasks/${taskId}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });
        if (!res.ok) {
          setDropHint("Le déplacement n'a pas été enregistré (droits ou erreur serveur).");
          window.setTimeout(() => setDropHint(null), 7000);
          setBoardState(prev);
          pendingMovesRef.current.delete(taskId);
        }
        // Toujours resynchroniser le board après un drop
        router.refresh();
      } catch {
        setDropHint("Erreur réseau : le déplacement n'a pas été enregistré.");
        window.setTimeout(() => setDropHint(null), 7000);
        setBoardState(prev);
        pendingMovesRef.current.delete(taskId);
        router.refresh();
      }
    },
    [router, boardState]
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

  const handleAssignAgent = useCallback(
    async (taskId: string, agentId: string) => {
      try {
        const res = await fetch(`/api/tasks/${taskId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assignedToId: agentId }),
        });
        if (res.ok) router.refresh();
      } catch {
        // ignore
      }
    },
    [router]
  );

  const hasActiveFilter =
    filterClient !== FILTER_ALL ||
    filterAgent !== FILTER_ALL ||
    filterProject !== FILTER_ALL ||
    filterMissionType !== FILTER_ALL ||
    searchQuery.trim() !== "";

  return (
    <>
      {dropHint && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {dropHint}
        </div>
      )}
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
        <select
          value={filterProject}
          onChange={(e) => setFilterProject(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value={FILTER_ALL}>Tous les chantiers</option>
          <option value={FILTER_UNASSIGNED}>Sans chantier</option>
          {projectNames.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
        <select
          value={filterMissionType}
          onChange={(e) => setFilterMissionType(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value={FILTER_ALL}>Tous les types</option>
          {MISSION_TYPES.map((t) => (
            <option key={t} value={t}>{MISSION_TYPE_LABELS[t]}</option>
          ))}
        </select>
        {hasActiveFilter && (
          <button
            type="button"
            onClick={() => {
              setFilterClient(FILTER_ALL);
              setFilterAgent(FILTER_ALL);
              setFilterProject(FILTER_ALL);
              setFilterMissionType(FILTER_ALL);
              setSearchQuery("");
            }}
            className="text-sm font-medium text-slate-600 underline hover:text-slate-800"
          >
            Réinitialiser
          </button>
        )}
      </div>
      <p className="mb-4 text-sm text-slate-500">
        Glissez-déposez une carte pour changer son statut. Utilisez <strong>Assigner</strong> pour attribuer un agent, ou le titre / <strong>Ouvrir</strong> pour les détails.
      </p>
      <div className="space-y-5 pb-4">
        {columns.map((col) => (
          <div
            key={col.id}
            className={`rounded-2xl border-2 p-4 transition md:p-5 ${
              dragOverColumn === col.id
                ? "border-blue-400 bg-blue-50/80 ring-2 ring-blue-200"
                : "surface-metallic-light surface-metallic-light--soft border-slate-200 hover:border-blue-200 hover:shadow-md"
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
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-base font-semibold text-slate-900">
                {col.title}
              </h3>
              <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-700">
                {col.tasks.length} mission{col.tasks.length > 1 ? "s" : ""}
              </span>
            </div>
            {col.tasks.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-6 text-center text-sm text-slate-500">
                Aucune mission
              </p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {col.tasks.map((task) => (
                  <MissionCard
                    key={task.id}
                    task={task}
                    columnId={col.id}
                    agents={agents}
                    projects={projects}
                    onOpenMission={setDrawerTaskId}
                    onPriorityChange={handlePriorityChange}
                    onAssignAgent={handleAssignAgent}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
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
