"use client";

import { useState } from "react";
import Link from "next/link";
import { TASK_STATUS_LABELS, type TaskStatus } from "@/types";
import { TaskTimeline } from "./TaskTimeline";

interface TaskDetailViewProps {
  task: {
    id: string;
    title: string;
    description: string | null;
    status: TaskStatus;
    completedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    assignedToId?: string | null;
    agencyNotes?: string | null;
    correctionNote?: string | null;
    validatedAt?: Date | null;
    assignedTo?: { id: string; name: string; email: string } | null;
    project?: { id: string; title: string } | null;
    documents?: { id: string; name: string; fileUrl: string; fileSize: number; mimeType: string | null }[];
  };
  onStatusChange?: (newStatus: TaskStatus) => void;
  isAgence?: boolean;
  agents?: { id: string; name: string; email: string }[];
  onAssign?: (assignedToId: string | null) => void;
  onAgencyNotesChange?: (notes: string) => void;
  onValidate?: () => void;
  onRequestCorrection?: () => void;
  correctionNoteInput?: string;
  onCorrectionNoteChange?: (value: string) => void;
}

const statusColors: Record<TaskStatus, string> = {
  EN_COURS: "bg-blue-100 text-blue-800",
  COMPLETE: "bg-green-100 text-green-800",
  EN_ATTENTE: "bg-amber-100 text-amber-800",
};

export function TaskDetailView({
  task,
  onStatusChange,
  isAgence,
  agents = [],
  onAssign,
  onAgencyNotesChange,
  onValidate,
  onRequestCorrection,
  correctionNoteInput = "",
  onCorrectionNoteChange,
}: TaskDetailViewProps) {
  const [agencyNotesLocal, setAgencyNotesLocal] = useState(task.agencyNotes ?? "");
  const [savingNotes, setSavingNotes] = useState(false);

  const timelineEvents = [
    { label: "Création", date: task.createdAt },
    ...(task.completedAt
      ? [{ label: "Terminée", date: task.completedAt, detail: "Tâche clôturée" }]
      : []),
    ...(task.validatedAt
      ? [{ label: "Validée", date: task.validatedAt, detail: "Travail validé par l'agence" }]
      : []),
  ];

  const handleSaveNotes = () => {
    if (onAgencyNotesChange) {
      setSavingNotes(true);
      onAgencyNotesChange(agencyNotesLocal);
      setSavingNotes(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{task.title}</h1>
            <span
              className={`mt-2 inline-flex rounded-full px-3 py-1 text-sm font-medium ${statusColors[task.status]}`}
            >
              {TASK_STATUS_LABELS[task.status]}
            </span>
            {task.validatedAt && (
              <span className="ml-2 inline-flex rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                Validé
              </span>
            )}
          </div>
          <div className="text-right text-sm text-slate-500">
            {task.assignedTo && (
              <p className="font-medium text-slate-700">{isAgence ? "Agent en charge :" : "Votre référent :"} {task.assignedTo.name}</p>
            )}
            <p>Créée le {new Date(task.createdAt).toLocaleDateString("fr-FR")}</p>
            {task.completedAt && (
              <p>Terminée le {new Date(task.completedAt).toLocaleDateString("fr-FR")}</p>
            )}
          </div>
        </div>
        {task.project && (
          <p className="mt-2 text-sm text-slate-600">
            Projet :{" "}
            <Link href={`/dashboard/projets/${task.project.id}`} className="font-medium text-blue-600 hover:underline">
              {task.project.title}
            </Link>
          </p>
        )}
        {task.description && (
          <p className="mt-4 text-slate-600">{task.description}</p>
        )}
      </div>

      {/* Pièces jointes déposées avec la tâche */}
      {task.documents && task.documents.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">Pièces jointes ({task.documents.length})</h2>
          <ul className="space-y-2">
            {task.documents.map((doc) => (
              <li
                key={doc.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
              >
                <span className="min-w-0 truncate text-sm text-slate-800">{doc.name}</span>
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-sm font-medium text-blue-600 hover:underline"
                >
                  Télécharger
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Agent en charge de la tâche — bloc visible pour l'agence (édition) */}
      {isAgence && (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">Agent en charge de la tâche</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Assigner un agent à cette tâche</label>
              <select
                value={task.assignedToId ?? ""}
                onChange={(e) => onAssign?.(e.target.value || null)}
                className="w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">— Non assigné —</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.email})
                  </option>
                ))}
              </select>
              {task.assignedTo && (
                <p className="mt-1 text-sm text-slate-500">
                  Actuellement : {task.assignedTo.name}
                </p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Notes pour l'agent</label>
              <textarea
                value={agencyNotesLocal}
                onChange={(e) => setAgencyNotesLocal(e.target.value)}
                onBlur={handleSaveNotes}
                rows={3}
                placeholder="Consignes, rappels, priorités..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleSaveNotes}
                disabled={savingNotes}
                className="mt-2 rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
              >
                {savingNotes ? "Enregistrement…" : "Enregistrer les notes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Votre référent (client) */}
      {task.assignedTo && !isAgence && (
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
          <h2 className="mb-2 text-base font-semibold text-slate-800">Votre référent</h2>
          <p className="text-sm text-slate-700">
            <span className="font-semibold text-slate-800">{task.assignedTo.name}</span>
            {task.assignedTo.email && (
              <span className="text-slate-600"> — {task.assignedTo.email}</span>
            )}
          </p>
          {task.assignedTo.email && (
            <a
              href={`mailto:${task.assignedTo.email}`}
              className="mt-3 inline-block rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              Contacter mon référent
            </a>
          )}
        </div>
      )}
      {!task.assignedTo && !isAgence && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm text-slate-500">Aucun référent assigné pour le moment. L’agence vous en désignera un après prise en charge de votre demande.</p>
        </div>
      )}

      {/* Demande de correction (visible par tous si présente) */}
      {task.correctionNote && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-800">Correction demandée par l'agence</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-amber-900">{task.correctionNote}</p>
        </div>
      )}

      {/* Actions statut : agence = prendre en charge / clôturer ; client = mettre en attente */}
      {onStatusChange && task.status !== "COMPLETE" && (
        <div className="flex flex-wrap gap-2">
          {isAgence && task.status === "EN_ATTENTE" && (
            <button
              type="button"
              onClick={() => onStatusChange("EN_COURS")}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Prendre en charge
            </button>
          )}
          {isAgence && task.status === "EN_COURS" && (
            <button
              type="button"
              onClick={() => onStatusChange("COMPLETE")}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              Marquer comme terminée
            </button>
          )}
          {task.status !== "EN_ATTENTE" && (
            <button
              type="button"
              onClick={() => onStatusChange("EN_ATTENTE")}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Mettre en attente
            </button>
          )}
        </div>
      )}

      {/* Validation / Correction (agence, tâche terminée mais pas encore validée) */}
      {isAgence && task.status === "COMPLETE" && !task.validatedAt && (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">Vérifier et valider le travail</h2>
          <p className="mb-4 text-sm text-slate-600">
            Après vérification, validez le travail de l'agent ou demandez une correction.
          </p>
          <div className="flex flex-wrap gap-4">
            <button
              type="button"
              onClick={onValidate}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              Valider le travail
            </button>
            <div className="flex flex-1 flex-col gap-2 min-w-[200px]">
              <textarea
                value={correctionNoteInput}
                onChange={(e) => onCorrectionNoteChange?.(e.target.value)}
                placeholder="Précisez ce qui doit être corrigé..."
                rows={2}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <button
                type="button"
                onClick={onRequestCorrection}
                disabled={!correctionNoteInput.trim()}
                className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100 disabled:opacity-50"
              >
                Demander une correction
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">Historique</h2>
        <TaskTimeline events={timelineEvents} />
      </div>
    </div>
  );
}
