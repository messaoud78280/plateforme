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
  project?: { id: string; title: string } | null;
  assignedTo?: { id: string; name: string; email: string } | null;
}

interface TaskListViewProps {
  tasks: TaskItem[];
}

const statusColors: Record<TaskStatus, string> = {
  EN_COURS: "bg-blue-100 text-blue-800",
  COMPLETE: "bg-green-100 text-green-800",
  EN_ATTENTE: "bg-amber-100 text-amber-800",
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
              <th className="px-4 py-3 font-semibold text-slate-800">Nom</th>
              <th className="px-4 py-3 font-semibold text-slate-800">Projet</th>
              <th className="px-4 py-3 font-semibold text-slate-800">Référent</th>
              <th className="px-4 py-3 font-semibold text-slate-800">Statut</th>
              <th className="px-4 py-3 font-semibold text-slate-800">Création</th>
              <th className="px-4 py-3 font-semibold text-slate-800">Fin</th>
              <th className="px-4 py-3 font-semibold text-slate-800">Actions</th>
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
                <td className="px-4 py-3 text-slate-600">
                  {task.project ? (
                    <Link href={`/dashboard/projets/${task.project.id}`} className="text-blue-600 hover:underline">
                      {task.project.title}
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {task.assignedTo ? (
                    <span className="font-medium text-slate-800">{task.assignedTo.name}</span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[task.status]}`}
                  >
                    {TASK_STATUS_LABELS[task.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {new Date(task.createdAt).toLocaleDateString("fr-FR")}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {task.completedAt
                    ? new Date(task.completedAt).toLocaleDateString("fr-FR")
                    : "—"}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/dashboard/taches/${task.id}`}
                    className="text-blue-600 hover:underline"
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
