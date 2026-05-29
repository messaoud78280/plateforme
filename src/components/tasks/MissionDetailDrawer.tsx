"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TaskDetailClient } from "./TaskDetailClient";
import type { TaskStatus } from "@/types";

interface MissionDetailDrawerProps {
  open: boolean;
  taskId: string | null;
  onClose: () => void;
  sessionUserId: string;
}

type DrawerTask = {
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
  priority?: string | null;
  desiredDate?: string | null;
  estimatedActions?: string | null;
  assignedTo?: { id: string; name: string; email: string } | null;
  project?: { id: string; title: string } | null;
  client?: { id: string; name: string };
  documents?: { id: string; name: string; fileUrl: string; fileSize: number; mimeType: string | null; createdAt?: Date }[];
};

function mapTaskFromApi(taskData: Record<string, unknown>): DrawerTask {
  const docs = (taskData.documents as Array<{
    id: string;
    name: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string | null;
    createdAt?: string;
  }> | undefined)?.map((d) => ({
    ...d,
    createdAt: d.createdAt ? new Date(d.createdAt) : undefined,
  }));

  return {
    ...(taskData as Omit<DrawerTask, "createdAt" | "updatedAt" | "completedAt" | "validatedAt" | "documents">),
    createdAt: taskData.createdAt ? new Date(String(taskData.createdAt)) : new Date(),
    updatedAt: taskData.updatedAt ? new Date(String(taskData.updatedAt)) : new Date(),
    completedAt: taskData.completedAt ? new Date(String(taskData.completedAt)) : null,
    validatedAt: taskData.validatedAt ? new Date(String(taskData.validatedAt)) : null,
    documents: docs ?? [],
  };
}

export function MissionDetailDrawer({ open, taskId, onClose, sessionUserId }: MissionDetailDrawerProps) {
  const router = useRouter();
  const [task, setTask] = useState<DrawerTask | null>(null);
  const [agents, setAgents] = useState<{ id: string; name: string; email: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTask = useCallback(async (id: string) => {
    const r = await fetch(`/api/tasks/${id}`);
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      const msg =
        (data && typeof data.error === "string")
          ? data.error
          : r.status === 404
            ? "Mission introuvable"
            : r.status === 401
              ? "Session expirée"
              : "Erreur au chargement";
      throw new Error(msg);
    }
    return mapTaskFromApi(data as Record<string, unknown>);
  }, []);

  useEffect(() => {
    if (!open || !taskId) {
      setTask(null);
      setAgents([]);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([
      loadTask(taskId),
      fetch("/api/agents").then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([taskData, agentsData]) => {
        if (cancelled) return;
        setTask(taskData);
        setAgents(Array.isArray(agentsData) ? agentsData : []);
        setError(null);
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err?.message ?? "Erreur au chargement");
          setTask(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, taskId, loadTask]);

  const handleTaskUpdated = useCallback(async () => {
    if (!taskId) return;
    try {
      const fresh = await loadTask(taskId);
      setTask(fresh);
      router.refresh();
    } catch {
      // ignore — la page complète se rafraîchira si ouverte
    }
  }, [loadTask, router, taskId]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-slate-900/50"
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-2xl flex-col border-l border-slate-200 bg-white shadow-xl"
        role="dialog"
        aria-label="Détail de la mission"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="text-lg font-semibold text-slate-800">
            {task ? task.title : "Mission"}
          </h2>
          <div className="flex items-center gap-2">
            {task && (
              <Link
                href={`/dashboard/taches/${task.id}`}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Ouvrir la page complète
              </Link>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white p-2 text-slate-600 hover:bg-slate-50"
              aria-label="Fermer"
            >
              <span className="text-lg leading-none">×</span>
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {loading && (
            <p className="py-8 text-center text-sm text-slate-500">Chargement…</p>
          )}
          {error && (
            <p className="py-8 text-center text-sm text-red-600">{error}</p>
          )}
          {!loading && !error && task && (
            <TaskDetailClient
              sessionUserId={sessionUserId}
              task={task}
              canEdit={true}
              isAgence={true}
              isAgent={false}
              agents={agents}
              onTaskUpdated={handleTaskUpdated}
            />
          )}
        </div>
      </div>
    </>
  );
}
