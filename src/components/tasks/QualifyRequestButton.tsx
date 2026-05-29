"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MISSION_TYPES,
  MISSION_TYPE_LABELS,
  type MissionType,
} from "@/lib/tasks/mission-types";

type ProjectOption = { id: string; title: string; clientId?: string };
type AgentOption = { id: string; name: string };

const fieldClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-[#1d4ed8] focus:outline-none focus:ring-1 focus:ring-[#1d4ed8]";

export function QualifyRequestButton({
  taskId,
  clientId,
  projects,
  agents,
}: {
  taskId: string;
  clientId: string;
  projects: ProjectOption[];
  agents: AgentOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [projectId, setProjectId] = useState("");
  const [missionType, setMissionType] = useState<MissionType | "">("");
  const [assignedToId, setAssignedToId] = useState("");
  const [priority, setPriority] = useState("STANDARD");
  const [estimatedActions, setEstimatedActions] = useState("");
  const [agencyNotes, setAgencyNotes] = useState("");

  const clientProjects = projects.filter(
    (p) => !p.clientId || p.clientId === clientId
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/tasks/${taskId}/qualify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: projectId || null,
          missionType: missionType || undefined,
          assignedToId: assignedToId || null,
          priority,
          estimatedActions: estimatedActions ? Number(estimatedActions) : null,
          agencyNotes: agencyNotes.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error ?? "Qualification impossible.");
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setError("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-violet-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-violet-700"
      >
        Transformer en mission
      </button>

      {open ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center px-4">
          <button type="button" className="absolute inset-0 bg-black/40" onClick={() => !loading && setOpen(false)} aria-label="Fermer" />
          <div className="relative w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
            <h3 className="text-base font-semibold text-slate-900">Qualifier la demande client</h3>
            <p className="mt-1 text-xs text-slate-600">Rattachez un chantier, un type et un agent pour lancer la mission.</p>
            <form onSubmit={(e) => void handleSubmit(e)} className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Chantier</label>
                <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className={fieldClass}>
                  <option value="">— Sans chantier —</option>
                  {clientProjects.map((p) => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Type de mission</label>
                <select value={missionType} onChange={(e) => setMissionType(e.target.value as MissionType | "")} className={fieldClass}>
                  <option value="">— Choisir —</option>
                  {MISSION_TYPES.map((t) => (
                    <option key={t} value={t}>{MISSION_TYPE_LABELS[t]}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Priorité</label>
                  <select value={priority} onChange={(e) => setPriority(e.target.value)} className={fieldClass}>
                    <option value="STANDARD">Standard</option>
                    <option value="PRIORITAIRE">Prioritaire</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Actions est.</label>
                  <input type="number" min={0} value={estimatedActions} onChange={(e) => setEstimatedActions(e.target.value)} className={fieldClass} />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Agent</label>
                <select value={assignedToId} onChange={(e) => setAssignedToId(e.target.value)} className={fieldClass}>
                  <option value="">— À assigner —</option>
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Notes internes</label>
                <textarea rows={2} value={agencyNotes} onChange={(e) => setAgencyNotes(e.target.value)} className={fieldClass} />
              </div>
              {error ? <p className="text-xs text-red-600">{error}</p> : null}
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" disabled={loading} onClick={() => setOpen(false)} className="rounded-lg border px-3 py-1.5 text-sm text-slate-700">
                  Annuler
                </button>
                <button type="submit" disabled={loading} className="rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50">
                  {loading ? "…" : "Valider"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
