"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CHANTIER_FILE_STATUS_LABELS } from "@/lib/chantier-dossier/constants";

type ChantierFileRow = {
  id: string;
  name: string;
  fileUrl: string | null;
  status?: string;
  folder: { id: string; code: string; label: string };
  createdAt?: string;
};

type FolderRow = { id: string; code: string; label: string; sortOrder: number };

type Props = {
  taskId: string;
  projectId: string;
  projectTitle: string;
  missionType?: string | null;
  canEdit: boolean;
};

export function TaskChantierDocuments({
  taskId,
  projectId,
  projectTitle,
  canEdit,
}: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [linked, setLinked] = useState<ChantierFileRow[]>([]);
  const [available, setAvailable] = useState<ChantierFileRow[]>([]);
  const [folders, setFolders] = useState<FolderRow[]>([]);
  const [suggestedFolderId, setSuggestedFolderId] = useState<string | null>(null);
  const [suggestedFolderLabel, setSuggestedFolderLabel] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [linkOpen, setLinkOpen] = useState(false);
  const [uploadFolderId, setUploadFolderId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/tasks/${taskId}/chantier-files`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Impossible de charger le classeur.");
        return;
      }
      setLinked(data.linked ?? []);
      setAvailable(data.available ?? []);
      setFolders(data.folders ?? []);
      setSuggestedFolderId(data.suggestedFolderId ?? null);
      setSuggestedFolderLabel(data.suggestedFolderLabel ?? null);
      setUploadFolderId((prev) => prev || data.suggestedFolderId || data.folders?.[0]?.id || "");
    } catch {
      setError("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleLink(chantierFileId: string) {
    setActionId(chantierFileId);
    setError("");
    try {
      const res = await fetch(`/api/tasks/${taskId}/chantier-files`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chantierFileId, action: "link" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error ?? "Liaison impossible.");
        return;
      }
      setLinkOpen(false);
      await load();
      router.refresh();
    } catch {
      setError("Erreur réseau.");
    } finally {
      setActionId(null);
    }
  }

  async function handleUnlink(chantierFileId: string) {
    setActionId(chantierFileId);
    setError("");
    try {
      const res = await fetch(`/api/tasks/${taskId}/chantier-files`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chantierFileId, action: "unlink" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string }).error ?? "Déliaison impossible.");
        return;
      }
      await load();
      router.refresh();
    } catch {
      setError("Erreur réseau.");
    } finally {
      setActionId(null);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !uploadFolderId) return;
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.set("projectId", projectId);
      fd.set("folderId", uploadFolderId);
      fd.set("file", file);
      fd.set("taskId", taskId);
      const res = await fetch("/api/chantier/files/upload", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error ?? "Échec du dépôt.");
        return;
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
      await load();
      router.refresh();
    } catch {
      setError("Erreur réseau.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div id="chantier-docs-section" className="scroll-mt-6 rounded-xl surface-metallic-light p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Documents du classeur chantier</h2>
          <p className="mt-1 text-sm text-slate-500">
            Chantier :{" "}
            <Link href={`/dashboard/projets/${projectId}`} className="font-medium text-blue-600 hover:underline">
              {projectTitle}
            </Link>
          </p>
          {suggestedFolderLabel ? (
            <p className="mt-1 text-xs text-slate-500">
              Rubrique recommandée pour ce type de mission : {suggestedFolderLabel}
            </p>
          ) : null}
        </div>
        {canEdit ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setLinkOpen(true)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Lier un document existant
            </button>
          </div>
        ) : null}
      </div>

      {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}

      {loading ? (
        <p className="text-sm text-slate-500">Chargement…</p>
      ) : linked.length === 0 ? (
        <p className="mb-4 text-sm text-slate-500">Aucun document du classeur lié à cette mission.</p>
      ) : (
        <ul className="mb-4 space-y-2">
          {linked.map((f) => (
            <li
              key={f.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-slate-800">{f.name}</span>
                <span className="text-xs text-slate-500">
                  {f.folder.code} · {f.folder.label}
                  {f.status ? ` · ${CHANTIER_FILE_STATUS_LABELS[f.status as keyof typeof CHANTIER_FILE_STATUS_LABELS] ?? f.status}` : ""}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {f.fileUrl ? (
                  <a
                    href={`/api/chantier/files/${f.id}/preview?download=original`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-blue-600 hover:underline"
                  >
                    Ouvrir
                  </a>
                ) : null}
                {canEdit ? (
                  <button
                    type="button"
                    disabled={actionId === f.id}
                    onClick={() => void handleUnlink(f.id)}
                    className="text-sm text-slate-500 hover:text-red-600 disabled:opacity-50"
                  >
                    Retirer
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      {canEdit ? (
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/80 p-4">
          <h3 className="text-sm font-medium text-slate-700">Déposer un livrable dans le classeur</h3>
          <p className="mt-1 text-xs text-slate-500">
            Le fichier sera enregistré dans la rubrique choisie et lié automatiquement à cette mission.
          </p>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <div className="min-w-[200px] flex-1">
              <label className="mb-1 block text-xs font-medium text-slate-600">Rubrique</label>
              <select
                value={uploadFolderId}
                onChange={(e) => setUploadFolderId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                disabled={uploading}
              >
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.code} · {f.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => void handleUpload(e)}
                disabled={uploading || !uploadFolderId}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || !uploadFolderId}
                className="rounded-lg bg-[#1d4ed8] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1e40af] disabled:opacity-50"
              >
                {uploading ? "Envoi…" : "Choisir un fichier"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {linkOpen ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center px-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setLinkOpen(false)}
            aria-label="Fermer"
          />
          <div className="relative max-h-[80vh] w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-xl">
            <div className="border-b border-slate-200 px-5 py-4">
              <h3 className="text-base font-semibold text-slate-900">Lier un document du classeur</h3>
              <p className="mt-1 text-xs text-slate-500">Sélectionnez un fichier déjà présent sur le chantier.</p>
            </div>
            <div className="max-h-[50vh] overflow-y-auto px-5 py-3">
              {available.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-500">Aucun fichier disponible à lier.</p>
              ) : (
                <ul className="space-y-2">
                  {available.map((f) => (
                    <li key={f.id}>
                      <button
                        type="button"
                        disabled={actionId === f.id}
                        onClick={() => void handleLink(f.id)}
                        className="flex w-full items-start justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2 text-left hover:bg-slate-50 disabled:opacity-50"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-slate-800">{f.name}</span>
                          <span className="text-xs text-slate-500">
                            {f.folder.code} · {f.folder.label}
                          </span>
                        </span>
                        <span className="shrink-0 text-xs font-medium text-blue-600">Lier</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="border-t border-slate-200 px-5 py-3 text-right">
              <button
                type="button"
                onClick={() => setLinkOpen(false)}
                className="rounded-lg border px-3 py-1.5 text-sm text-slate-700"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
