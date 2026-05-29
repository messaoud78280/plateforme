"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { TASK_STATUS_LABELS, type TaskStatus } from "@/types";
import { missionTypeLabel } from "@/lib/tasks/mission-types";
import { CreateMissionForm } from "@/components/tasks/CreateMissionForm";

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

function countByStatus(missions: ChantierMissionRow[], statuses: string[]) {
  return missions.filter((m) => statuses.includes(m.status)).length;
}

export function ProjectMissionsSection({
  projectId,
  projectTitle,
  clientId,
  clientName,
  missions,
  agents,
  isAgence,
}: {
  projectId: string;
  projectTitle: string;
  clientId: string;
  clientName: string;
  missions: ChantierMissionRow[];
  agents: AgentOption[];
  isAgence: boolean;
}) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);

  if (!isAgence) {
    if (missions.length === 0) return null;
    return (
      <div className="rounded-xl surface-metallic-light p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">Missions liées au chantier</h2>
        <ul className="space-y-2">
          {missions.map((m) => (
            <li key={m.id}>
              <Link href={`/dashboard/taches/${m.id}`} className="text-sm font-medium text-blue-600 hover:underline">
                {m.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const enCours = countByStatus(missions, ["ASSIGNEE", "EN_ANALYSE", "EN_COURS", "EN_ATTENTE_INFO"]);
  const aValider = countByStatus(missions, ["A_VALIDER"]);
  const terminees = countByStatus(missions, ["COMPLETE"]);

  return (
    <div id="missions-chantier" className="scroll-mt-6 rounded-xl border border-[#1d4ed8]/20 bg-white p-6 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Missions liées au chantier</h2>
          <p className="mt-1 text-sm text-slate-600">
            Pilotez le travail BeWork sur ce dossier — {missions.length} mission{missions.length !== 1 ? "s" : ""}.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="rounded-lg bg-[#1d4ed8] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1e40af]"
        >
          + Créer une mission liée à ce chantier
        </button>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg bg-slate-50 px-3 py-2 text-center">
          <p className="text-xl font-bold text-slate-800">{missions.length}</p>
          <p className="text-xs text-slate-500">Total</p>
        </div>
        <div className="rounded-lg bg-blue-50 px-3 py-2 text-center">
          <p className="text-xl font-bold text-blue-800">{enCours}</p>
          <p className="text-xs text-blue-700">En cours</p>
        </div>
        <div className="rounded-lg bg-violet-50 px-3 py-2 text-center">
          <p className="text-xl font-bold text-violet-800">{aValider}</p>
          <p className="text-xs text-violet-700">À valider</p>
        </div>
        <div className="rounded-lg bg-green-50 px-3 py-2 text-center">
          <p className="text-xl font-bold text-green-800">{terminees}</p>
          <p className="text-xs text-green-700">Terminées</p>
        </div>
      </div>

      {missions.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-200 py-8 text-center text-sm text-slate-500">
          Aucune mission sur ce chantier. Créez la première pour lancer le travail BeWork.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <th className="pb-2 pr-3 font-semibold">Mission</th>
                <th className="pb-2 pr-3 font-semibold">Type</th>
                <th className="pb-2 pr-3 font-semibold">Agent</th>
                <th className="pb-2 pr-3 font-semibold">Statut</th>
                <th className="pb-2 pr-3 font-semibold">Échéance</th>
                <th className="pb-2 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {missions.map((m) => (
                <tr key={m.id} className="border-b border-slate-100 hover:bg-slate-50/80">
                  <td className="py-3 pr-3">
                    <Link href={`/dashboard/taches/${m.id}`} className="font-medium text-slate-800 hover:text-[#1d4ed8] hover:underline">
                      {m.title}
                    </Link>
                  </td>
                  <td className="py-3 pr-3 text-xs text-slate-600">{missionTypeLabel(m.missionType)}</td>
                  <td className="py-3 pr-3 text-xs text-slate-600">{m.assignedTo?.name ?? "—"}</td>
                  <td className="py-3 pr-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[m.status as TaskStatus] ?? "bg-slate-100 text-slate-800"}`}>
                      {TASK_STATUS_LABELS[m.status as TaskStatus] ?? m.status}
                    </span>
                  </td>
                  <td className="py-3 pr-3 text-xs text-slate-600">
                    {m.desiredDate ? new Date(m.desiredDate).toLocaleDateString("fr-FR") : "—"}
                  </td>
                  <td className="py-3 text-xs text-slate-600">
                    {m.actionsUsed != null ? `${m.actionsUsed} cons.` : m.estimatedActions != null ? `${m.estimatedActions} est.` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {createOpen ? (
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
