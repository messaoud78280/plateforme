"use client";

import Link from "next/link";
import { TASK_STATUS_LABELS, type TaskStatus } from "@/types";
import { DeleteTaskButton } from "./DeleteTaskButton";
import { ClientCreditsBadge } from "@/components/clients/ClientCreditsBadge";

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

const PRIORITY_COLORS: Record<string, string> = {
  STANDARD: "bg-slate-100 text-slate-700",
  PRIORITAIRE: "bg-amber-100 text-amber-800",
  URGENT: "bg-red-100 text-red-800",
};

type MissionItem = {
  id: string;
  title: string;
  status: string;
  priority: string | null;
  createdAt: Date;
  client: { id: string; name: string };
};

interface AgentMissionsListProps {
  missions: MissionItem[];
}

export function AgentMissionsList({ missions }: AgentMissionsListProps) {
  if (missions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <p className="text-slate-600">Aucune mission assignée pour le moment.</p>
        <p className="mt-2 text-sm text-slate-500">
          La gérante vous attribuera des missions. Consultez le tableau de bord pour une vue d&apos;ensemble.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {missions.map((m) => (
        <div
          key={m.id}
          className="flex flex-wrap items-center justify-between gap-4 rounded-xl surface-metallic-light p-4 transition hover:border-slate-300"
        >
          <div className="min-w-0 flex-1">
            <Link
              href={`/dashboard/taches/${m.id}`}
              className="font-semibold text-slate-800 hover:text-blue-600 hover:underline"
            >
              {m.title}
            </Link>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-slate-600">
              <span>Client : {m.client.name}</span>
              <ClientCreditsBadge clientId={m.client.id} compact />
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  PRIORITY_COLORS[m.priority ?? "STANDARD"] ?? PRIORITY_COLORS.STANDARD
                }`}
              >
                {m.priority === "URGENT" ? "Urgent" : m.priority === "PRIORITAIRE" ? "Prioritaire" : "Normal"}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  STATUS_COLORS[m.status as TaskStatus] ?? STATUS_COLORS.NOUVEAU
                }`}
              >
                {TASK_STATUS_LABELS[m.status as TaskStatus] ?? m.status}
              </span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href={`/dashboard/taches/${m.id}`}
              className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Ouvrir mission
            </Link>
            <DeleteTaskButton taskId={m.id} />
          </div>
        </div>
      ))}
    </div>
  );
}
