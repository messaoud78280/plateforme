"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

type ProjectOption = { id: string; title: string };

/**
 * Mission sans chantier : le conducteur rattache la mission pour que les
 * pièces rejoignent le classeur (source de vérité GED).
 */
export function LinkMissionToChantier({
  taskId,
  projects,
  documentCount,
}: {
  taskId: string;
  projects: ProjectOption[];
  documentCount: number;
}) {
  const router = useRouter();
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (projects.length === 0) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50/90 p-4">
        <p className="text-sm font-semibold text-amber-900">Mission sans chantier</p>
        <p className="mt-1 text-xs text-amber-800">
          Aucun chantier pour ce client. Créez un chantier puis rattachez cette mission pour classer les
          pièces dans le classeur.
        </p>
        <Link
          href="/dashboard/projets"
          className="mt-3 inline-flex rounded-lg bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-800"
        >
          Voir les chantiers
        </Link>
      </div>
    );
  }

  async function handleLink() {
    if (!projectId || busy) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/projets/${projectId}/link-mission`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId }),
      });
      const data = (await res.json()) as {
        error?: string;
        synced?: number;
        skipped?: number;
        errors?: string[];
      };
      if (!res.ok) {
        setError(data.error ?? "Rattachement impossible.");
        return;
      }
      if (data.errors?.length) {
        setError(data.errors[0]);
      }
      setMessage(
        `Mission rattachée. ${data.synced ?? 0} pièce(s) dans le classeur${
          data.skipped ? `, ${data.skipped} déjà présente(s)` : ""
        }.`,
      );
      router.refresh();
    } catch {
      setError("Erreur réseau. Réessayez.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/90 p-4">
      <p className="text-sm font-semibold text-amber-900">Mission non rattachée à un chantier</p>
      <p className="mt-1 text-xs text-amber-800">
        Sans chantier, les pièces restent sur la mission et n&apos;apparaissent pas dans le classeur
        chantier
        {documentCount > 0 ? ` (${documentCount} pièce${documentCount > 1 ? "s" : ""} en attente)` : ""}.
        Rattachez pour synchroniser.
      </p>
      <div className="mt-3 flex flex-wrap items-end gap-2">
        <label className="min-w-[200px] flex-1 text-xs font-semibold text-amber-900">
          Chantier
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm text-slate-800"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          disabled={busy || !projectId}
          onClick={() => void handleLink()}
          className="rounded-lg bg-amber-700 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-800 disabled:opacity-50"
        >
          {busy ? "Rattachement…" : "Rattacher et importer au classeur"}
        </button>
      </div>
      {message ? <p className="mt-2 text-xs font-medium text-emerald-800">{message}</p> : null}
      {error ? <p className="mt-2 text-xs font-medium text-red-700">{error}</p> : null}
    </div>
  );
}
