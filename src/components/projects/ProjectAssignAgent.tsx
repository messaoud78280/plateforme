"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ProjectAssignAgentProps {
  projectId: string;
  assignedToId: string | null;
  assignedTo: { id: string; name: string; email: string } | null;
  agents: { id: string; name: string; email: string }[];
  isAgence: boolean;
}

export function ProjectAssignAgent({
  projectId,
  assignedToId,
  assignedTo,
  agents,
  isAgence,
}: ProjectAssignAgentProps) {
  const router = useRouter();
  const [value, setValue] = useState(assignedToId ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/projets/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedToId: value || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erreur lors de l’enregistrement.");
        setSaving(false);
        return;
      }
      router.refresh();
    } catch {
      setError("Erreur réseau.");
    }
    setSaving(false);
  };

  if (!isAgence && !assignedTo) {
    return (
      <div className="rounded-xl surface-metallic-light p-6">
        <h2 className="mb-2 text-lg font-semibold text-slate-800">Votre référent</h2>
        <p className="text-sm text-slate-500">Aucun référent assigné à ce projet pour le moment. L’agence vous en désignera un.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-6">
      <h2 className="mb-4 text-lg font-semibold text-slate-800">
        {isAgence ? "Agent en charge du projet" : "Votre référent"}
      </h2>

      {!isAgence ? (
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm text-slate-700">
            <span className="font-semibold text-slate-800">{assignedTo!.name}</span>
            {assignedTo!.email && (
              <span className="text-slate-600"> — {assignedTo!.email}</span>
            )}
          </p>
          {assignedTo!.email && (
            <a
              href={`mailto:${assignedTo!.email}`}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              Contacter mon référent
            </a>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Assigner un agent à ce projet
            </label>
            <select
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onBlur={handleSave}
              disabled={saving}
              className="w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60"
            >
              <option value="">— Aucun agent assigné —</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.email})
                </option>
              ))}
            </select>
            {assignedTo && (
              <p className="mt-1 text-sm text-slate-500">
                Actuellement : {assignedTo.name}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
