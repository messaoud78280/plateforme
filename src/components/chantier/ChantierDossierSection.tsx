"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  CHANTIER_FILE_STATUS_COLORS,
  CHANTIER_FILE_STATUS_LABELS,
} from "@/lib/chantier-dossier/constants";
import { DocumentPreviewModal, type DocumentPreviewItem } from "@/components/documents/DocumentPreviewModal";
import { ChantierFileShareDialog } from "@/components/chantier/ChantierFileShareDialog";

export type ChantierFolderWithFiles = {
  id: string;
  code: string;
  label: string;
  files: {
    id: string;
    name: string;
    fileUrl: string | null;
    mimeType?: string | null;
    documentType: string | null;
    status: keyof typeof CHANTIER_FILE_STATUS_LABELS;
    comment: string | null;
    createdAt: string;
    addedBy: { name: string } | null;
    visibility?: string | null;
  }[];
};

const VISIBILITY_OPTIONS = [
  { value: "Interne entreprise cliente", label: "Interne" },
  { value: "Intervenants autorisés", label: "Partagé" },
] as const;

export function ChantierDossierSection({
  projectId,
  folders,
  canEdit,
}: {
  projectId: string;
  folders: ChantierFolderWithFiles[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [expandedFolder, setExpandedFolder] = useState<string | null>(
    folders.find((f) => f.files.length > 0)?.id ?? folders[0]?.id ?? null,
  );
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<DocumentPreviewItem | null>(null);
  const [shareFile, setShareFile] = useState<{ id: string; name: string } | null>(null);
  const [showAllFolders, setShowAllFolders] = useState(false);

  async function uploadToFolder(folderId: string, file: File) {
    const share = window.confirm(
      "Rendre ce document visible aux partenaires externes du chantier ?\n\nOK = Partagé · Annuler = Interne uniquement"
    );
    setBusy(folderId);
    setError("");
    const fd = new FormData();
    fd.set("projectId", projectId);
    fd.set("folderId", folderId);
    fd.set("file", file);
    fd.set(
      "visibility",
      share ? "Intervenants autorisés" : "Interne entreprise cliente"
    );
    try {
      const res = await fetch("/api/chantier/files/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Erreur upload");
      else router.refresh();
    } catch {
      setError("Erreur réseau");
    } finally {
      setBusy(null);
    }
  }

  async function updateVisibility(fileId: string, visibility: string) {
    setBusy(fileId);
    try {
      await fetch(`/api/chantier/files/${fileId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibility }),
      });
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function addPlaceholder(folderId: string) {
    const name = window.prompt("Intitulé de la pièce à récupérer (ex. Assurance décennale ST, BL livraison menuiseries…) :");
    if (!name?.trim()) return;
    setBusy(folderId);
    setError("");
    try {
      const res = await fetch("/api/chantier/files/placeholder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, folderId, name: name.trim(), status: "MANQUANT" }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Erreur");
      else router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function updateStatus(fileId: string, status: string) {
    setBusy(fileId);
    try {
      await fetch(`/api/chantier/files/${fileId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function renameFile(fileId: string, currentName: string) {
    const next = window.prompt("Nouveau nom du document :", currentName);
    if (!next?.trim() || next.trim() === currentName) return;

    setBusy(fileId);
    setError("");
    try {
      const res = await fetch(`/api/chantier/files/${fileId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: next.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Impossible de renommer le document.");
        return;
      }
      if (preview?.chantierFileId === fileId) {
        setPreview((p) => (p ? { ...p, name: next.trim() } : p));
      }
      router.refresh();
    } catch {
      setError("Erreur réseau lors du renommage.");
    } finally {
      setBusy(null);
    }
  }

  async function deleteFile(fileId: string, fileName: string) {
    const ok = window.confirm(
      `Supprimer « ${fileName} » du classeur chantier ?\n\nCette action est définitive (fichier et aperçu PDF éventuel).`
    );
    if (!ok) return;

    setBusy(fileId);
    setError("");
    if (preview?.chantierFileId === fileId) setPreview(null);

    try {
      const res = await fetch(`/api/chantier/files/${fileId}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error ?? "Impossible de supprimer ce document.");
        return;
      }
      router.refresh();
    } catch {
      setError("Erreur réseau lors de la suppression.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section id="dossier-chantier" className="scroll-mt-24 rounded-xl border border-slate-200 bg-white shadow-sm">
      <DocumentPreviewModal
        open={Boolean(preview)}
        onClose={() => setPreview(null)}
        item={preview}
      />
      <ChantierFileShareDialog
        open={Boolean(shareFile)}
        onClose={() => setShareFile(null)}
        projectId={projectId}
        fileId={shareFile?.id ?? ""}
        fileName={shareFile?.name ?? ""}
      />
      <div className="border-b border-slate-100 px-6 py-5">
        <h2 className="text-xl font-semibold text-slate-900">Documents du chantier</h2>
        <p className="mt-1 text-sm text-slate-600">
          Même GED que Documents global — filtrée sur ce chantier. Les pièces arrivent aussi depuis la messagerie, les commandes et les devis.
        </p>
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      </div>

      <div className="divide-y divide-slate-100">
        {folders.map((folder) => {
          const open = expandedFolder === folder.id;
          const missingCount = folder.files.filter((f) => f.status === "MANQUANT" || f.status === "A_RELANCER").length;
          const isEmpty = folder.files.length === 0;
          if (!showAllFolders && isEmpty && folder.code !== "00") return null;
          return (
            <div key={folder.id}>
              <button
                type="button"
                onClick={() => setExpandedFolder(open ? null : folder.id)}
                className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left hover:bg-slate-50/80"
              >
                <span className="min-w-0">
                  <span className="font-medium text-slate-900">{folder.label}</span>
                  {folder.files.length > 0 ? (
                    <span className="ml-2 text-sm text-slate-500">
                      {folder.files.length} doc{folder.files.length !== 1 ? "s" : ""}
                    </span>
                  ) : null}
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  {missingCount > 0 ? (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800">
                      {missingCount} à récupérer
                    </span>
                  ) : null}
                  <span className="text-slate-400">{open ? "▾" : "▸"}</span>
                </span>
              </button>

              {open ? (
                <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-4">
                  {canEdit ? (
                    <div className="mb-4 flex flex-wrap gap-2">
                      <label className="cursor-pointer rounded-lg border border-dashed border-[#1d4ed8]/50 bg-white px-4 py-2 text-sm font-medium text-[#1d4ed8] hover:bg-[#eff6ff]">
                        {busy === folder.id ? "Envoi…" : "+ Déposer un fichier"}
                        <input
                          type="file"
                          className="sr-only"
                          disabled={busy === folder.id}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) void uploadToFolder(folder.id, f);
                            e.target.value = "";
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        disabled={busy === folder.id}
                        onClick={() => void addPlaceholder(folder.id)}
                        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        + Pièce à récupérer
                      </button>
                    </div>
                  ) : null}

                  {folder.files.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      Aucun document pour l’instant. Déposez une pièce ou marquez une pièce à récupérer.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {folder.files.map((file) => (
                        <li
                          key={file.id}
                          className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-slate-900">{file.name}</p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {file.documentType ? `${file.documentType} · ` : ""}
                              {new Date(file.createdAt).toLocaleDateString("fr-FR")}
                              {file.addedBy ? ` · ${file.addedBy.name}` : ""}
                            </p>
                            {file.comment ? (
                              <p className="mt-1 text-xs text-slate-600">{file.comment}</p>
                            ) : null}
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            {canEdit ? (
                              <select
                                value={
                                  file.visibility === "Intervenants autorisés" ||
                                  file.visibility === "BeWork et entreprise cliente" ||
                                  file.visibility === "Partage temporaire"
                                    ? "Intervenants autorisés"
                                    : "Interne entreprise cliente"
                                }
                                disabled={busy === file.id}
                                onChange={(e) => void updateVisibility(file.id, e.target.value)}
                                className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700"
                                title="Visibilité INTERNE / PARTAGÉ"
                              >
                                {VISIBILITY_OPTIONS.map((o) => (
                                  <option key={o.value} value={o.value}>
                                    {o.label}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                                {file.visibility === "Intervenants autorisés" ||
                                file.visibility === "BeWork et entreprise cliente" ||
                                file.visibility === "Partage temporaire"
                                  ? "Partagé"
                                  : "Interne"}
                              </span>
                            )}
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${CHANTIER_FILE_STATUS_COLORS[file.status]}`}
                            >
                              {CHANTIER_FILE_STATUS_LABELS[file.status]}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setPreview({
                                  name: file.name,
                                  url: file.fileUrl,
                                  chantierFileId: file.id,
                                  mimeType: file.mimeType ?? null,
                                  createdAtLabel: new Date(file.createdAt).toLocaleString("fr-FR"),
                                  statusLabel: CHANTIER_FILE_STATUS_LABELS[file.status],
                                })
                              }
                              className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              Aperçu
                            </button>
                            {file.fileUrl ? (
                              <a
                                href={`/api/chantier/files/${file.id}/preview?download=original`}
                                target="_blank"
                                rel="noopener noreferrer"
                                download={file.name}
                                className="rounded-md bg-[#1d4ed8] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[#1e40af]"
                              >
                                Télécharger
                              </a>
                            ) : null}
                            {canEdit ? (
                              <button
                                type="button"
                                disabled={busy === file.id}
                                onClick={() => void renameFile(file.id, file.name)}
                                className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                              >
                                Renommer
                              </button>
                            ) : null}
                            {file.fileUrl ? (
                              <button
                                type="button"
                                disabled={busy === file.id}
                                onClick={() => setShareFile({ id: file.id, name: file.name })}
                                className="rounded-md border border-[#1d4ed8]/40 bg-[#eff6ff] px-2.5 py-1 text-xs font-semibold text-[#1d4ed8] hover:bg-[#dbeafe] disabled:opacity-50"
                              >
                                Partager
                              </button>
                            ) : null}
                            {canEdit ? (
                              <>
                                <select
                                  value={file.status}
                                  disabled={busy === file.id}
                                  onChange={(e) => void updateStatus(file.id, e.target.value)}
                                  className="rounded border border-slate-300 px-2 py-1 text-xs"
                                  aria-label="Statut du document"
                                >
                                  {Object.entries(CHANTIER_FILE_STATUS_LABELS).map(([k, label]) => (
                                    <option key={k} value={k}>
                                      {label}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  type="button"
                                  disabled={busy === file.id}
                                  onClick={() => void deleteFile(file.id, file.name)}
                                  className="rounded-md border border-red-200 bg-white px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                                  aria-label={`Supprimer ${file.name}`}
                                >
                                  {busy === file.id ? "…" : "Supprimer"}
                                </button>
                              </>
                            ) : null}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : null}
            </div>
          );
        })}
        {!showAllFolders && folders.some((f) => f.files.length === 0 && f.code !== "00") ? (
          <div className="px-6 py-4">
            <button
              type="button"
              onClick={() => setShowAllFolders(true)}
              className="text-sm font-medium text-[#1e3a5f] hover:underline"
            >
              Voir toutes les catégories
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
