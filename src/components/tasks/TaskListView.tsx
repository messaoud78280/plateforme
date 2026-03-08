"use client";

import Link from "next/link";
import { TASK_STATUS_LABELS, type TaskStatus } from "@/types";

interface TaskItem {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  timeSpentMinutes?: number | null;
  actionsUsed?: number | null;
  category?: string | null;
  priority?: string | null;
  desiredDate?: Date | string | null;
  estimatedActions?: string | null;
  project?: { id: string; title: string } | null;
  assignedTo?: { id: string; name: string; email: string } | null;
}

const PRIORITY_LABELS: Record<string, string> = {
  STANDARD: "Standard",
  PRIORITAIRE: "Prioritaire",
  URGENT: "Urgent",
};

interface TaskListViewProps {
  tasks: TaskItem[];
}

const statusColors: Record<TaskStatus, string> = {
  NOUVEAU: "bg-slate-100 text-slate-800",
  EN_ATTENTE: "bg-amber-100 text-amber-800",
  ASSIGNEE: "bg-indigo-100 text-indigo-800",
  EN_ANALYSE: "bg-blue-100 text-blue-800",
  EN_COURS: "bg-blue-100 text-blue-800",
  EN_ATTENTE_INFO: "bg-amber-100 text-amber-800",
  A_VALIDER: "bg-violet-100 text-violet-800",
  COMPLETE: "bg-green-100 text-green-800",
};

export function TaskListView({ tasks }: TaskListViewProps) {
  if (tasks.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <p className="text-slate-600">Aucune tâche pour le moment.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-4 py-3 font-semibold text-slate-800">Demande</th>
              <th className="px-4 py-3 font-semibold text-slate-800">Catégorie</th>
              <th className="px-4 py-3 font-semibold text-slate-800">Priorité</th>
              <th className="px-4 py-3 font-semibold text-slate-800">Projet</th>
              <th className="px-4 py-3 font-semibold text-slate-800">Référent</th>
              <th className="px-4 py-3 font-semibold text-slate-800">Statut</th>
              <th className="px-4 py-3 font-semibold text-slate-800">Date</th>
              <th className="px-4 py-3 font-semibold text-slate-800">Estimation</th>
              <th className="px-4 py-3 font-semibold text-slate-800 text-center">Actions</th>
              <th className="px-4 py-3 font-semibold text-slate-800">Lien</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr
                key={task.id}
                className="border-b border-slate-100 transition hover:bg-slate-50"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/dashboard/taches/${task.id}`}
                    className="font-medium text-slate-800 hover:text-blue-600 hover:underline"
                  >
                    {task.title}
                  </Link>
                  {task.description && (
                    <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                      {task.description}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600 text-xs">{task.category ?? "—"}</td>
                <td className="px-4 py-3">
                  {task.priority ? (
                    <span className="text-xs text-slate-600">{PRIORITY_LABELS[task.priority] ?? task.priority}</span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {task.project ? (
                    <Link href={`/dashboard/projets/${task.project.id}`} className="text-blue-600 hover:underline text-xs">
                      {task.project.title}
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600 text-xs">
                  {task.assignedTo ? task.assignedTo.name : "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[task.status]}`}
                  >
                    {TASK_STATUS_LABELS[task.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600 text-xs">
                  {new Date(task.createdAt).toLocaleDateString("fr-FR")}
                </td>
                <td className="px-4 py-3 text-slate-600 text-xs">{task.estimatedActions ?? "—"}</td>
                <td className="px-4 py-3 text-center">
                  {task.actionsUsed != null && task.actionsUsed > 0 ? (
                    <span className="font-medium text-[#1d4ed8] text-xs">
                      {task.actionsUsed} action{task.actionsUsed > 1 ? "s" : ""}
                      {task.timeSpentMinutes != null && (
                        <span className="ml-1 text-slate-500">({task.timeSpentMinutes} min)</span>
                      )}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/dashboard/taches/${task.id}`}
                    className="text-blue-600 hover:underline text-xs"
                  >
                    Voir
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
