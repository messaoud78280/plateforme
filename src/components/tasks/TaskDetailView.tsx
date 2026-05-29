"use client";

import { useState } from "react";
import Link from "next/link";
import { TASK_STATUS_LABELS, type TaskStatus } from "@/types";
import { minutesToActions } from "@/lib/actions";
import { TaskTimeline } from "./TaskTimeline";
import { TaskConversation } from "./TaskConversation";
import { TaskMessageConversation } from "./TaskMessageConversation";
import { TaskInternalNotes } from "./TaskInternalNotes";
import { DocumentUploadZone } from "@/components/documents/DocumentUploadZone";
import { documentDownloadHref } from "@/lib/documents/download-url";

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
    client?: { id: string; name: string };
    documents?: { id: string; name: string; fileUrl: string; fileSize: number; mimeType: string | null; createdAt?: Date }[];
  };
  onStatusChange?: (newStatus: TaskStatus, timeSpentMinutes?: number) => void;
  isAgence?: boolean;
  isAgent?: boolean;
  agents?: { id: string; name: string; email: string }[];
  onAssign?: (assignedToId: string | null) => void;
  onAgencyNotesChange?: (notes: string) => void;
  onValidate?: () => void;
  onRequestCorrection?: () => void;
  onPriorityChange?: (priority: string | null) => void;
  correctionNoteInput?: string;
  onCorrectionNoteChange?: (value: string) => void;
}

const statusColors: Record<TaskStatus, string> = {
  NOUVEAU: "bg-slate-100 text-slate-800",
  EN_ATTENTE: "bg-amber-100 text-amber-800",
  ASSIGNEE: "bg-indigo-100 text-indigo-800",
  EN_ANALYSE: "bg-blue-100 text-blue-800",
  EN_COURS: "bg-blue-100 text-blue-800",
  EN_ATTENTE_INFO: "bg-amber-100 text-amber-800",
  A_VALIDER: "bg-violet-100 text-violet-800",
  COMPLETE: "bg-green-100 text-green-800",
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
  onPriorityChange,
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

  const isManager = isAgence && !isAgent;

  return (
    <div className="space-y-6">
      {/* Raccourcis (gérante) */}
      {isManager && (
        <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <a
            href="#agent-section"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Assigner un agent
          </a>
          <a
            href="#priority-section"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Changer priorité
          </a>
          <a
            href="#status-section"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Changer statut
          </a>
          <a
            href="#messages-section"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Conversation
          </a>
          <a
            href="#documents-section"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Documents
          </a>
          {task.status === "A_VALIDER" && (
            <>
              <a href="#valider-section" className="rounded-lg border border-green-600 bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700">
                Valider mission
              </a>
              <a href="#correction-section" className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100">
                Demander modification
              </a>
            </>
          )}
        </div>
      )}

      {/* Raccourcis (agent) */}
      {isAgent && (
        <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <a
            href="#messages-section"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Contacter le client
          </a>
          <a
            href="#messages-section-internal"
            className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100"
          >
            Contacter la gérante (interne)
          </a>
          <a
            href="#documents-section"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Ajouter document
          </a>
          <a
            href="#status-section"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Changer statut
          </a>
          {(task.status === "EN_COURS" || task.status === "EN_ANALYSE" || task.status === "ASSIGNEE") && (
            <a
              href="#status-section"
              className="rounded-lg border border-green-600 bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              Terminer mission
            </a>
          )}
        </div>
      )}

      {/* En-tête : Titre, Client, Statut, Priorité, estimation crédits (agent) */}
      <div className="rounded-xl surface-metallic-light p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{task.title}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-600">
              {task.client && (isAgence || isAgent) && (
                <span><strong>Client :</strong> {task.client.name}</span>
              )}
              {task.assignedTo && !isAgent && (
                <span><strong>Agent assigné :</strong> {task.assignedTo.name}</span>
              )}
              <span
                className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${statusColors[task.status]}`}
              >
                {TASK_STATUS_LABELS[task.status]}
              </span>
              {task.priority && (
                <span>Priorité : {task.priority === "URGENT" ? "Urgent" : task.priority === "PRIORITAIRE" ? "Prioritaire" : "Standard"}</span>
              )}
              {(isAgent || isAgence) && task.estimatedActions && (
                <span><strong>Crédits estimés :</strong> {task.estimatedActions}</span>
              )}
            </div>
            {task.actionsUsed != null && task.actionsUsed > 0 && (
              <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-slate-800">
                <span className="font-semibold text-[#1d4ed8]">Consommation :</span>{" "}
                <span className="font-semibold">
                  {task.actionsUsed} crédit{task.actionsUsed > 1 ? "s" : ""}
                </span>
                {task.timeSpentMinutes != null ? (
                  <span className="text-slate-600"> (≈ {task.timeSpentMinutes} min)</span>
                ) : null}
                <span className="text-slate-500"> — 1 crédit = 12 min</span>
              </div>
            )}
            {(isAgence || isAgent) && (task.status === "A_VALIDER" || task.status === "COMPLETE") && task.actionsUsed == null && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Pour décompter les crédits, renseignez le <span className="font-semibold">temps passé (minutes)</span> lors de la
                clôture.
              </div>
            )}
            {task.validatedAt && (
              <span className="ml-2 inline-flex rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                Validé
              </span>
            )}
          </div>
          <div className="text-right text-sm text-slate-500">
            {task.assignedTo && (
              <p className="font-medium text-slate-700">
                {isAgence || isAgent ? "Agent en charge :" : "Votre référent :"} {task.assignedTo.name}
              </p>
            )}
            <p>Créée le {new Date(task.createdAt).toLocaleDateString("fr-FR")}</p>
            {task.completedAt && (
              <p>Terminée le {new Date(task.completedAt).toLocaleDateString("fr-FR")}</p>
            )}
            {task.timeSpentMinutes != null && task.actionsUsed != null && (
              <p className="text-[#1d4ed8] font-medium">{task.timeSpentMinutes} min → {task.actionsUsed} crédit{task.actionsUsed > 1 ? "s" : ""}</p>
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
        {(task.category || task.priority || task.desiredDate) && (
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
            {task.category && <span><strong>Catégorie :</strong> {task.category}</span>}
            {task.priority && <span><strong>Priorité :</strong> {task.priority === "URGENT" ? "Urgent" : task.priority === "PRIORITAIRE" ? "Prioritaire" : "Standard"}</span>}
            {task.desiredDate && <span><strong>Date souhaitée :</strong> {new Date(task.desiredDate).toLocaleDateString("fr-FR")}</span>}
          </div>
        )}
        {!isAgence && !isAgent && task.actionsUsed == null && (
          <p className="mt-3 text-sm text-slate-500">
            Crédits : en cours d&apos;évaluation par votre assistant.
          </p>
        )}
        {task.description && (
          <p className="mt-4 text-slate-600">{task.description}</p>
        )}
      </div>

      {/* Historique de la mission (client uniquement — agent le voit après Documents) */}
      {!isAgence && (
        <div id="historique-section" className="scroll-mt-6 rounded-xl surface-metallic-light p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">Historique</h2>
          <ul className="space-y-4">
            <li className="flex gap-3 border-l-2 border-slate-200 pl-4">
              <div>
                <p className="font-medium text-slate-800">Demande créée</p>
                <p className="text-xs text-slate-500">
                  {new Date(task.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </li>
            {task.assignedTo && (
              <li className="flex gap-3 border-l-2 border-slate-200 pl-4">
                <div>
                  <p className="font-medium text-slate-800">Agent assigné : {task.assignedTo.name}</p>
                  <p className="text-xs text-slate-500">Votre assistant prend en charge cette mission</p>
                </div>
              </li>
            )}
            {task.documents?.map((doc) => (
              <li key={doc.id} className="flex gap-3 border-l-2 border-slate-200 pl-4">
                <div>
                  <p className="font-medium text-slate-800">Document ajouté : {doc.name}</p>
                  {doc.createdAt && (
                    <p className="text-xs text-slate-500">
                      {new Date(doc.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  )}
                </div>
              </li>
            ))}
            {task.completedAt && (
              <li className="flex gap-3 border-l-2 border-green-200 pl-4">
                <div>
                  <p className="font-medium text-green-800">Mission terminée</p>
                  <p className="text-xs text-slate-500">
                    {new Date(task.completedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Notes internes (gérante + agent uniquement) */}
      {(isManager || (isAgent && task.assignedToId === sessionUserId)) && (
        <TaskInternalNotes taskId={task.id} />
      )}

      {/* Messages mission (client ↔ agent) — affichés uniquement si un agent est assigné */}
      {sessionUserId && task.assignedToId && (
        <div id="messages-section" className="scroll-mt-6">
        <TaskMessageConversation
          taskId={task.id}
          sessionUserId={sessionUserId}
          isClient={!isAgence && !isAgent}
          isAgence={Boolean(isAgence)}
          isAgent={Boolean(isAgent)}
          assignedToName={task.assignedTo?.name ?? null}
        />
        </div>
      )}
      {!task.assignedToId && !isAgence && !isAgent && (
        <div className="rounded-xl surface-metallic-light p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">Messages mission</h2>
          <p className="text-sm text-slate-500">
            La messagerie avec votre assistant sera disponible une fois qu&apos;un agent aura été assigné à cette mission.
          </p>
        </div>
      )}
      {/* Conversation projet (legacy, si projet lié) */}
      {!isAgence && task.project && sessionUserId && !task.assignedToId && (
        <TaskConversation
          projectId={task.project.id}
          projectTitle={task.project.title}
          sessionUserId={sessionUserId}
        />
      )}

      {/* Documents liés à la mission */}
      {!isAgence && (
        <div id="documents-section" className="scroll-mt-6 rounded-xl surface-metallic-light p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">Documents</h2>
          {task.documents && task.documents.length > 0 ? (
            <ul className="mb-6 space-y-2">
              {task.documents.map((doc) => (
                <li
                  key={doc.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-slate-800">{doc.name}</span>
                    {doc.createdAt && (
                      <span className="mt-0.5 block text-xs text-slate-500">
                        {new Date(doc.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
                  </div>
                  <a
                    href={documentDownloadHref(doc.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 rounded-lg surface-metallic-light px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Télécharger
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mb-6 text-sm text-slate-500">Aucun document pour le moment.</p>
          )}
          <h3 className="mb-3 text-sm font-medium text-slate-700">Ajouter un document</h3>
          <DocumentUploadZone
            taskId={task.id}
            category="AUTRE"
            onUploadEnd={() => typeof window !== "undefined" && window.location.reload()}
          />
        </div>
      )}

      {/* Pièces jointes (agence/agent) */}
      {(isAgence || isAgent) && (
        <div id="documents-section" className="scroll-mt-6">
      {task.documents && task.documents.length > 0 && (
        <div className="rounded-xl surface-metallic-light p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">Pièces jointes ({task.documents.length})</h2>
          <ul className="space-y-2">
            {task.documents.map((doc) => (
              <li
                key={doc.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
              >
                <span className="min-w-0 truncate text-sm text-slate-800">{doc.name}</span>
                <a
                  href={documentDownloadHref(doc.id)}
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
      {task.documents && task.documents.length === 0 && (
        <div className="rounded-xl surface-metallic-light p-6">
          <h2 className="mb-2 text-lg font-semibold text-slate-800">Pièces jointes</h2>
          <p className="text-sm text-slate-500">Aucune pièce jointe.</p>
        </div>
      )}
      {isAgent && (
        <div className="rounded-xl surface-metallic-light p-6">
          <h3 className="mb-3 text-sm font-medium text-slate-700">Ajouter un document</h3>
          <DocumentUploadZone
            taskId={task.id}
            category="AUTRE"
            onUploadEnd={() => typeof window !== "undefined" && window.location.reload()}
          />
        </div>
      )}
        </div>
      )}

      {/* Pour l'agent : Informations mission + Historique (ordre Conversation → Documents → Infos → Historique) */}
      {isAgent && (
        <>
          <div id="infos-mission-section" className="scroll-mt-6 rounded-xl surface-metallic-light p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-800">Informations mission</h2>
            {task.description && (
              <p className="mb-4 text-slate-600">{task.description}</p>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
              {task.category && <span><strong>Catégorie :</strong> {task.category}</span>}
              {task.priority && <span><strong>Priorité :</strong> {task.priority === "URGENT" ? "Urgent" : task.priority === "PRIORITAIRE" ? "Prioritaire" : "Standard"}</span>}
              {task.desiredDate && <span><strong>Date souhaitée :</strong> {new Date(task.desiredDate).toLocaleDateString("fr-FR")}</span>}
              {task.estimatedActions && <span><strong>Crédits estimés :</strong> {task.estimatedActions}</span>}
            </div>
            {!task.description && !task.category && !task.priority && !task.desiredDate && !task.estimatedActions && (
              <p className="text-sm text-slate-500">Aucune information complémentaire.</p>
            )}
          </div>
          <div id="historique-section" className="scroll-mt-6 rounded-xl surface-metallic-light p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-800">Historique</h2>
            <ul className="space-y-4">
              <li className="flex gap-3 border-l-2 border-slate-200 pl-4">
                <div>
                  <p className="font-medium text-slate-800">Mission créée</p>
                  <p className="text-xs text-slate-500">
                    {new Date(task.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </li>
              {task.assignedTo && (
                <li className="flex gap-3 border-l-2 border-slate-200 pl-4">
                  <div>
                    <p className="font-medium text-slate-800">Agent assigné : {task.assignedTo.name}</p>
                    <p className="text-xs text-slate-500">Mission assignée à vous</p>
                  </div>
                </li>
              )}
              {task.documents?.map((doc) => (
                <li key={doc.id} className="flex gap-3 border-l-2 border-slate-200 pl-4">
                  <div>
                    <p className="font-medium text-slate-800">Document ajouté : {doc.name}</p>
                    {doc.createdAt && (
                      <p className="text-xs text-slate-500">
                        {new Date(doc.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    )}
                  </div>
                </li>
              ))}
              {task.completedAt && (
                <li className="flex gap-3 border-l-2 border-green-200 pl-4">
                  <div>
                    <p className="font-medium text-green-800">Mission terminée</p>
                    <p className="text-xs text-slate-500">
                      {new Date(task.completedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </li>
              )}
            </ul>
          </div>
        </>
      )}

      {/* Changer priorité (gérante) */}
      {isAgence && onPriorityChange && (
        <div id="priority-section" className="scroll-mt-6 rounded-xl surface-metallic-light p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">Priorité</h2>
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm font-medium text-slate-700">Priorité de la mission :</label>
            <select
              value={task.priority ?? ""}
              onChange={(e) => onPriorityChange(e.target.value || null)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Standard</option>
              <option value="PRIORITAIRE">Prioritaire</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
        </div>
      )}

      {/* Agent en charge de la tâche — bloc visible pour l'agence (édition) */}
      {isAgence && (
        <div id="agent-section" className="scroll-mt-6 rounded-xl surface-metallic-light p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">Agent en charge de la tâche</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Assigner un agent à cette tâche</label>
              <select
                defaultValue={task.assignedToId ?? ""}
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

      {/* Historique de la mission (gérante) */}
      {isAgence && (
        <div id="historique-section" className="scroll-mt-6 rounded-xl surface-metallic-light p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">Historique</h2>
          <ul className="space-y-4">
            <li className="flex gap-3 border-l-2 border-slate-200 pl-4">
              <div>
                <p className="font-medium text-slate-800">Mission créée</p>
                <p className="text-xs text-slate-500">
                  {new Date(task.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </li>
            {task.assignedTo && (
              <li className="flex gap-3 border-l-2 border-slate-200 pl-4">
                <div>
                  <p className="font-medium text-slate-800">Agent assigné : {task.assignedTo.name}</p>
                  <p className="text-xs text-slate-500">Mission assignée à l&apos;agent</p>
                </div>
              </li>
            )}
            {task.documents?.map((doc) => (
              <li key={doc.id} className="flex gap-3 border-l-2 border-slate-200 pl-4">
                <div>
                  <p className="font-medium text-slate-800">Document ajouté : {doc.name}</p>
                  {doc.createdAt && (
                    <p className="text-xs text-slate-500">
                      {new Date(doc.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  )}
                </div>
              </li>
            ))}
            {task.completedAt && (
              <li className="flex gap-3 border-l-2 border-green-200 pl-4">
                <div>
                  <p className="font-medium text-green-800">Mission terminée</p>
                  <p className="text-xs text-slate-500">
                    {new Date(task.completedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Votre référent (client) */}
      {task.assignedTo && !isAgence && !isAgent && (
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
      {!task.assignedTo && !isAgence && !isAgent && (
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

      {/* Contrôles de statut : agence/agent = prendre en charge / clôturer (avec temps) ; client = mettre en attente */}
      {onStatusChange && task.status !== "COMPLETE" && task.status !== "A_VALIDER" && !task.validatedAt && (
        <div id="status-section" className="scroll-mt-6 flex flex-wrap items-end gap-4">
          {(isAgence || isAgent) && task.status === "EN_ATTENTE" && (
            <button
              type="button"
              onClick={() => onStatusChange("EN_COURS")}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Prendre en charge
            </button>
          )}
          {(isAgence || isAgent) && (task.status === "EN_COURS" || task.status === "EN_ANALYSE" || task.status === "ASSIGNEE") && !showCompleteForm && (
            <button
              type="button"
              onClick={() => setShowCompleteForm(true)}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              Marquer comme terminée
            </button>
          )}
          {(isAgence || isAgent) && (task.status === "EN_COURS" || task.status === "EN_ANALYSE" || task.status === "ASSIGNEE") && showCompleteForm && (
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
                = {minutesToActions(timeSpentMinutes)} crédit{minutesToActions(timeSpentMinutes) > 1 ? "s" : ""}
              </span>
              <button
                type="button"
                onClick={() => { onStatusChange("A_VALIDER", timeSpentMinutes); setShowCompleteForm(false); }}
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

      {/* Validation / Correction (gérante uniquement, statut A_VALIDER = en attente de validation) */}
      {isManager && task.status === "A_VALIDER" && (
        <div id="valider-section" className="scroll-mt-6 rounded-xl surface-metallic-light p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">Vérifier et valider le travail</h2>
          <p className="mb-4 text-sm text-slate-600">
            Après vérification, validez le travail de l&apos;agent ou demandez une correction.
          </p>
          <div className="flex flex-wrap gap-4">
            <button
              type="button"
              onClick={onValidate}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              Valider le travail
            </button>
            <div id="correction-section" className="scroll-mt-6 flex flex-1 flex-col gap-3 min-w-[260px]">
              <label className="text-sm font-medium text-slate-700">Demander une modification</label>
              <textarea
                value={correctionNoteInput}
                onChange={(e) => onCorrectionNoteChange?.(e.target.value)}
                placeholder="Précisez ce qui doit être corrigé… (vous pouvez aussi coller ici des liens vers des exemples, documents, captures d’écran, etc.)"
                rows={2}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <div className="rounded-lg border border-dashed border-amber-200 bg-amber-50/60 p-3">
                <p className="mb-2 text-xs font-medium text-amber-900">Pièces jointes pour la correction</p>
                <p className="mb-2 text-xs text-amber-900">
                  Ajoutez ici les documents, captures d’écran ou photos qui expliquent la correction à faire.
                </p>
                <DocumentUploadZone
                  taskId={task.id}
                  category="AUTRE"
                  onUploadEnd={() => typeof window !== "undefined" && window.location.reload()}
                />
              </div>
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
      <div className="rounded-xl surface-metallic-light p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">Historique</h2>
        <TaskTimeline events={timelineEvents} />
      </div>
    </div>
  );
}
