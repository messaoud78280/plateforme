"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  MISSION_TYPES,
  MISSION_TYPE_LABELS,
  MISSION_TITLES_BY_TYPE,
  type MissionType,
} from "@/lib/tasks/mission-types";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";

type ClientOption = { id: string; name: string; company: string | null };
type AgentOption = { id: string; name: string };
type ProjectOption = { id: string; title: string; clientId: string };

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
    [projects, clientId],
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
          })),
        );
      })
      .catch(() => setProjects([]))
      .finally(() => setLoadingProjects(false));
  }, [open]);

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
        <Button type="button" onClick={() => setOpen(true)}>
          + Nouvelle tâche
        </Button>
      ) : null}

      <Drawer
        open={open}
        onClose={closeModal}
        dismissible={!loading}
        widthClass="max-w-lg"
        title="Créer une tâche"
        description={
          defaultProjectTitle
            ? `Liée au chantier « ${defaultProjectTitle} ».`
            : "La tâche apparaît dans « À assigner » si aucun responsable n'est choisi."
        }
        footer={
          clients.length === 0 ? null : (
            <div className="flex flex-wrap justify-end gap-2">
              <Button type="button" variant="secondary" disabled={loading} onClick={closeModal}>
                Annuler
              </Button>
              <Button type="submit" form="create-mission-form" disabled={loading}>
                {loading ? "Création…" : "Créer la mission"}
              </Button>
            </div>
          )
        }
      >
        {clients.length === 0 ? (
          <Alert tone="watch">Aucun client enregistré.</Alert>
        ) : (
          <form id="create-mission-form" onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <Select
              id="mission-client"
              label="Client *"
              required
              value={clientId}
              disabled={lockedClient}
              onChange={(e) => setClientId(e.target.value)}
            >
              <option value="">— Choisir un client —</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company ? `${c.name} — ${c.company}` : c.name}
                </option>
              ))}
            </Select>

            <Select
              id="mission-project"
              label="Chantier"
              value={projectId}
              disabled={lockedProject || !clientId || loadingProjects}
              onChange={(e) => setProjectId(e.target.value)}
            >
              <option value="">{loadingProjects ? "Chargement…" : "— Aucun chantier —"}</option>
              {clientProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </Select>

            <Select
              id="mission-type"
              label="Type de mission"
              value={missionType}
              onChange={(e) => setMissionType(e.target.value as MissionType | "")}
            >
              <option value="">— Choisir —</option>
              {MISSION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {MISSION_TYPE_LABELS[t]}
                </option>
              ))}
            </Select>

            <Input
              id="mission-title"
              label="Titre *"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <Textarea
              id="mission-desc"
              label="Description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-3">
              <Select
                id="mission-priority"
                label="Priorité"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="STANDARD">Standard</option>
                <option value="PRIORITAIRE">Prioritaire</option>
                <option value="URGENT">Urgent</option>
              </Select>
              <Input
                id="mission-date"
                label="Échéance"
                type="date"
                value={desiredDate}
                onChange={(e) => setDesiredDate(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                id="mission-est"
                label="Actions estimées"
                type="number"
                min={0}
                value={estimatedActions}
                onChange={(e) => setEstimatedActions(e.target.value)}
                placeholder="Ex. 2"
              />
              <Select
                id="mission-agent"
                label="Agent"
                value={assignedToId}
                onChange={(e) => setAssignedToId(e.target.value)}
              >
                <option value="">— À assigner —</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </Select>
            </div>

            <Textarea
              id="mission-notes"
              label="Notes internes"
              rows={2}
              value={agencyNotes}
              onChange={(e) => setAgencyNotes(e.target.value)}
            />

            {error ? <Alert tone="critical">{error}</Alert> : null}
          </form>
        )}
      </Drawer>
    </>
  );
}
