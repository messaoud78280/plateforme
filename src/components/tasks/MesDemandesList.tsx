"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

export type DemandeStatusFilter = "toutes" | "en_cours" | "en_attente_info" | "terminees";

type TaskItem = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  createdAt: Date;
  actionsUsed: number | null;
  estimatedActions: string | null;
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
  EN_ATTENTE_INFO: { label: "En attente d'info", className: "bg-amber-100 text-amber-800" },
  A_VALIDER: { label: "À valider", className: "bg-violet-100 text-violet-800" },
  COMPLETE: { label: "Terminée", className: "bg-green-100 text-green-700" },
  EN_ATTENTE_CLIENT: { label: "En attente client", className: "bg-amber-100 text-amber-800" },
};

const PROGRESS_STEPS = ["Reçue", "En cours", "À valider", "Terminé"];

function getStatusBadge(task: TaskItem) {
  if (task.status === "COMPLETE") return STATUS_BADGES.COMPLETE;
  if (task.status === "A_VALIDER") return STATUS_BADGES.A_VALIDER;
  if (task.status === "EN_COURS" && task.correctionNote) return STATUS_BADGES.EN_ATTENTE_CLIENT;
  return STATUS_BADGES[task.status] ?? STATUS_BADGES.NOUVEAU;
}

function getProgressIndex(task: TaskItem): number {
  if (task.status === "COMPLETE") return 3;
  if (["EN_COURS", "EN_ANALYSE", "ASSIGNEE", "EN_ATTENTE_INFO"].includes(task.status)) return 2;
  if (task.status === "A_VALIDER") return 2;
  return 0;
}

interface MesDemandesListProps {
  tasks: TaskItem[];
}

export function MesDemandesList({ tasks }: MesDemandesListProps) {
  const [filter, setFilter] = useState<DemandeStatusFilter>("toutes");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let list = tasks;
    if (filter === "en_cours") {
      list = list.filter((t) =>
        ["EN_COURS", "EN_ANALYSE", "ASSIGNEE", "EN_ATTENTE_INFO", "A_VALIDER"].includes(t.status)
      );
    } else if (filter === "en_attente_info") {
      list = list.filter((t) => t.status === "EN_COURS" && t.correctionNote);
    } else if (filter === "terminees") {
      list = list.filter((t) => t.status === "COMPLETE");
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q))
      );
    }
    return list;
  }, [tasks, filter, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { id: "toutes" as const, label: "Toutes" },
              { id: "en_cours" as const, label: "En cours" },
              { id: "en_attente_info" as const, label: "En attente d'information" },
              { id: "terminees" as const, label: "Terminées" },
            ] as const
          ).map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                filter === id
                  ? "bg-[#1d4ed8] text-white"
                  : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="w-full sm:w-64">
          <input
            type="search"
            placeholder="Rechercher une demande..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm placeholder:text-slate-400 focus:border-[#1d4ed8] focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]/20"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <p className="text-slate-500">Aucune demande ne correspond à vos critères.</p>
          <Link
            href="/dashboard/nouvelle-demande"
            className="mt-4 inline-block rounded-lg bg-[#1d4ed8] px-4 py-2 text-sm font-medium text-white hover:bg-[#1e40af]"
          >
            Nouvelle demande
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {filtered.map((task) => {
            const badge = getStatusBadge(task);
            const progressIndex = getProgressIndex(task);
            const projectId = task.project?.id;
            const messagerieUrl = projectId
              ? `/dashboard/messagerie?project=${projectId}`
              : "/dashboard/messagerie";
            return (
              <li
                key={task.id}
                className="rounded-2xl surface-metallic-light p-5 transition hover:shadow"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-slate-800">
                        <Link
                          href={`/dashboard/taches/${task.id}`}
                          className="hover:text-[#1d4ed8] hover:underline"
                        >
                          {task.title}
                        </Link>
                      </h3>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                      <span>{task.assignedTo?.name ?? "—"} (assistant)</span>
                      <span>{new Date(task.createdAt).toLocaleDateString("fr-FR")}</span>
                      <span>
                        {task.actionsUsed != null
                          ? `${task.actionsUsed} action(s) consommées`
                          : task.estimatedActions ?? "—"}
                      </span>
                    </div>
                    <div className="mt-3 flex gap-1">
                      {PROGRESS_STEPS.map((step, i) => (
                        <span
                          key={step}
                          className={`rounded px-2 py-0.5 text-xs font-medium ${
                            i <= progressIndex ? "bg-[#1d4ed8]/10 text-[#1d4ed8]" : "bg-slate-100 text-slate-400"
                          }`}
                        >
                          {step}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <Link
                      href={`/dashboard/taches/${task.id}`}
                      className="rounded-lg bg-[#1d4ed8] px-4 py-2 text-sm font-medium text-white hover:bg-[#1e40af]"
                    >
                      Voir détail
                    </Link>
                    <Link
                      href={`/dashboard/taches/${task.id}#documents`}
                      className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Ajouter document
                    </Link>
                    <Link
                      href={messagerieUrl}
                      className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Message
                    </Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
