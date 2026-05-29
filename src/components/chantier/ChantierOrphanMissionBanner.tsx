"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export type OrphanMissionGroup = {
  taskId: string;
  title: string;
  status: string;
  documents: { id: string; name: string }[];
};

export function ChantierOrphanMissionBanner({
  projectId,
  orphans,
}: {
  projectId: string;
  orphans: OrphanMissionGroup[];
}) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  if (orphans.length === 0) return null;

  async function handleLink(taskId: string) {
    setLoadingId(taskId);
    setMessage("");
    try {
      const res = await fetch(`/api/projets/${projectId}/link-mission`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "Import impossible.");
        return;
      }
      setMessage(
        `${data.synced ?? 0} pièce(s) importée(s) dans le classeur${data.skipped ? `, ${data.skipped} déjà présente(s)` : ""}.`
      );
      router.refresh();
    } catch {
      setMessage("Erreur réseau.");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50/90 p-4">
      <h3 className="text-sm font-semibold text-amber-900">
        Pièces sur des missions non rattachées à ce chantier
      </h3>
      <p className="mt-1 text-xs text-amber-800">
        Les documents déposés par un agent sur une mission restent sur la fiche mission tant que la mission
        n&apos;est pas liée à ce chantier. Importez-les pour les voir dans le classeur (ex. rubrique Devis).
      </p>
      <ul className="mt-3 space-y-3">
        {orphans.map((o) => (
          <li key={o.taskId} className="rounded-lg border border-amber-100 bg-white p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <Link
                  href={`/dashboard/taches/${o.taskId}`}
                  className="text-sm font-medium text-blue-700 hover:underline"
                >
                  {o.title}
                </Link>
                <p className="mt-1 text-xs text-slate-600">
                  {o.documents.length} fichier{o.documents.length > 1 ? "s" : ""} :{" "}
                  {o.documents.map((d) => d.name).join(", ")}
                </p>
              </div>
              <button
                type="button"
                disabled={loadingId === o.taskId}
                onClick={() => void handleLink(o.taskId)}
                className="shrink-0 rounded-lg bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-800 disabled:opacity-50"
              >
                {loadingId === o.taskId ? "Import…" : "Rattacher et importer"}
              </button>
            </div>
          </li>
        ))}
      </ul>
      {message ? <p className="mt-2 text-xs font-medium text-green-800">{message}</p> : null}
    </div>
  );
}
