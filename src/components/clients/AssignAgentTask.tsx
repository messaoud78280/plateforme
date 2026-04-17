"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface AssignAgentTaskProps {
  taskId: string;
  taskTitle: string;
  assignedToId: string | null;
  assignedToName: string | null;
  agents: { id: string; name: string; email: string }[];
}

export function AssignAgentTask({
  taskId,
  taskTitle,
  assignedToId,
  assignedToName,
  agents,
}: AssignAgentTaskProps) {
  const router = useRouter();
  const [value, setValue] = useState(assignedToId ?? "");
  const [saving, setSaving] = useState(false);

  const handleChange = async () => {
    setSaving(true);
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedToId: value || null }),
      });
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleChange}
        disabled={saving}
        className="rounded-lg border border-[#c8cdd6] px-2 py-1.5 text-sm focus:border-[#1d4ed8] focus:outline-none focus:ring-1 focus:ring-[#1d4ed8] disabled:opacity-60"
        title={`Assigner un agent à la tâche : ${taskTitle}`}
      >
        <option value="">— Non assigné —</option>
        {agents.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </select>
      {assignedToName && (
        <span className="text-xs text-black">Actuel : {assignedToName}</span>
      )}
    </div>
  );
}
