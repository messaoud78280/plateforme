"use client";

import Link from "next/link";

const STATUS_LABELS: Record<string, string> = {
  NOUVEAU: "Nouvelle",
  EN_ATTENTE: "En attente",
  ASSIGNEE: "Assignée",
  EN_ANALYSE: "En analyse",
  EN_COURS: "En cours",
  EN_ATTENTE_INFO: "En attente d'info",
  A_VALIDER: "À valider",
  COMPLETE: "Terminée",
};

const PRIORITY_COLORS: Record<string, string> = {
  STANDARD: "bg-slate-100 text-slate-800",
  PRIORITAIRE: "bg-amber-100 text-amber-800",
  URGENT: "bg-red-100 text-red-800",
};

export type ManagerBoardTask = {
  id: string;
  title: string;
  status: string;
  priority: string | null;
  createdAt: Date;
  updatedAt?: Date;
  client: { id: string; name: string };
  assignedTo: { id: string; name: string } | null;
};

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

function MissionCard({
  task,
  primaryAction,
}: {
  task: ManagerBoardTask;
  primaryAction?: { label: string; hash: string };
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300">
      <Link
        href={`/dashboard/taches/${task.id}`}
        className="font-medium text-slate-800 hover:text-blue-600 hover:underline line-clamp-2"
      >
        {task.title}
      </Link>
      <div className="mt-2 space-y-1 text-sm text-slate-600">
        <p>Client : {task.client.name}</p>
        <p>Agent : {task.assignedTo?.name ?? "—"}</p>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              PRIORITY_COLORS[task.priority ?? "STANDARD"] ?? PRIORITY_COLORS.STANDARD
            }`}
          >
            {task.priority === "URGENT" ? "Urgent" : task.priority === "PRIORITAIRE" ? "Prioritaire" : "Standard"}
          </span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
            {STATUS_LABELS[task.status] ?? task.status}
          </span>
          <span className="text-xs text-slate-500">{formatDate(task.createdAt)}</span>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href={`/dashboard/taches/${task.id}`}
          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          Voir
        </Link>
        {primaryAction && (
          <Link
            href={`/dashboard/taches/${task.id}#${primaryAction.hash}`}
            className="rounded-lg bg-[#1d4ed8] px-2.5 py-1.5 text-xs font-medium text-white hover:bg-[#1e40af]"
          >
            {primaryAction.label}
          </Link>
        )}
      </div>
    </div>
  );
}

type Column = {
  id: string;
  title: string;
  tasks: ManagerBoardTask[];
  /** hash sans #, ex. "agent-section" ou "valider" */
  primaryAction?: { label: string; hash: string };
};

export function ManagerMissionsBoard({
  nouvelles,
  aAssigner,
  enCours,
  aValider,
  terminees,
}: {
  nouvelles: ManagerBoardTask[];
  aAssigner: ManagerBoardTask[];
  enCours: ManagerBoardTask[];
  aValider: ManagerBoardTask[];
  terminees: ManagerBoardTask[];
}) {
  const columns: Column[] = [
    {
      id: "nouvelles",
      title: "Nouvelles demandes",
      tasks: nouvelles,
      primaryAction: { label: "Assigner un agent", hash: "agent-section" },
    },
    {
      id: "a-assigner",
      title: "À assigner",
      tasks: aAssigner,
      primaryAction: { label: "Assigner un agent", hash: "agent-section" },
    },
    {
      id: "en-cours",
      title: "En cours",
      tasks: enCours,
    },
    {
      id: "a-valider",
      title: "À valider",
      tasks: aValider,
      primaryAction: { label: "Valider", hash: "status-section" },
    },
    {
      id: "terminees",
      title: "Terminées",
      tasks: terminees,
    },
  ];

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex min-w-[1000px] gap-4">
        {columns.map((col) => (
          <div
            key={col.id}
            className="w-64 shrink-0 rounded-xl border border-slate-200 bg-slate-50/50 p-4"
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
                    primaryAction={col.primaryAction}
                  />
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
