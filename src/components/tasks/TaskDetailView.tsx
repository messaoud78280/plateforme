"use client";

import { useState } from "react";
import Link from "next/link";
import { TASK_STATUS_LABELS, type TaskStatus } from "@/types";
import { minutesToActions } from "@/lib/actions";
import { TaskTimeline } from "./TaskTimeline";
import { ClientDemandTimeline } from "./ClientDemandTimeline";
import { TaskConversation } from "./TaskConversation";

interface TaskDetailViewProps {
  sessionUserId?: string;
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
    timeSpentMinutes?: number | null;
    actionsUsed?: number | null;
    category?: string | null;
    priority?: string | null;
    desiredDate?: Date | string | null;
    estimatedActions?: string | null;
    assignedTo?: { id: string; name: string; email: string } | null;
    project?: { id: string; title: string } | null;
    documents?: { id: string; name: string; fileUrl: string; fileSize: number; mimeType: string | null }[];
  };
  onStatusChange?: (newStatus: TaskStatus, timeSpentMinutes?: number) => void;
  isAgence?: boolean;
  isAgent?: boolean;
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
  sessionUserId,
  task,
  onStatusChange,
  isAgence,
  isAgent = false,
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
  const [showCompleteForm, setShowCompleteForm] = useState(false);
  const [timeSpentMinutes, setTimeSpentMinutes] = useState(10);
  const canSetTimeOnComplete = isAgence || isAgent;

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
            {task.timeSpentMinutes != null && task.actionsUsed != null && (
              <p className="text-[#1d4ed8] font-medium">{task.timeSpentMinutes} min → {task.actionsUsed} action{task.actionsUsed > 1 ? "s" : ""}</p>
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
        {(task.category || task.priority || task.desiredDate || task.estimatedActions) && (
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
            {task.category && <span><strong>Catégorie :</strong> {task.category}</span>}
            {task.priority && <span><strong>Priorité :</strong> {task.priority === "URGENT" ? "Urgent" : task.priority === "PRIORITAIRE" ? "Prioritaire" : "Standard"}</span>}
            {task.desiredDate && <span><strong>Date souhaitée :</strong> {new Date(task.desiredDate).toLocaleDateString("fr-FR")}</span>}
            {task.estimatedActions && <span><strong>Estimation initiale :</strong> {task.estimatedActions}</span>}
          </div>
        )}
        {task.description && (
          <p className="mt-4 text-slate-600">{task.description}</p>
        )}
      </div>

      {/* Timeline client : 5 étapes (Demande reçue → Terminée) */}
      {!isAgence && (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-6 text-lg font-semibold text-slate-800">Avancement de votre demande</h2>
          <ClientDemandTimeline
            status={task.status}
            createdAt={task.createdAt}
            completedAt={task.completedAt}
            validatedAt={task.validatedAt ?? null}
          />
        </div>
      )}

      {/* Conversation liée (client) : messagerie intégrée ou lien */}
      {!isAgence && task.project && sessionUserId && (
        <TaskConversation
          projectId={task.project.id}
          projectTitle={task.project.title}
          sessionUserId={sessionUserId}
        />
      )}
      {!isAgence && !task.project && (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">Conversation</h2>
          <p className="text-sm text-slate-500">Aucun projet lié. Utilisez la messagerie pour échanger avec votre assistant.</p>
          <Link href="/dashboard/messagerie" className="mt-3 inline-block rounded-lg bg-[#1d4ed8] px-4 py-2 text-sm font-medium text-white hover:bg-[#1e40af]">
            Ouvrir la messagerie
          </Link>
        </div>
      )}

      {/* Documents liés à la demande */}
      {!isAgence && (
        <div id="documents" className="scroll-mt-6 rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">Documents</h2>
          {task.documents && task.documents.length > 0 ? (
            <ul className="space-y-2">
              {task.documents.map((doc) => (
                <li
                  key={doc.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3"
                >
                  <span className="min-w-0 truncate text-sm font-medium text-slate-800">{doc.name}</span>
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Télécharger
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">Aucun document pour le moment.</p>
          )}
          <Link
            href="/dashboard/documents"
            className="mt-4 inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Ajouter un document
          </Link>
        </div>
      )}

      {/* Pièces jointes (agence/agent) */}
      {(isAgence || isAgent) && task.documents && task.documents.length > 0 && (
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

      {/* Actions statut : agence/agent = prendre en charge / clôturer (avec temps) ; client = mettre en attente */}
      {onStatusChange && task.status !== "COMPLETE" && (
        <div className="flex flex-wrap items-end gap-4">
          {(isAgence || isAgent) && task.status === "EN_ATTENTE" && (
            <button
              type="button"
              onClick={() => onStatusChange("EN_COURS")}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Prendre en charge
            </button>
          )}
          {(isAgence || isAgent) && task.status === "EN_COURS" && !showCompleteForm && (
            <button
              type="button"
              onClick={() => setShowCompleteForm(true)}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              Marquer comme terminée
            </button>
          )}
          {(isAgence || isAgent) && task.status === "EN_COURS" && showCompleteForm && (
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <label className="text-sm font-medium text-slate-700">
                Temps passé (minutes) :
              </label>
              <input
                type="number"
                min={1}
                max={480}
                value={timeSpentMinutes}
                onChange={(e) => setTimeSpentMinutes(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-20 rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <span className="text-sm text-slate-600">
                = {minutesToActions(timeSpentMinutes)} action{minutesToActions(timeSpentMinutes) > 1 ? "s" : ""}
              </span>
              <button
                type="button"
                onClick={() => { onStatusChange("COMPLETE", timeSpentMinutes); setShowCompleteForm(false); }}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                Valider
              </button>
              <button
                type="button"
                onClick={() => setShowCompleteForm(false)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Annuler
              </button>
            </div>
          )}
          {task.status !== "EN_ATTENTE" && !(canSetTimeOnComplete && task.status === "EN_COURS" && showCompleteForm) && (
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

      {/* Validation / Correction (agence uniquement, tâche terminée mais pas encore validée) */}
      {isAgence && !isAgent && task.status === "COMPLETE" && !task.validatedAt && (
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
