"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MissionDetailDrawer } from "./MissionDetailDrawer";

/** Badges priorité : urgent, normal, faible */
const PRIORITY_BADGES: Record<string, { label: string; className: string }> = {
  URGENT: { label: "Urgent", className: "bg-red-100 text-red-800" },
  PRIORITAIRE: { label: "Prioritaire", className: "bg-amber-100 text-amber-800" },
  STANDARD: { label: "Normal", className: "bg-slate-100 text-slate-700" },
  "": { label: "Faible", className: "bg-slate-100/80 text-slate-500" },
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
  const [priorityOpen, setPriorityOpen] = useState(false);
  const priorityKey = task.priority ?? "";
  const priorityBadge = PRIORITY_BADGES[priorityKey] ?? PRIORITY_BADGES[""];

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("application/task-id", task.id);
        e.dataTransfer.setData("application/column-id", columnId);
        e.dataTransfer.effectAllowed = "move";
      }}
      className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300"
    >
      <button
        type="button"
        onClick={() => onOpenMission(task.id)}
        className="w-full text-left font-medium text-slate-800 hover:text-blue-600 hover:underline line-clamp-2"
      >
        {task.title}
      </button>
      <div className="mt-2 space-y-1 text-sm text-slate-600">
        <p>Client : {task.client.name}</p>
        <p>Agent : {task.assignedTo?.name ?? "—"}</p>
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${priorityBadge.className}`}
        >
          {priorityBadge.label}
        </span>
        {task.estimatedActions && (
          <span className="ml-1 text-xs text-slate-500">• {task.estimatedActions} actions</span>
        )}
        <span className="ml-1 block text-xs text-slate-500">Créée le {formatDate(task.createdAt)}</span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Link
          href={`/dashboard/taches/${task.id}#agent-section`}
          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          Assigner agent
        </Link>
        <button
          type="button"
          onClick={() => onOpenMission(task.id)}
          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          Ouvrir mission
        </button>
        <div className="relative">
          <button
            type="button"
            onClick={() => setPriorityOpen((v) => !v)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Changer priorité
          </button>
          {priorityOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                aria-hidden="true"
                onClick={() => setPriorityOpen(false)}
              />
              <div className="absolute left-0 top-full z-20 mt-1 w-40 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                {PRIORITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onPriorityChange(task.id, opt.value || null);
                      setPriorityOpen(false);
                    }}
                    className="block w-full px-3 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-50"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </>
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

  const columns: Column[] = [
    { id: "nouvelles", title: "Nouvelles", tasks: nouvelles },
    { id: "a-assigner", title: "À assigner", tasks: aAssigner },
    { id: "en-cours", title: "En cours", tasks: enCours },
    { id: "a-valider", title: "À valider", tasks: aValider },
    { id: "terminees", title: "Terminées", tasks: terminees },
  ];

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

  return (
    <>
      <div className="overflow-x-auto pb-4">
        <div className="flex min-w-[1000px] gap-4">
          {columns.map((col) => (
            <div
              key={col.id}
              className={`w-64 shrink-0 rounded-xl border-2 p-4 transition ${
                dragOverColumn === col.id
                  ? "border-blue-400 bg-blue-50/50"
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
