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
    category?: string | null;
    priority?: string | null;
    desiredDate?: Date | string | null;
    estimatedActions?: string | null;
    assignedTo?: { id: string; name: string; email: string } | null;
    project?: { id: string; title: string } | null;
    documents?: { id: string; name: string; fileUrl: string; fileSize: number; mimeType: string | null }[];
  };
  canEdit: boolean;
  isAgence: boolean;
  isAgent?: boolean;
  agents?: { id: string; name: string; email: string }[];
}

export function TaskDetailClient({ sessionUserId, task, canEdit, isAgence, isAgent = false, agents = [] }: TaskDetailClientProps) {
  const router = useRouter();
  const [correctionNote, setCorrectionNote] = useState("");

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
      if (res.ok) router.refresh();
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
      if (res.ok) router.refresh();
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
      if (res.ok) router.refresh();
    } catch {
      // ignore
    }
  };

  const handleValidate = async () => {
    if (!isAgence) return;
    try {
      const res = await fetch(`/api/tasks/${task.id}/validate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "validate" }),
      });
      if (res.ok) router.refresh();
    } catch {
      // ignore
    }
  };

  const handleRequestCorrection = async () => {
    if (!isAgence) return;
    try {
      const res = await fetch(`/api/tasks/${task.id}/validate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "correction", correctionNote }),
      });
      if (res.ok) {
        setCorrectionNote("");
        router.refresh();
      }
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
      correctionNoteInput={correctionNote}
      onCorrectionNoteChange={setCorrectionNote}
    />
  );
}
