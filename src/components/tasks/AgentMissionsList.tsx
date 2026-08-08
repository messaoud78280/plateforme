"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { TASK_STATUS_LABELS, type TaskStatus } from "@/types";
import { DeleteTaskButton } from "./DeleteTaskButton";
import { ClientCreditsBadge } from "@/components/clients/ClientCreditsBadge";
import { missionTypeLabel } from "@/lib/tasks/mission-types";
import {
  coerceTaskPriority,
  priorityLabel,
  sortByPriorityThenDate,
  TASK_PRIORITY_BADGE,
  TASK_PRIORITY_BORDER,
} from "@/lib/tasks/priority";

const STATUS_COLORS: Record<string, string> = {
  NOUVEAU: "bg-slate-100 text-slate-800",
  EN_ATTENTE: "bg-amber-100 text-amber-800",
  ASSIGNEE: "bg-indigo-100 text-indigo-800",
  EN_ANALYSE: "bg-blue-100 text-blue-800",
  EN_COURS: "bg-blue-100 text-blue-800",
  EN_ATTENTE_INFO: "bg-amber-100 text-amber-800",
  A_VALIDER: "bg-violet-100 text-violet-800",
  COMPLETE: "bg-green-100 text-green-800",
};

type MissionItem = {
  id: string;
  title: string;
  status: string;
  priority: string | null;
  missionType?: string | null;
  desiredDate?: Date | string | null;
  createdAt: Date | string;
  updatedAt?: Date | string | null;
  client: { id: string; name: string };
  project?: { id: string; title: string } | null;
};

type StatusFilter = "toutes" | "actives" | "a_valider" | "info" | "terminees";
type PriorityFilter = "toutes" | "URGENT" | "PRIORITAIRE" | "STANDARD";
type SortMode = "priorite" | "recent" | "echeance";

interface AgentMissionsListProps {
  missions: MissionItem[];
}

function formatShortDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

export function AgentMissionsList({ missions }: AgentMissionsListProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("actives");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("toutes");
  const [sort, setSort] = useState<SortMode>("priorite");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let list = missions;
    if (statusFilter === "actives") {
      list = list.filter((m) => m.status !== "COMPLETE");
    } else if (statusFilter === "a_valider") {
      list = list.filter((m) => m.status === "A_VALIDER");
    } else if (statusFilter === "info") {
      list = list.filter((m) => m.status === "EN_ATTENTE_INFO");
    } else if (statusFilter === "terminees") {
      list = list.filter((m) => m.status === "COMPLETE");
    }
    if (priorityFilter !== "toutes") {
      list = list.filter((m) => coerceTaskPriority(m.priority) === priorityFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.client.name.toLowerCase().includes(q) ||
          (m.project?.title && m.project.title.toLowerCase().includes(q)),
      );
    }
    if (sort === "priorite") return sortByPriorityThenDate(list, "asc");
    if (sort === "echeance") {
      return [...list].sort((a, b) => {
        const da = a.desiredDate ? new Date(a.desiredDate).getTime() : Number.POSITIVE_INFINITY;
        const db = b.desiredDate ? new Date(b.desiredDate).getTime() : Number.POSITIVE_INFINITY;
        return da - db;
      });
    }
    return [...list].sort(
      (a, b) =>
        new Date(b.updatedAt ?? b.createdAt).getTime() -
        new Date(a.updatedAt ?? a.createdAt).getTime(),
    );
  }, [missions, statusFilter, priorityFilter, sort, search]);

  const urgentCount = missions.filter(
    (m) => m.status !== "COMPLETE" && coerceTaskPriority(m.priority) === "URGENT",
  ).length;

  if (missions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <p className="text-slate-600">Aucune mission assignée pour le moment.</p>
        <p className="mt-2 text-sm text-slate-500">
          La direction vous attribuera des missions. Consultez le tableau de bord pour une vue d&apos;ensemble.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { id: "actives" as const, label: "Actives" },
              { id: "toutes" as const, label: "Toutes" },
              { id: "info" as const, label: "Info requise" },
              { id: "a_valider" as const, label: "À valider" },
              { id: "terminees" as const, label: "Terminées" },
            ] as const
          ).map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setStatusFilter(id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                statusFilter === id
                  ? "bg-[#1e3a5f] text-white"
                  : "border border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              {label}
            </button>
          ))}
          {urgentCount > 0 ? (
            <button
              type="button"
              onClick={() => {
                setStatusFilter("actives");
                setPriorityFilter("URGENT");
              }}
              className="ml-auto rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white"
            >
              {urgentCount} urgente{urgentCount > 1 ? "s" : ""}
            </button>
          ) : null}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as PriorityFilter)}
            className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-medium text-slate-700"
          >
            <option value="toutes">Priorité : toutes</option>
            <option value="URGENT">Urgent</option>
            <option value="PRIORITAIRE">Prioritaire</option>
            <option value="STANDARD">Normal</option>
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortMode)}
            className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-medium text-slate-700"
          >
            <option value="priorite">Trier : priorité</option>
            <option value="echeance">Trier : échéance</option>
            <option value="recent">Trier : récentes</option>
          </select>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher…"
            className="min-w-[160px] flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Aucune mission pour ce filtre.
        </div>
      ) : (
        filtered.map((m) => {
          const prio = coerceTaskPriority(m.priority);
          return (
            <div
              key={m.id}
              className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 border-l-4 bg-white p-4 shadow-sm ${TASK_PRIORITY_BORDER[prio]}`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/dashboard/taches/${m.id}`}
                    className="font-semibold text-[#1e3a5f] hover:underline"
                  >
                    {m.title}
                  </Link>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${TASK_PRIORITY_BADGE[prio]}`}>
                    {priorityLabel(prio)}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      STATUS_COLORS[m.status as TaskStatus] ?? STATUS_COLORS.NOUVEAU
                    }`}
                  >
                    {TASK_STATUS_LABELS[m.status as TaskStatus] ?? m.status}
                  </span>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                  <span>Client : {m.client.name}</span>
                  <ClientCreditsBadge clientId={m.client.id} compact />
                  {m.missionType ? <span>{missionTypeLabel(m.missionType)}</span> : null}
                  {m.desiredDate ? <span>Échéance {formatShortDate(m.desiredDate)}</span> : null}
                  {m.project ? (
                    <Link href={`/dashboard/projets/${m.project.id}`} className="font-medium text-[#1e3a5f] hover:underline">
                      {m.project.title}
                    </Link>
                  ) : null}
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <Link
                  href={`/dashboard/messagerie?task=${encodeURIComponent(m.id)}`}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Message
                </Link>
                <Link
                  href={`/dashboard/taches/${m.id}`}
                  className="rounded-lg bg-[#1e3a5f] px-3 py-2 text-xs font-semibold text-white hover:bg-[#152a45]"
                >
                  Ouvrir
                </Link>
                <DeleteTaskButton taskId={m.id} />
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
