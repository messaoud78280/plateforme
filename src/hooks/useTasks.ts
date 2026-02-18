"use client";

import { useState, useEffect, useCallback } from "react";
import type { TaskStatus } from "@/types";

export interface TaskItem {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  clientId: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface UseTasksOptions {
  status?: TaskStatus;
}

export function useTasks(options: UseTasksOptions = {}) {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (options.status) params.set("status", options.status);
      const res = await fetch(`/api/tasks?${params.toString()}`);
      if (!res.ok) throw new Error("Erreur chargement tâches");
      const data = await res.json();
      setTasks(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [options.status]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const updateStatus = useCallback(
    async (taskId: string, status: TaskStatus) => {
      const res = await fetch(`/api/tasks/${taskId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) fetchTasks();
      return res.ok;
    },
    [fetchTasks]
  );

  return { tasks, loading, error, refetch: fetchTasks, updateStatus };
}
