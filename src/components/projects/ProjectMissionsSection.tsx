"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { TASK_STATUS_LABELS, type TaskStatus } from "@/types";
import { missionTypeLabel } from "@/lib/tasks/mission-types";
import { CreateMissionForm } from "@/components/tasks/CreateMissionForm";
import { withReturnTo } from "@/lib/navigation/safe-return-to";

export type ChantierMissionRow = {
  id: string;
  title: string;
  status: string;
  priority: string | null;
  missionType: string | null;
  desiredDate: string | null;
  actionsUsed: number | null;
  estimatedActions: number | null;
  assignedTo: { id: string; name: string } | null;
};

type AgentOption = { id: string; name: string };

const statusColors: Partial<Record<TaskStatus, string>> = {
  NOUVEAU: "bg-slate-100 text-slate-800",
  EN_ATTENTE: "bg-amber-100 text-amber-800",
  ASSIGNEE: "bg-indigo-100 text-indigo-800",
  EN_COURS: "bg-blue-100 text-blue-800",
  EN_ATTENTE_INFO: "bg-amber-100 text-amber-800",
  A_VALIDER: "bg-violet-100 text-violet-800",
  COMPLETE: "bg-green-100 text-green-800",
};

function isOpenStatus(status: string) {
  return status !== "COMPLETE";
}

export function ProjectMissionsSection({
  projectId,
  projectTitle,
  clientId,
  clientName,
  missions,
  agents,
  canCreate = false,
}: {
  projectId: string;
  projectTitle: string;
  clientId: string;
  clientName: string;
  missions: ChantierMissionRow[];
  agents: AgentOption[];
  /** Staff interne autorisé à créer une tâche. */
  canCreate?: boolean;
}) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);

  const openMissions = missions.filter((m) => isOpenStatus(m.status));
  const allTasksHref = withReturnTo(
    `/dashboard/taches?projectId=${encodeURIComponent(projectId)}`,
    `/dashboard/projets/${projectId}#tab-taches`,
  );

  return (
    <div
      id="missions-chantier"
      className="scroll-mt-6 rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-5"
      data-testid="chantier-taches-panel"
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold tracking-tight text-[#1e3a5f] sm:text-lg">
            Tâches
            {openMissions.length > 0 ? (
              <span className="ml-2 tabular-nums text-slate-900">
                {openMissions.length} ouverte{openMissions.length > 1 ? "s" : ""}
              </span>
            ) : null}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Travail à faire sur ce chantier.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={allTasksHref}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-[#1e3a5f] hover:bg-slate-50"
          >
            Voir toutes les tâches
          </Link>
          {canCreate ? (
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="rounded-lg bg-[#1e3a5f] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#152a45]"
            >
              + Nouvelle tâche
            </button>
          ) : null}
        </div>
      </div>

      {missions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-10 text-center">
          <p className="text-sm font-medium text-slate-700">
            Aucune tâche pour ce chantier.
          </p>
          {canCreate ? (
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-[#1e3a5f] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#152a45]"
            >
              + Nouvelle tâche
            </button>
          ) : null}
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {missions.map((m) => (
            <li key={m.id}>
              <Link
                href={withReturnTo(
                  `/dashboard/taches/${m.id}`,
                  `/dashboard/projets/${projectId}#tab-taches`,
                )}
                className="flex min-h-[52px] items-start justify-between gap-3 py-3 hover:bg-slate-50/80"
              >
                <span className="min-w-0">
                  <span className="block text-[15px] font-semibold text-slate-900">
                    {m.title}
                  </span>
                  <span className="mt-0.5 block text-[13px] text-slate-500">
                    {[
                      m.assignedTo?.name,
                      TASK_STATUS_LABELS[m.status as TaskStatus] ?? m.status,
                      m.desiredDate
                        ? `échéance ${new Date(m.desiredDate).toLocaleDateString("fr-FR")}`
                        : null,
                      m.missionType ? missionTypeLabel(m.missionType) : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </span>
                <span
                  className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    statusColors[m.status as TaskStatus] ?? "bg-slate-100 text-slate-800"
                  }`}
                >
                  {TASK_STATUS_LABELS[m.status as TaskStatus] ?? m.status}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {createOpen && canCreate ? (
        <CreateMissionForm
          clients={[{ id: clientId, name: clientName, company: null }]}
          agents={agents}
          defaultClientId={clientId}
          defaultProjectId={projectId}
          defaultProjectTitle={projectTitle}
          defaultOpen
          hideTrigger
          onClose={() => setCreateOpen(false)}
          onSuccess={() => {
            setCreateOpen(false);
            router.refresh();
          }}
        />
      ) : null}
    </div>
  );
}
