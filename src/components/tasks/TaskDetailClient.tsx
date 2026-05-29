"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TaskDetailView } from "./TaskDetailView";
import type { TaskStatus } from "@/types";

interface TaskDetailClientProps {
  sessionUserId: string;
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
    creditsDeductedAt?: Date | string | null;
    clientReport?: string | null;
    clientReportSentAt?: Date | string | null;
    category?: string | null;
    priority?: string | null;
    desiredDate?: Date | string | null;
    estimatedActions?: string | null;
    assignedTo?: { id: string; name: string; email: string } | null;
    project?: { id: string; title: string } | null;
    client?: { id: string; name: string };
    documents?: { id: string; name: string; fileUrl: string; fileSize: number; mimeType: string | null; createdAt?: Date }[];
  };
  canEdit: boolean;
  isAgence: boolean;
  isAgent?: boolean;
  agents?: { id: string; name: string; email: string }[];
  onTaskUpdated?: () => void | Promise<void>;
}

export function TaskDetailClient({
  sessionUserId,
  task,
  canEdit,
  isAgence,
  isAgent = false,
  agents = [],
  onTaskUpdated,
}: TaskDetailClientProps) {
  const router = useRouter();
  const [correctionNote, setCorrectionNote] = useState("");
  const [correctionError, setCorrectionError] = useState<string | null>(null);
  const [correctionSuccess, setCorrectionSuccess] = useState<string | null>(null);
  const [correctionSending, setCorrectionSending] = useState(false);
  const [validateSending, setValidateSending] = useState(false);
  const [validateError, setValidateError] = useState<string | null>(null);

  async function afterTaskAction() {
    await onTaskUpdated?.();
    router.refresh();
  }

  const handleStatusChange = async (newStatus: TaskStatus, timeSpentMinutes?: number) => {
    if (!canEdit) return;
    try {
      const body: { status: TaskStatus; timeSpentMinutes?: number } = { status: newStatus };
      if ((newStatus === "COMPLETE" || newStatus === "A_VALIDER") && typeof timeSpentMinutes === "number" && timeSpentMinutes >= 0) {
        body.timeSpentMinutes = timeSpentMinutes;
      }
      const res = await fetch(`/api/tasks/${task.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) await afterTaskAction();
    } catch {
      // ignore
    }
  };

  const handleAssign = async (assignedToId: string | null) => {
    if (!isAgence) return;
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedToId: assignedToId || null }),
      });
      if (res.ok) await afterTaskAction();
    } catch {
      // ignore
    }
  };

  const handleAgencyNotes = async (agencyNotes: string) => {
    if (!isAgence) return;
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agencyNotes: agencyNotes || null }),
      });
      if (res.ok) await afterTaskAction();
    } catch {
      // ignore
    }
  };

  const handleValidate = async () => {
    if (!isAgence) return;
    setValidateError(null);
    setValidateSending(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}/validate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "validate" }),
      });
      if (res.ok) {
        await afterTaskAction();
      } else {
        const body = await res.json().catch(() => ({}));
        setValidateError(
          (body as { error?: string }).error ?? "Impossible de valider la mission."
        );
      }
    } catch {
      setValidateError("Erreur réseau. Réessayez dans un instant.");
    } finally {
      setValidateSending(false);
    }
  };

  const handleRequestCorrection = async (note: string) => {
    if (!isAgence) return;
    const trimmed = note.trim();
    if (!trimmed) {
      setCorrectionError("Décrivez la correction à apporter avant d'envoyer.");
      setCorrectionSuccess(null);
      return;
    }

    setCorrectionError(null);
    setCorrectionSuccess(null);
    setCorrectionSending(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}/validate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "correction", correctionNote: trimmed }),
      });
      if (res.ok) {
        setCorrectionNote("");
        setCorrectionSuccess("Correction envoyée à l'agent. La mission repasse en cours.");
        await afterTaskAction();
      } else {
        const body = await res.json().catch(() => ({}));
        setCorrectionError(
          (body as { error?: string }).error ??
            "Impossible d'envoyer la demande de correction."
        );
      }
    } catch {
      setCorrectionError("Erreur réseau. Réessayez dans un instant.");
    } finally {
      setCorrectionSending(false);
    }
  };

  const handlePriorityChange = async (priority: string | null) => {
    if (!isAgence) return;
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority }),
      });
      if (res.ok) await afterTaskAction();
    } catch {
      // ignore
    }
  };

  return (
    <TaskDetailView
      sessionUserId={sessionUserId}
      task={task}
      onStatusChange={canEdit ? handleStatusChange : undefined}
      isAgence={isAgence}
      isAgent={isAgent}
      agents={agents}
      onAssign={isAgence ? handleAssign : undefined}
      onAgencyNotesChange={isAgence ? handleAgencyNotes : undefined}
      onValidate={isAgence ? handleValidate : undefined}
      onRequestCorrection={isAgence ? handleRequestCorrection : undefined}
      onPriorityChange={isAgence ? handlePriorityChange : undefined}
      correctionNoteInput={correctionNote}
      onCorrectionNoteChange={(value) => {
        setCorrectionNote(value);
        if (correctionError) setCorrectionError(null);
        if (correctionSuccess) setCorrectionSuccess(null);
      }}
      correctionError={correctionError}
      correctionSuccess={correctionSuccess}
      correctionSending={correctionSending}
      validateSending={validateSending}
      validateError={validateError}
      onReportSent={afterTaskAction}
    />
  );
}
