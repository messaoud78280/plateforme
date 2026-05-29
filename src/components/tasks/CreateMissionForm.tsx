"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  MISSION_TYPES,
  MISSION_TYPE_LABELS,
  MISSION_TITLES_BY_TYPE,
  type MissionType,
} from "@/lib/tasks/mission-types";

type ClientOption = { id: string; name: string; company: string | null };
type AgentOption = { id: string; name: string };
type ProjectOption = { id: string; title: string; clientId: string };

const fieldClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#1d4ed8] focus:ring-2 focus:ring-[#1d4ed8]/20";

type CreateMissionFormProps = {
  clients: ClientOption[];
  agents: AgentOption[];
  defaultClientId?: string;
  defaultProjectId?: string;
  defaultProjectTitle?: string;
  defaultOpen?: boolean;
  hideTrigger?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
};

export function CreateMissionForm({
  clients,
  agents,
  defaultClientId = "",
  defaultProjectId = "",
  defaultProjectTitle,
  defaultOpen = false,
  hideTrigger = false,
  onClose,
  onSuccess,
}: CreateMissionFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(defaultOpen);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [clientId, setClientId] = useState(defaultClientId);
  const [projectId, setProjectId] = useState(defaultProjectId);
  const [missionType, setMissionType] = useState<MissionType | "">("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedToId, setAssignedToId] = useState("");
  const [agencyNotes, setAgencyNotes] = useState("");
  const [desiredDate, setDesiredDate] = useState("");
  const [priority, setPriority] = useState("STANDARD");
  const [estimatedActions, setEstimatedActions] = useState("");
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  const clientProjects = useMemo(
    () => projects.filter((p) => p.clientId === clientId),
    [projects, clientId]
  );

  const lockedClient = Boolean(defaultClientId);
  const lockedProject = Boolean(defaultProjectId);

  useEffect(() => {
    setOpen(defaultOpen);
  }, [defaultOpen]);

  useEffect(() => {
    if (!open) return;
    setLoadingProjects(true);
    fetch("/api/projets")
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setProjects(
          list.map((p: { id: string; title: string; clientId?: string; client?: { id: string } }) => ({
            id: p.id,
            title: p.title,
            clientId: p.clientId ?? p.client?.id ?? "",
          }))
        );
      })
      .catch(() => setProjects([]))
      .finally(() => setLoadingProjects(false));
  }, [open]);

  useEffect(() => {
    if (defaultClientId) setClientId(defaultClientId);
    if (defaultProjectId) setProjectId(defaultProjectId);
  }, [defaultClientId, defaultProjectId]);

  useEffect(() => {
    if (!lockedProject) setProjectId("");
  }, [clientId, lockedProject]);

  useEffect(() => {
    if (missionType && MISSION_TITLES_BY_TYPE[missionType] && !title.trim()) {
      setTitle(MISSION_TITLES_BY_TYPE[missionType]!);
    }
  }, [missionType, title]);

  function closeModal() {
    if (loading) return;
    setOpen(false);
    onClose?.();
  }

  function resetForm() {
    if (!lockedClient) setClientId("");
    if (!lockedProject) setProjectId("");
    setMissionType("");
    setTitle("");
    setDescription("");
    setAssignedToId("");
    setAgencyNotes("");
    setDesiredDate("");
    setPriority("STANDARD");
    setEstimatedActions("");
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!clientId) {
      setError("Sélectionnez un client.");
      return;
    }
    if (!title.trim()) {
      setError("Indiquez un titre pour la mission.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/tasks/manager", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          title: title.trim(),
          description: description.trim() || undefined,
          projectId: projectId || undefined,
          assignedToId: assignedToId || undefined,
          agencyNotes: agencyNotes.trim() || undefined,
          desiredDate: desiredDate || undefined,
          missionType: missionType || undefined,
          priority: priority || undefined,
          estimatedActions: estimatedActions ? Number(estimatedActions) : undefined,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Impossible de créer la mission.");
        return;
      }
      closeModal();
      resetForm();
      onSuccess?.();
      router.refresh();
    } catch {
      setError("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {!hideTrigger ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center rounded-lg bg-[#1d4ed8] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#1e40af]"
        >
          + Nouvelle mission
        </button>
      ) : null}

      {open ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center px-4 py-6" role="dialog" aria-modal="true">
          <button type="button" className="absolute inset-0 bg-black/40" onClick={closeModal} aria-label="Fermer" />
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-semibold text-slate-900">Créer une mission</h2>
            <p className="mt-1 text-sm text-slate-600">
              {defaultProjectTitle
                ? `Liée au chantier « ${defaultProjectTitle} ».`
                : "La mission apparaît dans « À assigner » si aucun agent n'est choisi."}
            </p>

            {clients.length === 0 ? (
              <p className="mt-4 text-sm text-amber-800">Aucun client enregistré.</p>
            ) : (
              <form onSubmit={(e) => void handleSubmit(e)} className="mt-5 space-y-4">
                <div>
                  <label htmlFor="mission-client" className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                    Client *
                  </label>
                  <select
                    id="mission-client"
                    required
                    value={clientId}
                    disabled={lockedClient}
                    onChange={(e) => setClientId(e.target.value)}
                    className={fieldClass}
                  >
                    <option value="">— Choisir un client —</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.company ? `${c.name} — ${c.company}` : c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="mission-project" className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                    Chantier
                  </label>
                  <select
                    id="mission-project"
                    value={projectId}
                    disabled={lockedProject || !clientId || loadingProjects}
                    onChange={(e) => setProjectId(e.target.value)}
                    className={fieldClass}
                  >
                    <option value="">{loadingProjects ? "Chargement…" : "— Aucun chantier —"}</option>
                    {clientProjects.map((p) => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="mission-type" className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                    Type de mission
                  </label>
                  <select
                    id="mission-type"
                    value={missionType}
                    onChange={(e) => setMissionType(e.target.value as MissionType | "")}
                    className={fieldClass}
                  >
                    <option value="">— Choisir —</option>
                    {MISSION_TYPES.map((t) => (
                      <option key={t} value={t}>{MISSION_TYPE_LABELS[t]}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="mission-title" className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                    Titre *
                  </label>
                  <input id="mission-title" required value={title} onChange={(e) => setTitle(e.target.value)} className={fieldClass} />
                </div>

                <div>
                  <label htmlFor="mission-desc" className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                    Description
                  </label>
                  <textarea id="mission-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className={fieldClass} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="mission-priority" className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                      Priorité
                    </label>
                    <select id="mission-priority" value={priority} onChange={(e) => setPriority(e.target.value)} className={fieldClass}>
                      <option value="STANDARD">Standard</option>
                      <option value="PRIORITAIRE">Prioritaire</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="mission-date" className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                      Échéance
                    </label>
                    <input id="mission-date" type="date" value={desiredDate} onChange={(e) => setDesiredDate(e.target.value)} className={fieldClass} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="mission-est" className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                      Actions estimées
                    </label>
                    <input
                      id="mission-est"
                      type="number"
                      min={0}
                      value={estimatedActions}
                      onChange={(e) => setEstimatedActions(e.target.value)}
                      className={fieldClass}
                      placeholder="Ex. 2"
                    />
                  </div>
                  <div>
                    <label htmlFor="mission-agent" className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                      Agent
                    </label>
                    <select id="mission-agent" value={assignedToId} onChange={(e) => setAssignedToId(e.target.value)} className={fieldClass}>
                      <option value="">— À assigner —</option>
                      {agents.map((a) => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="mission-notes" className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                    Notes internes
                  </label>
                  <textarea id="mission-notes" rows={2} value={agencyNotes} onChange={(e) => setAgencyNotes(e.target.value)} className={fieldClass} />
                </div>

                {error ? <p className="text-sm text-red-600">{error}</p> : null}

                <div className="flex flex-wrap justify-end gap-2 pt-2">
                  <button type="button" disabled={loading} onClick={closeModal} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                    Annuler
                  </button>
                  <button type="submit" disabled={loading} className="rounded-lg bg-[#1d4ed8] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1e40af] disabled:opacity-50">
                    {loading ? "Création…" : "Créer la mission"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
